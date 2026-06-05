from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.database import get_db, SajuCache, Payment
from datetime import datetime, date
import os
import secrets
import csv
import io

router = APIRouter()
security = HTTPBasic()

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adelante2026")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    is_correct = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not is_correct:
        raise HTTPException(
            status_code=401,
            detail="비밀번호가 틀렸습니다",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: HTTPBasicCredentials = Depends(verify_admin)
):
    now = datetime.now()
    today = date.today()

    # 오늘 이용자
    today_result = await db.execute(
        select(func.count()).where(
            func.date(SajuCache.created_at) == today
        )
    )
    today_count = today_result.scalar() or 0

    # 이번달 이용자
    month_result = await db.execute(
        select(func.count()).where(
            extract('year',  SajuCache.created_at) == now.year,
            extract('month', SajuCache.created_at) == now.month,
        )
    )
    month_count = month_result.scalar() or 0

    # 전체 이용자
    total_result = await db.execute(select(func.count()).select_from(SajuCache))
    total_count = total_result.scalar() or 0

    # 성별 비율
    gender_result = await db.execute(
        select(SajuCache.gender, func.count()).group_by(SajuCache.gender)
    )
    gender_data = {row[0]: row[1] for row in gender_result.fetchall()}

    # 연령대
    age_result = await db.execute(
        select(SajuCache.year, func.count()).group_by(SajuCache.year)
    )
    age_rows = age_result.fetchall()
    age_groups = {"10대": 0, "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대+": 0}
    for birth_year, cnt in age_rows:
        if birth_year:
            age = now.year - birth_year
            if age < 20:   age_groups["10대"] += cnt
            elif age < 30: age_groups["20대"] += cnt
            elif age < 40: age_groups["30대"] += cnt
            elif age < 50: age_groups["40대"] += cnt
            elif age < 60: age_groups["50대"] += cnt
            else:          age_groups["60대+"] += cnt

    # 서비스별 이용
    service_result = await db.execute(
        select(Payment.service_type, func.count(), func.sum(Payment.amount))
        .where(Payment.status == "completed")
        .group_by(Payment.service_type)
    )
    service_data = [
        {"type": r[0], "count": r[1], "amount": r[2] or 0}
        for r in service_result.fetchall()
    ]

    # 오늘 결제
    today_pay = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(
            Payment.status == "completed",
            func.date(Payment.created_at) == today
        )
    )
    today_pay_row = today_pay.fetchone()
    today_pay_count  = today_pay_row[0] or 0
    today_pay_amount = today_pay_row[1] or 0

    # 이번달 결제
    month_pay = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(
            Payment.status == "completed",
            extract('year',  Payment.created_at) == now.year,
            extract('month', Payment.created_at) == now.month,
        )
    )
    month_pay_row = month_pay.fetchone()
    month_pay_count  = month_pay_row[0] or 0
    month_pay_amount = month_pay_row[1] or 0

    # 전체 결제
    total_pay = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(Payment.status == "completed")
    )
    total_pay_row = total_pay.fetchone()
    total_pay_count  = total_pay_row[0] or 0
    total_pay_amount = total_pay_row[1] or 0

    return {
        "users": {
            "today": today_count,
            "month": month_count,
            "total": total_count,
        },
        "gender": gender_data,
        "age_groups": age_groups,
        "services": service_data,
        "payments": {
            "today":  {"count": today_pay_count,  "amount": today_pay_amount},
            "month":  {"count": month_pay_count,  "amount": month_pay_amount},
            "total":  {"count": total_pay_count,  "amount": total_pay_amount},
        }
    }


@router.get("/download/users")
async def download_users(
    start: str = None,
    end: str = None,
    db: AsyncSession = Depends(get_db),
    _: HTTPBasicCredentials = Depends(verify_admin)
):
    """이용자 데이터 CSV 다운로드"""
    query = select(SajuCache)

    if start:
        query = query.where(SajuCache.created_at >= start)
    if end:
        query = query.where(SajuCache.created_at <= end + " 23:59:59")

    result = await db.execute(query.order_by(SajuCache.created_at.desc()))
    rows = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["번호", "생년", "월", "일", "시", "성별", "MBTI", "이용일시"])

    for i, r in enumerate(rows, 1):
        age = datetime.now().year - r.year if r.year else "-"
        writer.writerow([
            i,
            r.year or "-",
            r.month or "-",
            r.day or "-",
            r.hour if r.hour is not None else "모름",
            "남성" if r.gender == "M" else "여성",
            r.mbti_origin_type or "-",
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-",
        ])

    output.seek(0)
    filename = f"huamo_users_{start or 'all'}_{end or 'all'}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/download/payments")
async def download_payments(
    start: str = None,
    end: str = None,
    db: AsyncSession = Depends(get_db),
    _: HTTPBasicCredentials = Depends(verify_admin)
):
    """결제 데이터 CSV 다운로드"""
    query = select(Payment).where(Payment.status == "completed")

    if start:
        query = query.where(Payment.created_at >= start)
    if end:
        query = query.where(Payment.created_at <= end + " 23:59:59")

    result = await db.execute(query.order_by(Payment.created_at.desc()))
    rows = result.scalars().all()

    service_names = {
        "year":      "올해 기운(무료)",
        "year_full": "올해 기운 풀버전",
        "life":      "평생 기운",
        "goonghap":  "우리 궁합",
        "yukim":     "이 일은 이루어질까?",
    }

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["번호", "서비스", "금액", "결제일시", "주문ID"])

    for i, r in enumerate(rows, 1):
        writer.writerow([
            i,
            service_names.get(r.service_type, r.service_type),
            f"{r.amount:,}원",
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-",
            r.order_id or "-",
        ])

    output.seek(0)
    filename = f"huamo_payments_{start or 'all'}_{end or 'all'}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
