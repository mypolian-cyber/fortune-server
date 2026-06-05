import { calculateSaju } from '@orrery/core/saju'

// 오늘 날짜로 일진 확인
const input = {
  year: 2026,
  month: 6,
  day: 4,
  hour: 13,
  minute: 0,
  gender: 'M'
}

const saju = calculateSaju(input)

console.log('=== 2026년 6월 4일 일진 확인 ===')
console.log('년주:', saju.pillars[0].pillar.ganzi)
console.log('월주:', saju.pillars[1].pillar.ganzi)
console.log('일주(일진):', saju.pillars[2].pillar.ganzi)
console.log('일간:', saju.pillars[2].pillar.stem)
console.log('일지:', saju.pillars[2].pillar.branch)
console.log()

// 절기 확인
try {
  const { getSolarTermsByYear } = await import('@orrery/core/saju')
  const terms = getSolarTermsByYear(2026)
  console.log('=== 2026년 절기 (상반기) ===')
  terms.slice(0, 12).forEach(t => console.log(JSON.stringify(t)))
} catch(e) {
  console.log('절기 함수 없음:', e.message)
  
  // 대신 여러 날짜로 월주 변화 확인
  console.log('\n=== 월주 변화로 절기 추정 ===')
  const dates = [
    [2026,5,20], [2026,5,21], [2026,5,22],
    [2026,6,3],  [2026,6,4],  [2026,6,5],
    [2026,6,20], [2026,6,21], [2026,6,22],
  ]
  for (const [y,m,d] of dates) {
    const s = calculateSaju({year:y, month:m, day:d, hour:12, minute:0, gender:'M'})
    console.log(`${y}-${m}-${d}: 월주=${s.pillars[1].pillar.ganzi} 일주=${s.pillars[2].pillar.ganzi}`)
  }
}
