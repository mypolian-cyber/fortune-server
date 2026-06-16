from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class UnifiedPayment(Base):
    __tablename__ = "unified_payments"

    id              = Column(Integer, primary_key=True)
    service         = Column(String(20), nullable=False)   # huamo / ziwei
    service_type    = Column(String(30), nullable=False)   # year_full / ziwei_year 등
    order_id        = Column(String(100), unique=True)     # 주문번호
    payment_key     = Column(String(200))                  # 포트원 결제키
    birth_date      = Column(String(10))                   # 생년월일 YYYY-MM-DD
    gender          = Column(String(1))                    # M / F
    pay_method      = Column(String(20))                   # CARD / KAKAOPAY 등
    card_company    = Column(String(30))                   # 카드사
    card_last4      = Column(String(4))                    # 카드 뒷 4자리
    amount          = Column(Integer, nullable=False)      # 결제금액
    refund_amount   = Column(Integer, default=0)           # 환불금액
    refund_method   = Column(String(20))                   # API / CASH
    refund_reason   = Column(String(200))                  # 환불사유
    refund_memo     = Column(String(200))                  # 현금환불 시 계좌 메모
    status          = Column(String(20), default="completed")  # completed / refunded
    paid_at         = Column(DateTime)                     # 결제일시
    refunded_at     = Column(DateTime)                     # 환불일시
    created_at      = Column(DateTime, server_default=func.now())
