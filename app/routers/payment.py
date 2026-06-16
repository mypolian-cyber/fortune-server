from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import os
import uuid

from app.database import get_db, Payment

router = APIRouter()

PORTONE_SECRET = os.getenv("PORTONE_SECRET_KEY", "")
PORTONE_STORE_ID = os.getenv("PORTONE_STORE_ID", "")

PRICE_MAP = {
    "year_full": int(os.getenv("PRICE_YEAR_FULL", 990)),
    "life":      int(os.getenv("PRICE_LIFE",      3900)),
    "goonghap":  int(os.getenv("PRICE_GOONGHAP",  1990)),
    "yukim":     int(os.getenv("PRICE_YUKSYO",    990)),
}

SERVICE_NAMES = {
    "year_full": "올해 기운 풀버전",
    "life":      "평생 기운",
    "goonghap":  "우리 궁합",
    "yukim":     "지금 이 질문",
}

class PaymentRequest(BaseModel):
    service_type: str
    cache_key: str

class PaymentConfirm(BaseModel):
    payment_id: str
    service_type: str
    cache_key: Optional[str] = ""

@router.get("/price/{service_type}")
async def get_price(service_type: str):
    if service_type not in PRICE_MAP:
        raise HTTPException(status_code=404, detail="서비스 없음")
    amount = PRICE_MAP[service_type]
    return {
        "service_type": service_type,
        "service_name": SERVICE_NAMES.get(service_type, ""),
        "amount": amount,
    }

@router.post("/prepare")
async def prepare_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    if req.service_type not in PRICE_MAP:
        raise HTTPException(status_code=400, detail="잘못된 서비스 유형")

    amount = PRICE_MAP[req.service_type]
    merchant_uid = f"fortune-{req.service_type.replace("_", "-")}-{uuid.uuid4().hex[:12]}"

    payment = Payment(
        order_id=merchant_uid,
        payment_key=None,
        service_type=req.service_type,
        amount=amount,
        status="pending",
        cache_key=req.cache_key
    )
    db.add(payment)
    await db.commit()

    return {
        "merchant_uid": merchant_uid,
        "order_name": SERVICE_NAMES.get(req.service_type, "운세"),
        "amount": amount,
        "store_id": PORTONE_STORE_ID,
    }

@router.post("/confirm")
async def confirm_payment(req: PaymentConfirm, db: AsyncSession = Depends(get_db)):
    if req.service_type not in PRICE_MAP:
        raise HTTPException(status_code=400, detail="잘못된 서비스 유형")

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"https://api.portone.io/payments/{req.payment_id}",
            headers={"Authorization": f"PortOne {PORTONE_SECRET}"}
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="포트원 결제 조회 실패")

    portone_payment = r.json()
    if portone_payment.get("status") != "PAID":
        raise HTTPException(status_code=400, detail=f"결제 미완료: {portone_payment.get('status')}")

    paid_amount = portone_payment.get("amount", {}).get("total", 0)
    if paid_amount != PRICE_MAP[req.service_type]:
        raise HTTPException(status_code=400, detail="결제 금액 불일치")

    merchant_uid = portone_payment.get("merchantPaymentId", "")

    stmt = select(Payment).where(Payment.order_id == merchant_uid)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    # 카드정보 추출
    pay_method_data = portone_payment.get("method", {})
    card_company = ""
    card_last4   = ""
    pay_method_str = "CARD"
    if "card" in pay_method_data:
        card_info    = pay_method_data.get("card", {})
        card_company = card_info.get("issuer", {}).get("name", "")
        card_num     = card_info.get("number", "")
        card_last4   = card_num[-4:] if card_num else ""
        pay_method_str = "CARD"
    elif "easyPay" in pay_method_data:
        pay_method_str = pay_method_data.get("easyPay", {}).get("provider", "EASYPAY")

    if payment:
        payment.payment_key = req.payment_id
        payment.status = "completed"
        await db.commit()
        cache_key = payment.cache_key
    else:
        cache_key = req.cache_key

    # unified_payments 저장
    from app.models.unified_payment import UnifiedPayment
    from datetime import datetime
    unified = UnifiedPayment(
        service      = "huamo",
        service_type = req.service_type,
        order_id     = merchant_uid,
        payment_key  = req.payment_id,
        pay_method   = pay_method_str,
        card_company = card_company,
        card_last4   = card_last4,
        amount       = paid_amount,
        status       = "completed",
        paid_at      = datetime.utcnow(),
    )
    db.add(unified)
    await db.commit()

    return {
        "success": True,
        "payment_key": req.payment_id,
        "order_id": merchant_uid,
        "amount": paid_amount,
        "cache_key": cache_key,
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
        "status": payment.status,
        "service_type": payment.service_type,
        "amount": payment.amount,
        "cache_key": payment.cache_key,
    }

@router.get("/verify/{cache_key}/{service_type}")
async def verify_payment(cache_key: str, service_type: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payment).where(
            Payment.cache_key == cache_key,
            Payment.service_type == service_type,
            Payment.status == "completed"
        )
    )
    payment = result.scalar_one_or_none()
    return {"paid": payment is not None}
