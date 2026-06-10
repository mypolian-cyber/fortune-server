import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Goonghap from './pages/Goonghap'
import Yukim from './pages/Yukim'
import Result from './pages/Result'
import PaymentModal from './components/Payment'
import ContactModal from './components/Contact'
import { calculateSaju, verifyPayment } from './services/api'

export default function App() {
  const [page, setPage] = useState('home')
  const [goonghapData, setGoonghapData] = useState(null)
  const [goonghapPreFill, setGoonghapPreFill] = useState(null)
  const [yukimPreFill, setYukimPreFill] = useState(null)
  const [sajuData, setSajuData] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingService, setPendingService] = useState(null)
  const [showContact, setShowContact] = useState(false)

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

  const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

  const goResult = (data) => {
    const freeServices = ['year']
    const serviceType  = data.form?.service_type

    if (freeServices.includes(serviceType) || TEST_MODE || isPaidToday(serviceType, data.form)) {
      setSajuData(data)
      setPage('result')
    } else {
      setSajuData(data)
      setPendingService(serviceType)
      setShowPayment(true)
    }
  }

  const goYukim = (formData = null) => {
    setPage('yukim')
    if (formData) setYukimPreFill(formData)
  }
  const goGoonghap = (formData = null) => {
    setPage('goonghap')
    if (formData) setGoonghapPreFill(formData)
  }

  const handleGoonghapResult = (data) => {
    setGoonghapData(data)
    setSajuData({ ...data, form: data.formA })
    if (TEST_MODE) {
      setPage('result')
    } else {
      setPendingService('goonghap')
      setShowPayment(true)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    setPage('result')
    // 오늘 결제한 서비스 localStorage에 저장
    try {
      const today = new Date().toISOString().split('T')[0]
      const key = `paid_${today}`
      const paid = JSON.parse(localStorage.getItem(key) || '[]')
      const form = sajuData?.form || sajuData?.formA || {}
      const serviceKey = `${form.year}_${form.month}_${form.day}_${form.gender}_${pendingService}`
      if (!paid.includes(serviceKey)) {
        paid.push(serviceKey)
        localStorage.setItem(key, JSON.stringify(paid))
      }
    } catch(e) {}
  }

  // 오늘 결제 여부 확인
  const isPaidToday = (serviceType, form) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const key = `paid_${today}`
      const paid = JSON.parse(localStorage.getItem(key) || '[]')
      const serviceKey = `${form?.year}_${form?.month}_${form?.day}_${form?.gender}_${serviceType}`
      return paid.includes(serviceKey)
    } catch(e) { return false }
  }

  const goHome = () => {
    setPage('home')
    setSajuData(null)
    setShowPayment(false)
    setPendingService(null)
    setYukimPreFill(null)
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
      {page === 'home' && <Home onResult={goResult} onGoonghap={goGoonghap} onYukim={goYukim} />}
      {page === 'yukim' && (
        <Yukim
          onResult={(data) => {
            setSajuData(data)
            if (TEST_MODE) {
              setPage('result')
            } else {
              setPendingService('yukim')
              setShowPayment(true)
            }
          }}
          onBack={goHome}
          preFill={yukimPreFill}
        />
      )}
      {page === 'goonghap' && (
        <Goonghap
          onResult={handleGoonghapResult}
          onBack={goHome}
          preFill={goonghapPreFill}
        />
      )}
      {page === 'result' && (
        <Result
          data={sajuData}
          goonghapData={goonghapData}
          onBack={goHome}
          onGoonghap={goGoonghap}
          onUpgrade={handleUpgrade}
          onServiceChange={(serviceType) => {
            if (serviceType === 'goonghap') {
              goGoonghap()
            } else if (serviceType === 'yukim') {
              goYukim(sajuData?.form || sajuData?.formA)
            } else if (TEST_MODE) {
              loadPaidResult(null, serviceType)
            } else {
              handleUpgrade(serviceType)
            }
          }}
        />
      )}
      {/* 문의하기 버튼 */}
      {(page === 'home') && (
        <button
          onClick={() => setShowContact(true)}
          style={{
            position: 'fixed', bottom: '20px', right: '20px',
            zIndex: 100,
            background: 'linear-gradient(135deg, rgba(30,10,60,0.95), rgba(10,5,40,0.95))',
            border: '1px solid rgba(150,80,255,0.4)',
            borderRadius: '50px',
            padding: '10px 18px',
            color: 'rgba(200,180,255,0.9)',
            fontSize: '13px', fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(120,40,255,0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          📩 문의하기
        </button>
      )}

      {/* 문의 모달 */}
      {showContact && (
        <ContactModal onClose={() => setShowContact(false)} />
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
