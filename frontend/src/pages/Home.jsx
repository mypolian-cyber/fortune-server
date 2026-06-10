import { useState } from 'react'
import { calculateSaju } from '../services/api'
// 손글씨 폰트
const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@700&display=swap'
fontLink.rel = 'stylesheet'
document.head.appendChild(fontLink)

const HOURS = [
  { label: '태어난 시간을 몰라', value: null },
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
  { value: 'year',      label: '올해 내 운세',      sub: '사주로 보는 2026년 흐름',           price: '무료',    free: true },
  { value: 'year_full', label: '올해 운세 FULL',    sub: '월별로 언제 치고 언제 쉴지',        price: '990원', free: false, hot: true },
  { value: 'life',      label: '평생 운세',         sub: '내가 왜 이런 사람인지 이제 알겠어', price: '3,900원', free: false },
  { value: 'goonghap',  label: '우리 궁합',         sub: '우리 왜 이렇게 잘 맞아? or 왜 이렇게 싸워?', price: '1,990원', free: false },
  { value: 'yukim',     label: '이 일은 이루어질까?', sub: 'YES or NO, 지금 바로 확인해',     price: '990원', free: false },
]

const LOADING_MESSAGES = [
  '후아모가 별자리를 읽는 중... ✨',
  '기운을 모으고 있어... 🌙',
  '우주에서 답을 찾는 중... 🔮',
  '당신의 흐름을 파악하는 중... 💫',
  '사주를 분석하는 중... 🌟',
  '후아모가 열심히 읽고 있어... 🤍',
  '거의 다 됐어, 조금만 기다려... ⭐',
]

export default function Home({ onResult, onGoonghap }) {
  const [loadingMsg, setLoadingMsg] = useState(0)
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
      onGoonghap && onGoonghap(form)
      return
    }

    setError('')
    setLoading(true)
    setLoadingMsg(0)
    const msgInterval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1800)
    try {
      const result = await calculateSaju({
        year: parseInt(form.year),
        month: parseInt(form.month),
        day: parseInt(form.day),
        hour: form.hour,
        minute: 0,
        gender: form.gender,
        service_type: form.service_type,
        target_year: new Date().getFullYear(),
        calendar: form.calendar,
        is_leap: form.is_leap || false,
      })
      onResult({ ...result, form })
    } catch (e) {
      setError('앗, 뭔가 잘못됐어. 다시 시도해봐 🤍')
    } finally {
      setLoading(false)
      clearInterval(msgInterval)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0d0020 0%, #1a0035 20%, #0a0a3e 50%, #001a3e 80%, #000d2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Noto Sans KR', sans-serif",
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 로딩 오버레이 */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5,0,20,0.92)',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 999,
        }}>
          {/* 후아모 이미지 펄스 */}
          <div style={{
            animation: 'pulse 1.5s ease-in-out infinite',
            marginBottom: '24px',
          }}>
            <img src="/huamo2.png" alt="후아모"
              style={{
                width: '100px', height: '100px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.9))',
              }}
            />
          </div>

          {/* 별 반짝임 */}
          <div style={{ fontSize: '24px', marginBottom: '16px', letterSpacing: '8px' }}>
            {['✦','✧','✦','✧','✦'].map((s,i) => (
              <span key={i} style={{
                display: 'inline-block',
                animation: `twinkle 1.2s ease-in-out ${i*0.2}s infinite`,
                opacity: 0.8,
              }}>{s}</span>
            ))}
          </div>

          {/* 로딩 메시지 */}
          <div style={{
            color: '#e0aaff',
            fontSize: '16px',
            fontWeight: '700',
            textAlign: 'center',
            animation: 'fadeInOut 1.8s ease-in-out infinite',
            textShadow: '0 0 20px rgba(167,139,250,0.8)',
            padding: '0 32px',
          }}>
            {LOADING_MESSAGES[loadingMsg]}
          </div>

          {/* 프로그레스 바 */}
          <div style={{
            width: '200px', height: '3px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '99px',
            marginTop: '24px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #a78bfa, #ec4899)',
              borderRadius: '99px',
              animation: 'progress 3s ease-in-out infinite',
            }} />
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(167,139,250,0.7)); }
              50% { transform: scale(1.1); filter: drop-shadow(0 0 40px rgba(167,139,250,1)); }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }
            @keyframes fadeInOut {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
            @keyframes progress {
              0% { width: 0%; }
              50% { width: 70%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* 네온 배경 글로우 */}
      <div style={{
        position: 'fixed', top: '-30%', left: '-30%',
        width: '80%', height: '80%',
        background: 'radial-gradient(circle, rgba(140,40,255,0.55) 0%, rgba(80,0,180,0.2) 50%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '-20%', right: '-25%',
        width: '70%', height: '70%',
        background: 'radial-gradient(circle, rgba(0,80,255,0.45) 0%, rgba(0,40,180,0.15) 50%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-15%',
        width: '65%', height: '65%',
        background: 'radial-gradient(circle, rgba(255,0,180,0.5) 0%, rgba(180,0,120,0.2) 50%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '0%', left: '-20%',
        width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(0,200,255,0.35) 0%, rgba(0,120,200,0.1) 50%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '30%',
        width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(180,0,255,0.2) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* 별 장식 */}
      {[
        {top:'8%',left:'6%',size:'18px',opacity:0.7},
        {top:'12%',right:'8%',size:'12px',opacity:0.5},
        {top:'25%',left:'3%',size:'10px',opacity:0.4},
        {top:'35%',right:'5%',size:'22px',opacity:0.6},
        {top:'55%',left:'5%',size:'14px',opacity:0.5},
        {top:'70%',right:'6%',size:'10px',opacity:0.4},
        {top:'80%',left:'8%',size:'18px',opacity:0.6},
        {top:'90%',right:'10%',size:'12px',opacity:0.5},
      ].map((s, i) => (
        <div key={i} style={{
          position: 'fixed',
          top: s.top, left: s.left, right: s.right,
          fontSize: s.size, opacity: s.opacity,
          pointerEvents: 'none', zIndex: 0,
          filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.8))',
        }}>✦</div>
      ))}
      {/* 다이아 장식 */}
      {[
        {top:'18%',right:'12%',size:'14px',opacity:0.5},
        {top:'45%',left:'7%',size:'12px',opacity:0.4},
        {top:'65%',right:'8%',size:'16px',opacity:0.5},
      ].map((s, i) => (
        <div key={i} style={{
          position: 'fixed',
          top: s.top, left: s.left, right: s.right,
          fontSize: s.size, opacity: s.opacity,
          pointerEvents: 'none', zIndex: 0,
          filter: 'drop-shadow(0 0 4px rgba(100,200,255,0.8))',
        }}>◆</div>
      ))}

      {/* 후아모 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
          <img src="/huamo2.png" alt="후아모"
            style={{
              width: '90px', height: '90px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.7)) drop-shadow(0 0 40px rgba(167,139,250,0.3))',
            }}
          />
          <div style={{
            fontFamily: "'Gaegu', cursive",
            fontSize: '32px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffe066, #ffaa00, #ff8c00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(255,180,0,0.8))',
            lineHeight: 1.3,
            textAlign: 'left',
          }}>
            후아모가<br/>알려줄께~
          </div>
        </div>
        <h1 style={{
          fontSize: '22px', fontWeight: '900',
          margin: '0 0 4px',
          background: 'linear-gradient(135deg, #fff 0%, #e0aaff 20%, #c77dff 40%, #ff6ef7 65%, #ffb3f0 85%, #fff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          filter: 'drop-shadow(0 2px 8px rgba(200,100,255,0.9)) drop-shadow(0 0 20px rgba(255,100,240,0.6))',
          textShadow: 'none',
        }}>
          사주 × MBTI = 나만의 운세{' '}
          <span style={{
            background: 'linear-gradient(135deg, #ff0080 0%, #ff4d00 20%, #ffcc00 40%, #00ff88 60%, #0088ff 80%, #cc00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px rgba(255,100,200,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            fontSize: '28px',
          }}>💗</span>
        </h1>
        <p style={{
          color: 'rgba(200,180,255,0.75)',
          fontSize: '13px', margin: 0,
          fontWeight: '400',
          letterSpacing: '0.2px',
        }}>
          16가지 MBTI 중 진짜 내 유형, 사주로 찾아줄게
        </p>
      </div>

      {/* 메인 카드 */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'linear-gradient(160deg, rgba(30,10,60,0.85) 0%, rgba(10,5,40,0.9) 50%, rgba(5,10,50,0.85) 100%)',
        borderRadius: '24px',
        padding: '14px 16px',
        border: '1px solid rgba(150,80,255,0.35)',
        backdropFilter: 'blur(30px)',
        boxSizing: 'border-box',
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.04),
          0 2px 4px rgba(0,0,0,0.6),
          0 8px 24px rgba(0,0,0,0.5),
          0 0 60px rgba(120,40,255,0.2),
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.3)
        `,
        position: 'relative', zIndex: 1,
      }}>

        {/* 생년월일 */}
        <div style={{ marginBottom: '7px' }}>
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
        <div style={{ marginBottom: '7px' }}>
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
        <div style={{ marginBottom: '7px' }}>
          <label style={labelSt}>태어난 시간</label>
          <select
            value={form.hour ?? ''}
            onChange={e => setForm({...form,
              hour: e.target.value === '' ? null : parseInt(e.target.value)})}
            style={{
              ...inputSt, width: '100%', cursor: 'pointer',
              marginBottom: '7px',
            }}
          >
            {HOURS.map(h => (
              <option key={h.label} value={h.value ?? ''}
                style={{ background: '#1a0a2e' }}>
                {h.label}
              </option>
            ))}
          </select>
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
        <div style={{ marginBottom: '7px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(236,72,153,0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                  outline: form.service_type === s.value
                    ? '1.5px solid rgba(180,100,255,0.9)'
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: form.service_type === s.value
                    ? '0 0 20px rgba(167,139,250,0.3), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                  transform: form.service_type === s.value ? 'translateY(-1px)' : 'none',
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
            width: '100%', padding: '13px',
            borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: loading
              ? 'rgba(167,139,250,0.3)'
              : 'linear-gradient(135deg, #b347ff 0%, #e040fb 35%, #ff4db8 65%, #ff6b9d 100%)',
            color: '#fff', fontSize: '16px', fontWeight: '800',
            letterSpacing: '0.3px',
            boxShadow: loading ? 'none' : `
              0 4px 0 rgba(100,0,180,0.6),
              0 8px 24px rgba(180,50,255,0.5),
              0 0 40px rgba(255,50,180,0.3),
              inset 0 1px 0 rgba(255,255,255,0.25),
              inset 0 -2px 0 rgba(0,0,0,0.2)
            `,
            transform: loading ? 'none' : 'translateY(-1px)',
            transition: 'all 0.15s',
          }}
        >
          {loading ? LOADING_MESSAGES[loadingMsg] : (
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

      <div style={{
        marginTop: '12px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '11px',
          margin: '0 0 4px',
        }}>
          🔒 이름 등 개인정보는 수집하지 않아
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.25)', fontSize: '10px',
          margin: '0 0 4px',
        }}>
          생년월일·성별은 서비스 개선 및 맞춤 정보 제공 목적으로 수집됩니다
        </p>
        <button
          onClick={() => window.open('/privacy', '_blank')}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(167,139,250,0.5)', fontSize: '10px',
            cursor: 'pointer', textDecoration: 'underline',
            padding: 0,
          }}>
          개인정보처리방침
        </button>
      </div>
    </div>
  )
}

const labelSt = {
  color: 'rgba(200,180,255,0.9)',
  fontSize: '12px',
  fontWeight: '600',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.5px',
}

const inputSt = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
  border: '1.5px solid rgba(120,80,255,0.45)',
  borderRadius: '12px',
  padding: '10px 12px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
  boxShadow: '0 0 12px rgba(120,80,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)',
}
