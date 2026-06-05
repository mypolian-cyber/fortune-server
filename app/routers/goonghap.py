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
    get_mbti_label, calculate_period_score,
    calculate_goonghap
)
from app.engines.monthly_engine import (
    get_monthly_chart_data,
    get_daewoon_chart_data
)
from app.services.cache_service import (
    make_cache_key, get_saju_cache, set_saju_cache,
    get_reading_cache, set_reading_cache
)
from app.services.claude_service import generate_goonghap_reading

router = APIRouter()

class PersonRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: Optional[int] = None
    minute: Optional[int] = 0
    gender: str

class GoonghapRequest(BaseModel):
    person_a: PersonRequest
    person_b: PersonRequest
    target_year: Optional[int] = None

async def get_person_data(req: PersonRequest, db, node_url: str, target_year: int):
    cache_key = make_cache_key(req.year, req.month, req.day, req.hour, req.gender)
    saju_cached = await get_saju_cache(db, cache_key)

    if saju_cached:
        pillars = saju_cached.pillars
        daewoon = saju_cached.daewoon
        origin_scores = saju_cached.mbti_origin_scores
        mbti_type = saju_cached.mbti_origin_type
    else:
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

        saju_data = result["data"]
        pillars = saju_data["pillars"]
        daewoon = saju_data["daewoon"]
        origin_scores = calculate_origin_score(pillars)
        mbti_type = score_to_mbti(origin_scores)

        await set_saju_cache(
            db, cache_key,
            req.year, req.month, req.day, req.hour, req.gender,
            pillars, daewoon, mbti_type, origin_scores
        )

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

    monthly_chart = get_monthly_chart_data(origin_scores, mbti_type, year=target_year)
    daewoon_chart = get_daewoon_chart_data(origin_scores, mbti_type, daewoon_list=daewoon or [])

    return {
        "cache_key": cache_key,
        "saju": {"pillars": pillars, "daewoon": daewoon},
        "mbti": mbti_data,
        "monthly_chart": monthly_chart,
        "daewoon_chart": daewoon_chart,
    }


@router.post("/calculate")
async def calculate_goonghap_result(req: GoonghapRequest, db: AsyncSession = Depends(get_db)):
    node_url = os.getenv("NODE_SERVICE_URL", "http://localhost:3001")
    target_year = req.target_year or datetime.now().year

    try:
        person_a = await get_person_data(req.person_a, db, node_url, target_year)
        person_b = await get_person_data(req.person_b, db, node_url, target_year)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Node 서비스 연결 실패: {str(e)}")

    # 궁합 긴장도 계산
    goonghap_score = calculate_goonghap(
        person_a["mbti"]["origin_scores"],
        person_b["mbti"]["origin_scores"]
    )

    # 캐시 키 (두 사람 조합)
    combined_key = f"goonghap_{person_a['cache_key']}_{person_b['cache_key']}"

    # 풀이 캐시 확인
    reading_cached = await get_reading_cache(db, combined_key, "goonghap", target_year)

    if reading_cached:
        reading = reading_cached.reading
    else:
        reading = await generate_goonghap_reading(
            person_a=person_a,
            person_b=person_b,
            goonghap_score=goonghap_score,
            target_year=target_year
        )
        await set_reading_cache(db, combined_key, "goonghap", reading, target_year)

    return {
        "success": True,
        "person_a": person_a,
        "person_b": person_b,
        "goonghap": goonghap_score,
        "reading": reading,
        "target_year": target_year,
    }
