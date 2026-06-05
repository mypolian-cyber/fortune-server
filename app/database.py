from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://fortune_user:fortune_pass_2026@localhost:5432/fortune"
)

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

class SajuCache(Base):
    __tablename__ = "saju_cache"
    id            = Column(Integer, primary_key=True)
    cache_key     = Column(String(100), unique=True, nullable=False)
    year          = Column(Integer, nullable=False)
    month         = Column(Integer, nullable=False)
    day           = Column(Integer, nullable=False)
    hour          = Column(Integer)
    gender        = Column(String(1), nullable=False)
    pillars       = Column(JSON, nullable=False)
    daewoon       = Column(JSON)
    mbti_origin_type   = Column(String(4))
    mbti_origin_scores = Column(JSON)
    created_at    = Column(DateTime, server_default=func.now())

class ReadingCache(Base):
    __tablename__ = "reading_cache"
    id           = Column(Integer, primary_key=True)
    cache_key    = Column(String(100), nullable=False)
    service_type = Column(String(20), nullable=False)
    target_year  = Column(Integer)
    reading      = Column(Text, nullable=False)
    created_at   = Column(DateTime, server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    id           = Column(Integer, primary_key=True)
    order_id     = Column(String(100), unique=True)
    payment_key  = Column(String(200), unique=True)
    service_type = Column(String(20), nullable=False)
    amount       = Column(Integer, nullable=False)
    status       = Column(String(20), default="pending")
    cache_key    = Column(String(100))
    created_at   = Column(DateTime, server_default=func.now())

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
