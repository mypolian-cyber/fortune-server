import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Goonghap from './pages/Goonghap'
import Yukim from './pages/Yukim'
import Result from './pages/Result'
import Privacy from './pages/Privacy'
import PaymentModal from './components/Payment'
import ContactModal from './components/Contact'
import axios from 'axios'
import { calculateSaju, calculateGoonghap } from './services/api'

export default function App() {
  const [page, setPage] = useState('home')
  const [goonghapData, setGoonghapData] = useState(null)
  const [goonghapPreFill, setGoonghapPreFill] = useState(null)
  const [yukimPreFill, setYukimPreFill] = useState(null)
  const [privacyTab, setPrivacyTab] = useState('privacy')
  const [sajuData, setSajuData] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingService, setPendingService] = useState(null)
  const [showContact, setShowContact] = useState(false)
  const [loadingResult, setLoadingResult] = useState(false)

  const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'


  useEffect(() => {

    if (window.location.pathname !== '/payment/redirect') return

    const params = new URLSearchParams(window.location.search)

    const paymentId = params.get('payment_id')

    window.history.replaceState({}, '', '/')

    if (!paymentId) return

    let saved = null

    try { saved = JSON.parse(sessionStorage.getItem('_pending') || 'null') } catch(e) {}

    if (!saved) return

    sessionStorage.removeItem('_pending')

    axios.post('/api/payment/confirm', {

      payment_id: paymentId,

      service_type: saved.serviceType,

      cache_key: saved.cacheKey || '',

    }).then(({ data }) => {

      if (data.success) {

        setSajuData(saved.sajuData)

        setPendingService(saved.serviceType)

        if (saved.serviceType === 'goonghap') {

          loadPaidGoonghapResult({ formA: saved.sajuData?.formA || saved.sajuData?.form, formB: saved.sajuData?.formB })

        } else if (saved.serviceType === 'yukim') {

          loadPaidYukimResult()

        } else {

          loadPaidResult(null, saved.serviceType, saved.sajuData)

        }

      }

    }).catch(() => {

      alert('\uacb0\uc81c \ud655\uc778 \uc624\ub958. \uace0\uac1d\uc13c\ud130\uc5d0 \ubb38\uc758\ud574\uc918.')

    })

  }, [])



  const loadPaidResult = async (cacheKey, serviceType, overrideSajuData = null) => {
    if (loadingResult) return
    const source = overrideSajuData || sajuData
    try {
      if (source?.form) {
        setLoadingResult(true)
        const result = await calculateSaju({
          ...source.form,
          year:         parseInt(source.form.year),
          month:        parseInt(source.form.month),
          day:          parseInt(source.form.day),
          service_type: serviceType,
          target_year:  new Date().getFullYear()
        })
        setSajuData({ ...result, form: { ...source.form, service_type: serviceType } })
        setPage('result')
      }
    } catch (e) {
      console.error(e)
      alert('운세를 불러오는데 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요 🤍')
    } finally {
      setLoadingResult(false)
    }
  }

  const loadPaidYukimResult = async () => {
    if (loadingResult) return
    try {
      setLoadingResult(true)
      const { calculateYukim } = await import('./services/api')
      const yukimData = sajuData
      const result = await calculateYukim({
        year: parseInt(yukimData?.form?.year || new Date().getFullYear()),
        month: parseInt(yukimData?.form?.month || new Date().getMonth() + 1),
        day: parseInt(yukimData?.form?.day || new Date().getDate()),
        hour: yukimData?.form?.hour ?? null,
        minute: 0,
        gender: yukimData?.form?.gender || 'M',
        calendar: yukimData?.form?.calendar || 'solar',
        question_type: yukimData?.question_type,
        question_items: yukimData?.question_items,
        question_text: yukimData?.question_text,
      })
      setSajuData({ ...result, type: 'yukim', form: yukimData?.form,
        question_type: yukimData?.question_type,
        question_items: yukimData?.question_items,
        question_text: yukimData?.question_text,
      })
      setPage('result')
    } catch (e) {
      console.error(e)
      alert('육임을 불러오는데 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요 🤍')
    } finally {
      setLoadingResult(false)
    }
  }

  const loadPaidGoonghapResult = async (goonghapForm) => {
    if (loadingResult) return
    try {
      setLoadingResult(true)
      const result = await calculateGoonghap({
        person_a: {
          year: parseInt(goonghapForm.formA.year),
          month: parseInt(goonghapForm.formA.month),
          day: parseInt(goonghapForm.formA.day),
          hour: goonghapForm.formA.hour,
          minute: 0,
          gender: goonghapForm.formA.gender,
          calendar: goonghapForm.formA.calendar || 'solar',
        },
        person_b: {
          year: parseInt(goonghapForm.formB.year),
          month: parseInt(goonghapForm.formB.month),
          day: parseInt(goonghapForm.formB.day),
          hour: goonghapForm.formB.hour,
          minute: 0,
          gender: goonghapForm.formB.gender,
          calendar: goonghapForm.formB.calendar || 'solar',
        },
        target_year: new Date().getFullYear()
      })
      const data = {
        type: 'goonghap',
        ...result,
        formA: goonghapForm.formA,
        formB: goonghapForm.formB,
      }
      setGoonghapData(data)
      setSajuData({ ...data, form: data.formA })
      setPage('result')
    } catch (e) {
      console.error(e)
      alert('궁합을 불러오는데 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요 🤍')
    } finally {
      setLoadingResult(false)
    }
  }

  const goResult = (data) => {
    const freeServices = ['year']
    const serviceType  = data.form?.service_type
    if (freeServices.includes(serviceType) || TEST_MODE || isPaidToday(serviceType, data.form)) {
      setSajuData(data)
      setPage('result')
    } else {
      setSajuData(data)
      setPendingService(serviceType)
      try { sessionStorage.setItem('_pending', JSON.stringify({ sajuData: data, serviceType, cacheKey: data.form ? data.form.year+'_'+data.form.month+'_'+data.form.day+'_'+(data.form.hour||'')+'_'+data.form.gender : '' })) } catch(e) {}
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
    try { sessionStorage.removeItem('_pending') } catch(e) {}
    setShowPayment(false)
    if (pendingService === 'goonghap') {
      const goonghapForm = {
        formA: sajuData?.formA || sajuData?.form,
        formB: sajuData?.formB,
      }
      loadPaidGoonghapResult(goonghapForm)
    } else if (pendingService === 'yukim') {
      loadPaidYukimResult()
    } else {
      loadPaidResult(null, pendingService)
    }
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
      {page === 'home' && <Home onResult={goResult} onGoonghap={goGoonghap} onYukim={goYukim} onGoPrivacy={(tab) => { setPrivacyTab(tab || 'privacy'); setPage('privacy') }} onGoContact={() => setShowContact(true)} />}
      {page === 'privacy' && <Privacy onBack={() => setPage('home')} initialTab={privacyTab} />}
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
          loadingNext={loadingResult}
          onServiceChange={(serviceType) => {
            if (serviceType === 'goonghap') {
              goGoonghap(sajuData?.form || sajuData?.formA)
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
            setSajuData(null)
            setPage('home')
          }}
        />
      )}
    </div>
  )
}
