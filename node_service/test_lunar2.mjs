import { calculateSaju } from '@orrery/core/saju'

// 2026년 전체 己酉일 찾기
console.log('=== 2026년 己酉일 전체 스캔 ===')
const months = [1,2,3,4,5,6,7,8,9,10,11,12]
const days = Array.from({length:31}, (_,i) => i+1)

for (const m of months) {
  for (const d of days) {
    try {
      const s = calculateSaju({
        year: 2026, month: m, day: d,
        hour: 12, minute: 0, gender: 'M'
      })
      const iljin = s.pillars[2].pillar.ganzi
      if (iljin === '己酉') {
        console.log(`양력 2026-${m}-${d} = 己酉`)
      }
    } catch(e) {}
  }
}

// 도깨비 화면의 월주 癸巳도 확인
console.log('\n=== 월주 癸巳인 날짜 ===')
for (const m of months) {
  for (const d of days) {
    try {
      const s = calculateSaju({
        year: 2026, month: m, day: d,
        hour: 12, minute: 0, gender: 'M'
      })
      const wolju = s.pillars[1].pillar.ganzi
      const iljin = s.pillars[2].pillar.ganzi
      if (wolju === '癸巳') {
        console.log(`양력 2026-${m}-${d}: 월주=${wolju} 일주=${iljin}`)
      }
    } catch(e) {}
  }
}
