import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.database import SajuCache, ReadingCache

def make_cache_key(year: int, month: int, day: int, hour, gender: str) -> str:
    """캐시 키 생성"""
    raw = f"{year}_{month}_{day}_{hour}_{gender}"
    return hashlib.md5(raw.encode()).hexdigest()

async def get_saju_cache(db: AsyncSession, cache_key: str):
    """사주 캐시 조회"""
    result = await db.execute(
        select(SajuCache).where(SajuCache.cache_key == cache_key)
    )
    return result.scalar_one_or_none()

async def set_saju_cache(
    db: AsyncSession,
    cache_key: str,
    year: int, month: int, day: int, hour, gender: str,
    pillars: list, daewoon: list,
    mbti_origin_type: str, mbti_origin_scores: dict
):
    """사주 캐시 저장"""
    cache = SajuCache(
        cache_key=cache_key,
        year=year, month=month, day=day,
        hour=hour, gender=gender,
        pillars=pillars, daewoon=daewoon,
        mbti_origin_type=mbti_origin_type,
        mbti_origin_scores=mbti_origin_scores
    )
    db.add(cache)
    await db.commit()
    return cache

async def get_reading_cache(
    db: AsyncSession,
    cache_key: str,
    service_type: str,
    target_year: int = None
):
    """풀이 캐시 조회"""
    query = select(ReadingCache).where(
        ReadingCache.cache_key == cache_key,
        ReadingCache.service_type == service_type,
        ReadingCache.target_year == target_year
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def set_reading_cache(
    db: AsyncSession,
    cache_key: str,
    service_type: str,
    reading: str,
    target_year: int = None
):
    """풀이 캐시 저장 (동시 요청으로 인한 중복 INSERT는 무시)"""
    stmt = pg_insert(ReadingCache).values(
        cache_key=cache_key,
        service_type=service_type,
        target_year=target_year,
        reading=reading
    ).on_conflict_do_nothing(
        index_elements=["cache_key", "service_type", "target_year"]
    )
    await db.execute(stmt)
    await db.commit()
