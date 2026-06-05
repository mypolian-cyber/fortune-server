from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import os
import base64
import uuid

from app.database import get_db, Payment

router = APIRouter()

TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "")

PRICE_MAP = {
    "year_full": int(os.getenv("PRICE_YEAR_FULL", 900)),
    "life":      int(os.getenv("PRICE_LIFE",      1500)),
    "goonghap":  int(os.getenv("PRICE_GOONGHAP",  1500)),
    "yukim":     int(os.getenv("PRICE_YUKSYO",    1500)),
}

SERVICE_NAMES = {
    "year_full": "올해 기운 풀버전",
    "life":      "평생 기운",
    "goonghap":  "우리 궁합",
    "yukim":     "지금 이 질문",
}

VAT_RATE = 0.1

class PaymentRequest(BaseModel):
    service_type: str
    cache_key: str

class PaymentConfirm(BaseModel):
    payment_key: str
    order_id: str
    amount: int

@router.get("/price/{service_type}")
async def get_price(service_type: str):
    if service_type not in PRICE_MAP:
        raise HTTPException(status_code=404, detail="서비스 없음")
    base  = PRICE_MAP[service_type]
    vat   = int(base * VAT_RATE)
    total = base + vat
    return {
        "service_type": service_type,
        "service_name": SERVICE_NAMES.get(service_type, ""),
        "base_price":   base,
        "vat":          vat,
        "total":        total
    }

@router.post("/prepare")
async def prepare_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    if req.service_type not in PRICE_MAP:
        raise HTTPException(status_code=400, detail="잘못된 서비스 유형")

    base    = PRICE_MAP[req.service_type]
    vat     = int(base * VAT_RATE)
    total   = base + vat
    order_id = f"fortune_{req.service_type}_{uuid.uuid4().hex[:12]}"

    payment = Payment(
        payment_key  = None,
        service_type = req.service_type,
        amount       = total,
        status       = "pending",
        cache_key    = req.cache_key
    )
    db.add(payment)
    await db.commit()

    return {
        "order_id":    order_id,
        "order_name":  SERVICE_NAMES.get(req.service_type, "운세"),
        "amount":      total,
        "base_price":  base,
        "vat":         vat,
        "client_key":  os.getenv("TOSS_CLIENT_KEY", ""),
        "success_url": os.getenv("TOSS_SUCCESS_URL", ""),
        "fail_url":    os.getenv("TOSS_FAIL_URL", ""),
    }

@router.post("/confirm")
async def confirm_payment(req: PaymentConfirm, db: AsyncSession = Depends(get_db)):
    credentials = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.tosspayments.com/v1/payments/confirm",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type":  "application/json"
            },
            json={
                "paymentKey": req.payment_key,
                "orderId":    req.order_id,
                "amount":     req.amount
            },
            timeout=10.0
        )

    result = response.json()
    if response.status_code != 200:
        raise HTTPException(status_code=400,
            detail=result.get("message", "결제 승인 실패"))

    # DB 업데이트
    stmt = select(Payment).where(
        Payment.status == "pending",
        Payment.amount == req.amount
    )
    db_result = await db.execute(stmt)
    payment   = db_result.scalar_one_or_none()

    if payment:
        payment.payment_key = req.payment_key
        payment.status      = "completed"
        await db.commit()

    return {
        "success":     True,
        "payment_key": req.payment_key,
        "order_id":    req.order_id,
        "amount":      req.amount,
        "cache_key":   payment.cache_key if payment else None
    }

@router.get("/status/{payment_key}")
async def payment_status(payment_key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payment).where(Payment.payment_key == payment_key)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="결제 내역 없음")
    return {
        "status":       payment.status,
        "service_type": payment.service_type,
        "amount":       payment.amount,
        "cache_key":    payment.cache_key
    }

@router.get("/verify/{cache_key}/{service_type}")
async def verify_payment(
    cache_key: str,
    service_type: str,
    db: AsyncSession = Depends(get_db)
):
    """결제 완료 여부 확인 — 프론트에서 결과 표시 전 호출"""
    result = await db.execute(
        select(Payment).where(
            Payment.cache_key    == cache_key,
            Payment.service_type == service_type,
            Payment.status       == "completed"
        )
    )
    payment = result.scalar_one_or_none()
    return {"paid": payment is not None}
