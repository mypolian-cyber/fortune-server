const express = require('express')
const app = express()
app.use(express.json())

const Lunar = require('./node_modules/lunar-javascript/lunar.js')

function lunarToSolar(year, month, day, isLeap = false) {
  try {
    const lunar = Lunar.Lunar.fromYmd(year, month, day)
    const solar = lunar.getSolar()
    return {
      year:  solar.getYear(),
      month: solar.getMonth(),
      day:   solar.getDay(),
    }
  } catch(e) {
    return { year, month, day }
  }
}

async function getSaju(input) {
  const { calculateSaju } = await import('@orrery/core/saju')
  return calculateSaju(input)
}

app.post('/calculate', async (req, res) => {
  try {
    const { year, month, day, hour, minute, gender, calendar, isLeap } = req.body
    const hasHour = hour !== null && hour !== undefined

    // 음력이면 양력으로 변환
    let solarYear  = parseInt(year)
    let solarMonth = parseInt(month)
    let solarDay   = parseInt(day)

    if (calendar === 'lunar') {
      const converted = lunarToSolar(
        parseInt(year), parseInt(month), parseInt(day),
        isLeap || false
      )
      solarYear  = converted.year
      solarMonth = converted.month
      solarDay   = converted.day
    }

    const input = {
      year:   solarYear,
      month:  solarMonth,
      day:    solarDay,
      hour:   hasHour ? parseInt(hour) : 12,
      minute: minute !== null && minute !== undefined ? parseInt(minute) : 0,
      gender: gender
    }

    const saju = await getSaju(input)
    const pillars = saju.pillars || []

    // 시간 모를 경우 시주 제거 (3주만 사용)
    const finalPillars = hasHour ? pillars : pillars.slice(0, 3)

    res.json({
      success: true,
      data: {
        pillars:     finalPillars,
        daewoon:     saju.daewoon,
        relations:   saju.relations,
        specialSals: saju.specialSals,
        gongmang:    saju.gongmang,
        input:       saju.input,
        hasHour:     hasHour,
        solar: {
          year:  solarYear,
          month: solarMonth,
          day:   solarDay,
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/yukim_base', async (req, res) => {
  try {
    const { calculateSaju } = await import('@orrery/core/saju')
    const {
      birth_year, birth_month, birth_day, birth_hour,
      q_year, q_month, q_day, q_hour
    } = req.body

    const qSaju = calculateSaju({
      year:   parseInt(q_year),
      month:  parseInt(q_month),
      day:    parseInt(q_day),
      hour:   parseInt(q_hour),
      minute: 0,
      gender: 'M'
    })

    const bSaju = calculateSaju({
      year:   parseInt(birth_year),
      month:  parseInt(birth_month),
      day:    parseInt(birth_day),
      hour:   birth_hour ? parseInt(birth_hour) : 12,
      minute: 0,
      gender: 'M'
    })

    const JIJI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

    const ilgan = qSaju.pillars[2].pillar.stem
    const ilji  = qSaju.pillars[2].pillar.branch
    const iljin = qSaju.pillars[2].pillar.ganzi

    const wolju_ji  = qSaju.pillars[1].pillar.branch
    const wolju_idx = JIJI.indexOf(wolju_ji)
    const woljiang  = JIJI[(wolju_idx + 6) % 12]

    const haengnyeon_ji    = bSaju.pillars[2].pillar.branch
    const haengnyeon_iljin = bSaju.pillars[2].pillar.ganzi

    const nyeonju = qSaju.pillars[0].pillar.ganzi
    const wolju   = qSaju.pillars[1].pillar.ganzi
    const siju    = qSaju.pillars[3]?.pillar.ganzi || null

    res.json({
      success: true,
      data: {
        iljin, ilgan, ilji,
        wolju_ji, woljiang,
        nyeonju, wolju, siju,
        haengnyeon_ji,
        haengnyeon_iljin,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log('Node 사주 서비스 실행중: http://localhost:' + PORT)
})
