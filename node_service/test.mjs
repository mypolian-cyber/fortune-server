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
console.log('=== 사주팔자 테스트 ===')
saju.pillars.forEach(p => console.log(p.pillar.ganzi))
console.log('대운:', saju.daeun?.map(d => d.pillar.ganzi))
