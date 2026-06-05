import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 사주 계산
export const calculateSaju = (data) =>
  api.post('/saju/calculate', data).then(r => r.data)

// 가격 조회
export const getPrice = (serviceType) =>
  api.get(`/payment/price/${serviceType}`).then(r => r.data)

// 결제 준비
export const preparePayment = (data) =>
  api.post('/payment/prepare', data).then(r => r.data)

// 결제 확인
export const confirmPayment = (data) =>
  api.post('/payment/confirm', data).then(r => r.data)

// 결제 완료 여부 확인
export const verifyPayment = (cacheKey, serviceType) =>
  api.get(`/payment/verify/${cacheKey}/${serviceType}`).then(r => r.data)
