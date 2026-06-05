import { calculateSaju } from '@orrery/core/saju'

const input = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  gender: 'M'
}

const saju = calculateSaju(input)

// 전체 구조 확인
console.log('=== 전체 키 목록 ===')
console.log(Object.keys(saju))

console.log('\n=== 사주팔자 ===')
saju.pillars.forEach((p, i) => {
  const labels = ['년주', '월주', '일주', '시주']
  console.log(`${labels[i]}: ${p.pillar.ganzi}`)
})

// 대운 키 찾기
console.log('\n=== 전체 데이터 구조 ===')
console.log(JSON.stringify(saju, null, 2).slice(0, 2000))
