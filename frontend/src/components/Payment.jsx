import { useState, useEffect } from 'react'
import { getPrice, preparePayment } from '../services/api'
import axios from 'axios'

const STORE_ID = 'store-659090d9-bacb-4fbd-9de9-b4fc74e8fcaa'
const CHANNEL_KEY_CARD = import.meta.env.VITE_PORTONE_CHANNEL_KEY_CARD || ''

function loadPortOne() {
  return new Promise((resolve, reject) => {
    if (window.PortOne) return resolve(window.PortOne)
    const script = document.createElement('script')
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    script.onload = () => resolve(window.PortOne)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

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

      const PortOne = await loadPortOne()
      const response = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY_CARD,
        paymentId: order.merchant_uid,
        orderName: order.order_name,
        totalAmount: order.amount,
        currency: 'CURRENCY_KRW',
        customer: { fullName: '고객', phoneNumber: '010-0000-0000', email: 'customer@huamo.com' },
        payMethod: 'CARD',
        redirectUrl: window.location.origin + '/payment/redirect',
      })

      if (!response || response.code) {
        if (response?.code !== 'USER_CANCEL') {
          setError(response?.message || '결제 중 오류가 발생했어. 다시 시도해줘')
        }
        setLoading(false)
        return
      }

      const { data: confirmed } = await axios.post('/api/payment/confirm', {
        payment_id: response.paymentId,
        service_type: serviceType,
        cache_key: cacheKey,
      })

      if (confirmed.success) {
        onSuccess()
      } else {
        setError('결제 확인 실패. 다시 시도해줘')
        setLoading(false)
      }
    } catch (e) {
      setError('결제 중 오류가 발생했어. 다시 시도해줘')
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
        <div style={{
          width: '40px', height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '99px', margin: '0 auto 20px',
        }} />

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

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px', padding: '16px',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>
                  결제 금액
                </span>
                <span style={{
                  fontSize: '20px', fontWeight: '800',
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {priceInfo.amount.toLocaleString()}원
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
              {loading ? '결제 중...' : `${priceInfo.amount.toLocaleString()}원 결제하기`}
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
