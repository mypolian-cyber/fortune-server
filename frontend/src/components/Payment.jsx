import { useState, useEffect } from 'react'
import { getPrice, preparePayment } from '../services/api'

export default function PaymentModal({ serviceType, cacheKey, onSuccess, onClose }) {
  const [priceInfo, setPriceInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPrice(serviceType).then(setPriceInfo).catch(() => {
      setError('가격 정보를 불러오지 못했어')
    })
  }, [serviceType])

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const order = await preparePayment({ service_type: serviceType, cache_key: cacheKey })

      // 토스페이먼츠 결제창 호출
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
      const toss = await loadTossPayments(order.client_key)

      await toss.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl: `${window.location.origin}/payment/success?cache_key=${cacheKey}&service_type=${serviceType}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: undefined,
        customerName: undefined,
      })
    } catch (e) {
      if (e.code !== 'USER_CANCEL') {
        setError('결제 중 오류가 발생했어. 다시 시도해줘')
      }
      setLoading(false)
    }
  }

  const SERVICE_EMOJI = {
    year_full: '📊',
    life:      '🌙',
    goonghap:  '💫',
    yukim:     '🔮',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(160deg, #1a0a2e, #16213e)',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* 핸들 */}
        <div style={{
          width: '40px', height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '99px', margin: '0 auto 20px',
        }} />

        {/* 후아모 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/huamo2.png" alt="후아모"
            style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
        </div>

        {priceInfo ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {SERVICE_EMOJI[serviceType]}
              </div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700',
                marginBottom: '4px' }}>
                {priceInfo.service_name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                후아모가 자세히 읽어줄게 🤍
              </div>
            </div>

            {/* 가격 */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px', padding: '16px',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  기본가
                </span>
                <span style={{ color: '#fff', fontSize: '13px' }}>
                  {priceInfo.base_price.toLocaleString()}원
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: '12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  부가세 (10%)
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  {priceInfo.vat.toLocaleString()}원
                </span>
              </div>
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '12px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>
                  합계
                </span>
                <span style={{
                  fontSize: '20px', fontWeight: '800',
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {priceInfo.total.toLocaleString()}원
                </span>
              </div>
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: '12px',
                textAlign: 'center', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <button onClick={handlePay} disabled={loading} style={{
              width: '100%', padding: '16px',
              borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: loading
                ? 'rgba(167,139,250,0.3)'
                : 'linear-gradient(135deg, #a78bfa, #ec4899)',
              color: '#fff', fontSize: '16px', fontWeight: '700',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(167,139,250,0.4)',
              marginBottom: '12px',
            }}>
              {loading ? '결제 중...' : `${priceInfo.total.toLocaleString()}원 결제하기`}
            </button>

            <button onClick={onClose} style={{
              width: '100%', padding: '12px',
              borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.3)', fontSize: '13px',
            }}>
              다음에 할게
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)',
            padding: '40px 0' }}>
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  )
}
