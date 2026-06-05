import { calculateSaju } from '@orrery/core/saju'

// 己酉일 찾기 (4월~6월 스캔)
console.log('=== 己酉일 찾기 ===')
for (let m = 4; m <= 6; m++) {
  for (let d = 1; d <= 31; d++) {
    try {
      const s = calculateSaju({
        year: 2026, month: m, day: d,
        hour: 12, minute: 0, gender: 'M'
      })
      if (s.pillars[2].pillar.ganzi === '己酉') {
        console.log(`양력 2026-${m}-${d} = 일진 己酉`)
      }
    } catch(e) {}
  }
}
