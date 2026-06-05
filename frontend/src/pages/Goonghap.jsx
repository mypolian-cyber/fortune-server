import { useState } from 'react'
import { calculateSaju } from '../services/api'

const HOURS = [
  { label: '잘 모르겠어 (3주로 볼게)', value: null },
  { label: '밤 11시 ~ 새벽 1시', value: 0 },
  { label: '새벽 1시 ~ 3시', value: 2 },
  { label: '새벽 3시 ~ 5시', value: 4 },
  { label: '새벽 5시 ~ 7시', value: 6 },
  { label: '오전 7시 ~ 9시', value: 8 },
  { label: '오전 9시 ~ 11시', value: 10 },
  { label: '오전 11시 ~ 오후 1시', value: 12 },
  { label: '오후 1시 ~ 3시', value: 14 },
  { label: '오후 3시 ~ 5시', value: 16 },
  { label: '오후 5시 ~ 7시', value: 18 },
  { label: '오후 7시 ~ 9시', value: 20 },
  { label: '오후 9시 ~ 11시', value: 22 },
]

const emptyForm = () => ({
  year: '', month: '', day: '',
  hour: null, gender: 'M', calendar: 'solar'
})

export default function Goonghap({ onResult, onBack }) {
  const [personA, setPersonA] = useState(emptyForm())
  const [personB, setPersonB] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = (form, label) => {
    if (!form.year || !form.month || !form.day) {
      return `${label}의 생년월일을 입력해줘`
    }
    if (String(form.year).length !== 4) {
      return `${label}의 년도를 4자리로 입력해줘`
    }
    return null
  }

  const handleSubmit = async () => {
    const errA = validate(personA, '나')
    if (errA) { setError(errA); return }
    const errB = validate(personB, '상대방')
    if (errB) { setError(errB); return }

    setError('')
    setLoading(true)
    try {
      // 두 사람 동시 계산
      const [resultA, resultB] = await Promise.all([
        calculateSaju({
          year: parseInt(personA.year),
          month: parseInt(personA.month),
          day: parseInt(personA.day),
          hour: personA.hour,
          minute: 0,
          gender: personA.gender,
          service_type: 'goonghap',
          target_year: new Date().getFullYear()
        }),
        calculateSaju({
          year: parseInt(personB.year),
          month: parseInt(personB.month),
          day: parseInt(personB.day),
          hour: personB.hour,
          minute: 0,
          gender: personB.gender,
          service_type: 'goonghap',
          target_year: new Date().getFullYear()
        })
      ])
      onResult({
        type: 'goonghap',
        personA: { ...resultA, form: personA },
        personB: { ...resultB, form: personB },
      })
    } catch (e) {
      setError('앗, 뭔가 잘못됐어. 다시 시도해봐 🤍')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/huamo2.png" alt="후아모"
            style={{ width: '60px', height: '60px',
              objectFit: 'contain', display: 'block',
              margin: '0 auto 10px',
              filter: 'drop-shadow(0 0 15px rgba(167,139,250,0.4))'
            }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800',
            color: '#fff', margin: '0 0 4px' }}>
            우리 궁합 볼까? 💫
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            두 사람의 기운이 만나는 방식을 읽어줄게
          </p>
        </div>

        {/* 나 */}
        <PersonForm
          label="나"
          emoji="🙋"
          color="#38bdf8"
          form={personA}
          setForm={setPersonA}
          hours={HOURS}
        />

        {/* 구분선 */}
        <div style={{ textAlign: 'center', margin: '12px 0',
          color: 'rgba(255,255,255,0.3)', fontSize: '20px' }}>
          💫
        </div>

        {/* 상대방 */}
        <PersonForm
          label="상대방"
          emoji="🧑"
          color="#f472b6"
          form={personB}
          setForm={setPersonB}
          hours={HOURS}
        />

        {error && (
          <div style={{
            color: '#f87171', fontSize: '12px',
            textAlign: 'center', margin: '12px 0',
            background: 'rgba(248,113,113,0.1)',
            padding: '8px', borderRadius: '8px'
          }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: loading
            ? 'rgba(167,139,250,0.3)'
            : 'linear-gradient(135deg, #a78bfa, #ec4899)',
          color: '#fff', fontSize: '15px', fontWeight: '700',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(167,139,250,0.4)',
          marginBottom: '12px',
        }}>
          {loading ? '후아모가 읽는 중... 🤍' : '궁합 봐줘 💫'}
        </button>

        <button onClick={onBack} style={{
          width: '100%', padding: '12px',
          borderRadius: '14px', border: 'none',
          background: 'transparent',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: '13px',
        }}>
          돌아가기
        </button>
      </div>
    </div>
  )
}

function PersonForm({ label, emoji, color, form, setForm, hours }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '20px', padding: '16px',
      border: `1px solid ${color}30`,
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center',
        gap: '6px', marginBottom: '14px' }}>
        <span style={{ fontSize: '16px' }}>{emoji}</span>
        <span style={{ color, fontSize: '14px', fontWeight: '700' }}>
          {label}
        </span>
      </div>

      {/* 생년월일 */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelSt}>생년월일</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input type="number" placeholder="년도 4자리"
              value={form.year}
              onChange={e => setForm({...form, year: e.target.value})}
              style={{...inputSt, width: '100%'}}
            />
            <div style={{ color: 'rgba(255,255,255,0.25)',
              fontSize: '10px', marginTop: '2px', paddingLeft: '4px' }}>
              예: 1995
            </div>
          </div>
          <div>
            <input type="number" placeholder="월"
              value={form.month}
              onChange={e => setForm({...form, month: e.target.value})}
              style={{...inputSt, width: '50px'}}
              min={1} max={12}
            />
            <div style={{ color: 'rgba(255,255,255,0.25)',
              fontSize: '10px', marginTop: '2px', paddingLeft: '4px' }}>
              1~12
            </div>
          </div>
          <div>
            <input type="number" placeholder="일"
              value={form.day}
              onChange={e => setForm({...form, day: e.target.value})}
              style={{...inputSt, width: '50px'}}
              min={1} max={31}
            />
            <div style={{ color: 'rgba(255,255,255,0.25)',
              fontSize: '10px', marginTop: '2px', paddingLeft: '4px' }}>
              1~31
            </div>
          </div>
        </div>
      </div>

      {/* 태어난 시간 */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelSt}>태어난 시간</label>
        <select
          value={form.hour ?? ''}
          onChange={e => setForm({...form,
            hour: e.target.value === '' ? null : parseInt(e.target.value)})}
          style={{...inputSt, width: '100%', cursor: 'pointer'}}
        >
          {hours.map(h => (
            <option key={h.label} value={h.value ?? ''}
              style={{ background: '#1a0a2e' }}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* 성별 */}
      <div>
        <label style={labelSt}>성별</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setForm({...form, gender: 'M'})}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: '700',
              background: form.gender === 'M'
                ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)'
                : 'rgba(255,255,255,0.06)',
              color: '#fff',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '4px',
            }}
          >
            <span>♂</span> 남자야
          </button>
          <button
            onClick={() => setForm({...form, gender: 'F'})}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: '700',
              background: form.gender === 'F'
                ? 'linear-gradient(135deg, #f472b6, #ec4899)'
                : 'rgba(255,255,255,0.06)',
              color: '#fff',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '4px',
            }}
          >
            <span>♀</span> 여자야
          </button>
        </div>
      </div>
    </div>
  )
}

const labelSt = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '11px',
  display: 'block',
  marginBottom: '5px',
}

const inputSt = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '9px 10px',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}
