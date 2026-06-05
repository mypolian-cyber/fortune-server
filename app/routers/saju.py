from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.engines.mbti_engine import (
    calculate_origin_score, score_to_mbti,
    get_mbti_label, calculate_period_score
)
from app.services.claude_service import generate_reading
from app.engines.monthly_engine import (
    get_monthly_chart_data,
    get_daewoon_chart_data
)
from app.services.cache_service import (
    make_cache_key, get_saju_cache, set_saju_cache,
    get_reading_cache, set_reading_cache
)

router = APIRouter()

class SajuRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: Optional[int] = None
    minute: Optional[int] = 0
    gender: str
    service_type: str = "year"
    target_year: Optional[int] = None

@router.post("/calculate")
async def calculate_saju(req: SajuRequest, db: AsyncSession = Depends(get_db)):
    node_url = os.getenv("NODE_SERVICE_URL", "http://localhost:3001")
    target_year = req.target_year or datetime.now().year
    # year_full은 year와 동일한 사주 계산, 풀이만 다름
    effective_service = 'year' if req.service_type == 'year_full' else req.service_type
    cache_key = make_cache_key(req.year, req.month, req.day, req.hour, req.gender)

    # 1. 사주 캐시 확인
    saju_cached = await get_saju_cache(db, cache_key)

    if saju_cached:
        pillars = saju_cached.pillars
        daewoon = saju_cached.daewoon
        origin_scores = saju_cached.mbti_origin_scores
        mbti_type = saju_cached.mbti_origin_type
        cached = True
    else:
        # 2. orrery/core 사주 계산
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{node_url}/calculate",
                    json={
                        "year": req.year, "month": req.month,
                        "day": req.day, "hour": req.hour,
                        "minute": req.minute, "gender": req.gender
                    },
                    timeout=10.0
                )
                result = response.json()
                if not result.get("success"):
                    raise HTTPException(status_code=500, detail=result.get("error"))
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Node 서비스 연결 실패: {str(e)}")

        saju_data = result["data"]
        pillars = saju_data["pillars"]
        daewoon = saju_data["daewoon"]

        # 3. MBTI 계산
        origin_scores = calculate_origin_score(pillars)
        mbti_type = score_to_mbti(origin_scores)

        # 4. 사주 캐시 저장
        await set_saju_cache(
            db, cache_key,
            req.year, req.month, req.day, req.hour, req.gender,
            pillars, daewoon, mbti_type, origin_scores
        )
        cached = False

    # 5. MBTI 상세 계산
    mbti_labels = get_mbti_label(origin_scores)
    current_daewoon = None
    current_period_scores = origin_scores

    if daewoon:
        now = datetime.now()
        for dw in daewoon:
            start = datetime.fromisoformat(
                dw["startDate"].replace("Z", "+00:00")
            ).replace(tzinfo=None)
            if start.year <= now.year:
                current_daewoon = dw
        if current_daewoon:
            ganzi = current_daewoon["ganzi"]
            stem = ganzi[0] if len(ganzi) > 0 else ""
            branch = ganzi[1] if len(ganzi) > 1 else ""
            current_period_scores = calculate_period_score(
                origin_scores, {"stem": stem, "branch": branch}
            )

    mbti_data = {
        "origin_scores": origin_scores,
        "origin_type": mbti_type,
        "labels": mbti_labels,
        "current_daewoon": current_daewoon,
        "current_period_scores": current_period_scores,
        "current_period_type": score_to_mbti(current_period_scores),
    }

    # 6. 풀이 캐시 확인
    reading_cached = await get_reading_cache(db, cache_key, req.service_type, target_year)

    if reading_cached:
        reading = reading_cached.reading
    else:
        # 7. 풀이 생성 후 캐시 저장
        reading = await generate_reading(
            service_type=req.service_type,
            saju_data={"pillars": pillars, "daewoon": daewoon},
            mbti_data=mbti_data,
            gender=req.gender,
            target_year=target_year
        )
        await set_reading_cache(db, cache_key, req.service_type, reading, target_year)

    # 무료(year)는 차트 없음, 유료(year_full)는 차트 포함
    is_free_year = req.service_type == 'year'

    # 월별 파동 차트 (유료만)
    monthly_chart = get_monthly_chart_data(
        origin_scores, mbti_type,
        year=target_year
    )

    # 대운 파동 차트
    daewoon_chart = get_daewoon_chart_data(
        origin_scores, mbti_type,
        daewoon_list=daewoon or []
    )

    return {
        "success": True,
        "cached": cached,
        "saju": {"pillars": pillars, "daewoon": daewoon},
        "mbti": mbti_data,
        "reading": reading,
        "monthly_chart": monthly_chart,
        "daewoon_chart": daewoon_chart,
    }
