import { calculateSaju } from '@orrery/core/saju'

// 2026년 각 월의 월주 확인
console.log('=== 2026년 월별 월주 ===')
const months = [1,2,3,4,5,6,7,8,9,10,11,12]

for (const m of months) {
  // 각 월 중순 기준
  const s = calculateSaju({
    year: 2026, month: m, day: 15,
    hour: 12, minute: 0, gender: 'M'
  })
  const wolju = s.pillars[1].pillar
  console.log(`${m}월: ${wolju.ganzi} (천간:${wolju.stem} 지지:${wolju.branch})`)
}
