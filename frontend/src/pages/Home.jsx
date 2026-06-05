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

const SERVICES = [
  { value: 'year',      label: '올해 기운',        sub: '후아모의 짧은 한마디',    price: '무료',    free: true },
  { value: 'year_full', label: '올해 기운 풀버전',  sub: '월별 파동 + 상세 풀이',  price: '990원',   free: false, hot: true },
  { value: 'life',      label: '평생 기운',        sub: '타고난 기질과 흐름',      price: '1,650원', free: false },
  { value: 'goonghap',  label: '우리 궁합',        sub: '두 사람의 기운',          price: '1,650원', free: false },
  { value: 'yukim',     label: '지금 이 질문',     sub: '육임으로 이 순간의 답',   price: '1,650원', free: false },
]

export default function Home({ onResult, onGoonghap }) {
  const [form, setForm] = useState({
    year: '', month: '', day: '',
    hour: null, gender: 'M',
    service_type: 'year',
    calendar: 'solar'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.year || !form.month || !form.day) {
      setError('생년월일을 알려줘야 기운을 읽을 수 있어 🤍')
      return
    }
    if (String(form.year).length !== 4) {
      setError('태어난 년도를 4자리로 입력해줘 (예: 1995)')
      return
    }
    if (parseInt(form.month) < 1 || parseInt(form.month) > 12) {
      setError('월은 1~12 사이로 입력해줘')
      return
    }
    if (parseInt(form.day) < 1 || parseInt(form.day) > 31) {
      setError('일은 1~31 사이로 입력해줘')
      return
    }
    // 궁합은 별도 페이지로
    if (form.service_type === 'goonghap') {
      onGoonghap && onGoonghap()
      return
    }

    setError('')
    setLoading(true)
    try {
      const result = await calculateSaju({
        year: parseInt(form.year),
        month: parseInt(form.month),
        day: parseInt(form.day),
        hour: form.hour,
        minute: 0,
        gender: form.gender,
        service_type: form.service_type,
        target_year: new Date().getFullYear()
      })
      onResult({ ...result, form })
    } catch (e) {
      setError('앗, 뭔가 잘못됐어. 다시 시도해봐 🤍')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #2d0a4e 0%, #1a1040 40%, #0f2060 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Noto Sans KR', sans-serif",
      boxSizing: 'border-box',
    }}>

      {/* 후아모 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img src="/huamo2.png" alt="후아모"
          style={{
            width: '120px', height: '120px',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto 12px',
            filter: 'drop-shadow(0 0 15px rgba(167,139,250,0.5))',
          }}
        />
        <h1 style={{
          fontSize: '20px', fontWeight: '800',
          color: '#ffffff', margin: '0 0 4px',
          textShadow: '0 0 20px rgba(167,139,250,0.5)',
          letterSpacing: '-0.5px'
        }}>
          MBTI로 운세를 볼까? 🤍
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px', margin: 0,
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: '500',
        }}>
          이름도 필요없어. 생년월일시만 알려줘
        </p>
      </div>

      {/* 메인 카드 */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid rgba(167,139,250,0.2)',
        backdropFilter: 'blur(20px)',
        boxSizing: 'border-box',
      }}>

        {/* 생년월일 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelSt}>생년월일</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="년도 4자리"
                value={form.year}
                onChange={e => setForm({...form, year: e.target.value})}
                style={{...inputSt, width: '100%'}}
                maxLength={4}
              />
              <div style={{ color: 'rgba(255,255,255,0.45)',
                fontSize: '10px', marginTop: '3px', paddingLeft: '4px' }}>
                예: 1995
              </div>
            </div>
            <div>
              <input type="number" placeholder="월"
                value={form.month}
                onChange={e => setForm({...form, month: e.target.value})}
                style={{...inputSt, width: '52px'}}
                min={1} max={12}
              />
              <div style={{ color: 'rgba(255,255,255,0.45)',
                fontSize: '10px', marginTop: '3px', paddingLeft: '4px' }}>
                1~12
              </div>
            </div>
            <div>
              <input type="number" placeholder="일"
                value={form.day}
                onChange={e => setForm({...form, day: e.target.value})}
                style={{...inputSt, width: '52px'}}
                min={1} max={31}
              />
              <div style={{ color: 'rgba(255,255,255,0.45)',
                fontSize: '10px', marginTop: '3px', paddingLeft: '4px' }}>
                1~31
              </div>
            </div>
          </div>
        </div>

        {/* 양력/음력 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelSt}>양력 / 음력</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{label:'양력',value:'solar'},{label:'음력',value:'lunar'}].map(c => (
              <button key={c.value}
                onClick={() => setForm({...form, calendar: c.value})}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '12px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.2s',
                  background: form.calendar === c.value
                    ? 'rgba(167,139,250,0.25)'
                    : 'rgba(255,255,255,0.04)',
                  color: form.calendar === c.value ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  outline: form.calendar === c.value
                    ? '1.5px solid rgba(167,139,250,0.5)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >{c.label}</button>
            ))}
          </div>

        </div>

        {/* 태어난 시간 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelSt}>태어난 시간</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setForm({...form, gender: 'M'})}
              style={{
                flex: 1, padding: '10px 8px',
                borderRadius: '12px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                transition: 'all 0.2s',
                background: form.gender === 'M'
                  ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)'
                  : 'rgba(255,255,255,0.06)',
                color: '#fff',
                boxShadow: form.gender === 'M'
                  ? '0 4px 15px rgba(56,189,248,0.4)' : 'none',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>♂</span> 남자야
            </button>
            <button
              onClick={() => setForm({...form, gender: 'F'})}
              style={{
                flex: 1, padding: '10px 8px',
                borderRadius: '12px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                transition: 'all 0.2s',
                background: form.gender === 'F'
                  ? 'linear-gradient(135deg, #f472b6, #ec4899)'
                  : 'rgba(255,255,255,0.06)',
                color: '#fff',
                boxShadow: form.gender === 'F'
                  ? '0 4px 15px rgba(244,114,182,0.4)' : 'none',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>♀</span> 여자야
            </button>
          </div>
        </div>

        {/* 서비스 선택 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{...labelSt, 
            fontFamily: "'Jua', sans-serif",
            fontSize: '14px',
            color: 'rgba(255,255,255,0.9)',
          }}>뭐가 궁금해?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SERVICES.map(s => (
              <button key={s.value}
                onClick={() => setForm({...form, service_type: s.value})}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '12px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s',
                  background: form.service_type === s.value
                    ? 'rgba(167,139,250,0.25)'
                    : 'rgba(255,255,255,0.06)',
                  outline: form.service_type === s.value
                    ? '2px solid rgba(167,139,250,0.8)'
                    : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div>
                  <div style={{ color: '#ffffff', fontSize: '14px',
                    fontWeight: '700', marginBottom: '2px' }}>
                    {s.label}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)',
                    fontSize: '11px' }}>
                    {s.sub}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-end', gap: '3px' }}>
                  {s.hot && (
                    <span style={{
                      fontSize: '10px', fontWeight: '700',
                      padding: '2px 7px', borderRadius: '20px',
                      background: 'rgba(251,146,60,0.2)',
                      color: '#fb923c',
                    }}>🔥 인기</span>
                  )}
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    padding: '3px 9px', borderRadius: '20px',
                    background: s.free
                      ? 'rgba(52,211,153,0.15)'
                      : 'rgba(167,139,250,0.15)',
                    color: s.free ? '#34d399' : '#a78bfa',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.price}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            color: '#f87171', fontSize: '12px',
            textAlign: 'center', marginBottom: '10px',
            background: 'rgba(248,113,113,0.1)',
            padding: '8px', borderRadius: '8px'
          }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: loading
              ? 'rgba(167,139,250,0.3)'
              : 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
            color: '#fff', fontSize: '15px', fontWeight: '700',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(167,139,250,0.4)',
          }}
        >
          {loading ? '후아모가 읽는 중... ♥' : (
            <>내 기운 읽어줘{' '}
              <span style={{
                background: 'linear-gradient(135deg, #ff6b9d, #ff4757)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>♥</span>
            </>
          )}
        </button>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.4)', fontSize: '11px',
        marginTop: '12px', textAlign: 'center'
      }}>
        입력 정보는 저장되지 않아
      </p>
    </div>
  )
}

const labelSt = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '12px',
  fontWeight: '600',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.3px',
}

const inputSt = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '12px',
  padding: '10px 12px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
}
