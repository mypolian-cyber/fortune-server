import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Goonghap from './pages/Goonghap'
import Result from './pages/Result'
import PaymentModal from './components/Payment'
import { calculateSaju, verifyPayment } from './services/api'

export default function App() {
  const [page, setPage] = useState('home')
  const [goonghapData, setGoonghapData] = useState(null)
  const [sajuData, setSajuData] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingService, setPendingService] = useState(null)

  // 결제 성공 콜백 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentKey  = params.get('paymentKey')
    const orderId     = params.get('orderId')
    const amount      = params.get('amount')
    const cacheKey    = params.get('cache_key')
    const serviceType = params.get('service_type')

    if (paymentKey && orderId && amount) {
      // 결제 승인 처리
      fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_key: paymentKey,
          order_id:    orderId,
          amount:      parseInt(amount)
        })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // 결제 완료 후 유료 결과 불러오기
          window.history.replaceState({}, '', '/')
          if (cacheKey && serviceType) {
            loadPaidResult(cacheKey, serviceType)
          }
        }
      })
      .catch(console.error)
    }
  }, [])

  const loadPaidResult = async (cacheKey, serviceType) => {
    try {
      // 기존 sajuData가 있으면 service_type만 바꿔서 재요청
      if (sajuData?.form) {
        const result = await calculateSaju({
          ...sajuData.form,
          year:         parseInt(sajuData.form.year),
          month:        parseInt(sajuData.form.month),
          day:          parseInt(sajuData.form.day),
          service_type: serviceType,
          target_year:  new Date().getFullYear()
        })
        setSajuData({ ...result, form: sajuData.form })
        setPage('result')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const goResult = (data) => {
    const freeServices = ['year']
    const serviceType  = data.form?.service_type

    if (freeServices.includes(serviceType)) {
      setSajuData(data)
      setPage('result')
    } else {
      setSajuData(data)
      setPendingService(serviceType)
      setShowPayment(true)
    }
  }

  const goGoonghap = () => setPage('goonghap')

  const handleGoonghapResult = (data) => {
    setGoonghapData(data)
    setPendingService('goonghap')
    setSajuData(data.personA)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    setPage('result')
  }

  const goHome = () => {
    setPage('home')
    setSajuData(null)
    setShowPayment(false)
    setPendingService(null)
  }

  // 결제 후 유료 서비스 업그레이드 (결과 화면에서 유료 버튼 클릭시)
  const handleUpgrade = (serviceType) => {
    setPendingService(serviceType)
    setShowPayment(true)
  }

  const getCacheKey = () => {
    if (!sajuData?.form) return ''
    const { year, month, day, hour, gender } = sajuData.form
    return `${year}_${month}_${day}_${hour}_${gender}`
  }

  return (
    <div className="min-h-screen">
      {page === 'home' && <Home onResult={goResult} onGoonghap={goGoonghap} />}
      {page === 'goonghap' && (
        <Goonghap
          onResult={handleGoonghapResult}
          onBack={goHome}
        />
      )}
      {page === 'result' && (
        <Result
          data={sajuData}
          onBack={goHome}
          onUpgrade={handleUpgrade}
        />
      )}
      {showPayment && pendingService && (
        <PaymentModal
          serviceType={pendingService}
          cacheKey={getCacheKey()}
          onSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPayment(false)
            if (sajuData) setPage('result')
          }}
        />
      )}
    </div>
  )
}
