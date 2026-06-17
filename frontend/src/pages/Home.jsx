import { useState } from 'react'
import { calculateSaju } from '../services/api'

const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@700&display=swap'
fontLink.rel = 'stylesheet'
document.head.appendChild(fontLink)

const HOURS = [
  { label: '태어난 시간을 몰라', value: null },
  { label: '子時 (자시) — 밤 11시 ~ 새벽 1시', value: 0 },
  { label: '丑時 (축시) — 새벽 1시 ~ 3시', value: 2 },
  { label: '寅時 (인시) — 새벽 3시 ~ 5시', value: 4 },
  { label: '卯時 (묘시) — 새벽 5시 ~ 7시', value: 6 },
  { label: '辰時 (진시) — 오전 7시 ~ 9시', value: 8 },
  { label: '巳時 (사시) — 오전 9시 ~ 11시', value: 10 },
  { label: '午時 (오시) — 오전 11시 ~ 오후 1시', value: 12 },
  { label: '未時 (미시) — 오후 1시 ~ 3시', value: 14 },
  { label: '申時 (신시) — 오후 3시 ~ 5시', value: 16 },
  { label: '酉時 (유시) — 오후 5시 ~ 7시', value: 18 },
  { label: '戌時 (술시) — 오후 7시 ~ 9시', value: 20 },
  { label: '亥時 (해시) — 오후 9시 ~ 11시', value: 22 },
]

const SERVICES = [
  { value: 'year',      label: '올해 내 운세',        sub: '사주로 보는 2026년 흐름',                      price: '무료',    free: true,
    color: { base:'rgba(16,185,129,0.15)', glow:'rgba(16,185,129,0.5)', border:'rgba(52,211,153,0.5)', highlight:'rgba(52,211,153,0.3)', text:'#34d399', priceColor:'#34d399' } },
  { value: 'year_full', label: '올해 운세 FULL',      sub: '월별로 언제 치고 언제 쉴지',                  price: '1,100원', free: false, hot: true,
    color: { base:'rgba(245,158,11,0.15)', glow:'rgba(251,191,36,0.5)', border:'rgba(251,191,36,0.5)', highlight:'rgba(251,191,36,0.3)', text:'#fbbf24', priceColor:'#fbbf24' } },
  { value: 'life',      label: '평생 운세',           sub: '내가 왜 이런 사람인지 이제 알겠어',           price: '4,200원', free: false,
    color: { base:'rgba(139,92,246,0.15)', glow:'rgba(167,139,250,0.5)', border:'rgba(167,139,250,0.5)', highlight:'rgba(167,139,250,0.3)', text:'#c4b5fd', priceColor:'#c4b5fd' } },
  { value: 'goonghap',  label: '우리 궁합',           sub: '우리 왜 이렇게 잘 맞아? or 왜 이렇게 싸워?', price: '2,200원', free: false,
    color: { base:'rgba(236,72,153,0.15)', glow:'rgba(244,114,182,0.5)', border:'rgba(244,114,182,0.5)', highlight:'rgba(244,114,182,0.3)', text:'#f9a8d4', priceColor:'#f9a8d4' } },
  { value: 'yukim',     label: '이 일은 이루어질까?', sub: 'YES or NO, 지금 바로 확인해',                 price: '1,100원', free: false,
    color: { base:'rgba(6,182,212,0.15)', glow:'rgba(34,211,238,0.5)', border:'rgba(34,211,238,0.5)', highlight:'rgba(34,211,238,0.3)', text:'#67e8f9', priceColor:'#67e8f9' } },
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

export default function Home({ onResult, onGoonghap, onYukim, onGoPrivacy, onGoContact }) {
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
    if (form.service_type === 'goonghap') {
      onGoonghap && onGoonghap(form)
      return
    }
    if (form.service_type === 'yukim') {
      onYukim && onYukim(form)
      return
    }
    const selectedService = SERVICES.find(s => s.value === form.service_type)
    if (selectedService && selectedService.free === false) {
      onResult({ form })
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

  const glassSt = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: `
      inset 0 1.5px 0 rgba(255,255,255,0.25),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 4px 16px rgba(0,0,0,0.3),
      0 8px 32px rgba(0,0,0,0.2)
    `,
  }

  const pillSt = (active, activeColor) => ({
    flex: 1, padding: '9px 0',
    borderRadius: '12px', border: 'none',
    cursor: 'pointer', fontSize: '13px', fontWeight: '700',
    transition: 'all 0.2s',
    background: active ? activeColor : 'rgba(255,255,255,0.07)',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    outline: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    boxShadow: active
      ? '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
      : 'inset 0 1px 0 rgba(255,255,255,0.08)',
  })

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0d0020 0%, #1a0035 20%, #0a0a3e 50%, #001a3e 80%, #000d2e 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "'Noto Sans KR', sans-serif",
      position: 'relative', overflow: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>

      {/* 배경 blob */}
      <div style={{ position:'fixed', top:'-20%', left:'-20%', width:'70%', height:'70%', background:'radial-gradient(circle, rgba(160,60,255,0.65) 0%, rgba(80,0,180,0.28) 50%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'-10%', right:'-20%', width:'65%', height:'65%', background:'radial-gradient(circle, rgba(0,100,255,0.55) 0%, rgba(0,40,180,0.2) 50%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-15%', right:'-10%', width:'60%', height:'60%', background:'radial-gradient(circle, rgba(255,20,180,0.6) 0%, rgba(180,0,120,0.25) 50%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'5%', left:'-15%', width:'55%', height:'55%', background:'radial-gradient(circle, rgba(0,200,255,0.4) 0%, rgba(0,120,200,0.12) 50%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'40%', left:'25%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(200,0,255,0.25) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* 별 장식 */}
      {[
        {top:'7%',left:'5%',size:'18px',op:0.7,color:'rgba(167,139,250,0.8)'},
        {top:'11%',right:'7%',size:'12px',op:0.5,color:'rgba(100,200,255,0.8)'},
        {top:'28%',left:'3%',size:'10px',op:0.4,color:'rgba(167,139,250,0.8)'},
        {top:'38%',right:'4%',size:'20px',op:0.6,color:'rgba(255,100,200,0.8)'},
        {top:'58%',left:'4%',size:'14px',op:0.5,color:'rgba(167,139,250,0.8)'},
        {top:'72%',right:'5%',size:'10px',op:0.4,color:'rgba(100,200,255,0.8)'},
        {top:'82%',left:'7%',size:'16px',op:0.6,color:'rgba(167,139,250,0.8)'},
        {top:'91%',right:'9%',size:'12px',op:0.5,color:'rgba(255,100,200,0.8)'},
      ].map((s,i) => (
        <div key={i} style={{ position:'fixed', top:s.top, left:s.left, right:s.right, fontSize:s.size, opacity:s.op, pointerEvents:'none', zIndex:0, filter:`drop-shadow(0 0 4px ${s.color})` }}>✦</div>
      ))}

      {/* 로딩 오버레이 */}
      {loading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,0,20,0.92)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ animation:'hPulse 1.5s ease-in-out infinite', marginBottom:'24px' }}>
            <img src="/huamo2.png" alt="후아모" style={{ width:'100px', height:'100px', objectFit:'contain', filter:'drop-shadow(0 0 30px rgba(167,139,250,0.9))' }} />
          </div>
          <div style={{ fontSize:'24px', marginBottom:'16px', letterSpacing:'8px' }}>
            {['✦','✧','✦','✧','✦'].map((s,i) => (
              <span key={i} style={{ display:'inline-block', animation:`hTwinkle 1.2s ease-in-out ${i*0.2}s infinite` }}>{s}</span>
            ))}
          </div>
          <div style={{ color:'#e0aaff', fontSize:'16px', fontWeight:'700', textAlign:'center', textShadow:'0 0 20px rgba(167,139,250,0.8)', padding:'0 32px' }}>
            {LOADING_MESSAGES[loadingMsg]}
          </div>
          <div style={{ width:'200px', height:'3px', background:'rgba(255,255,255,0.1)', borderRadius:'99px', marginTop:'24px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg, #a78bfa, #ec4899)', borderRadius:'99px', animation:'hProgress 3s ease-in-out infinite' }} />
          </div>
          <style>{`
            @keyframes hPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
            @keyframes hTwinkle { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:1;transform:scale(1.3);} }
            @keyframes hProgress { 0%{width:0%;} 50%{width:70%;} 100%{width:100%;} }
          `}</style>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ textAlign:'center', marginBottom:'16px', position:'relative', zIndex:1, width:'100%', maxWidth:'400px' }}>
        {/* 후아모 이미지 + 알려줄께 가로 배치 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginBottom:'10px' }}>
          <img src="/huamo2.png" alt="후아모" style={{ width:'110px', height:'110px', objectFit:'contain', filter:'drop-shadow(0 0 24px rgba(167,139,250,0.9)) drop-shadow(0 0 48px rgba(167,139,250,0.5))', flexShrink:0 }} />
          <div style={{ fontFamily:"'Gaegu', cursive", fontSize:'30px', fontWeight:'900', background:'linear-gradient(135deg, #ffe066, #ffcc00, #ffaa00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', lineHeight:1.3, textAlign:'left', WebkitFontSmoothing:'antialiased' }}>
            후아모가<br/>알려줄께~
          </div>
        </div>
        <h1 style={{ fontSize:'22px', fontWeight:'900', margin:'0 0 4px', background:'linear-gradient(135deg, #fff 0%, #e0aaff 30%, #c77dff 55%, #ff6ef7 80%, #fff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-0.5px', WebkitFontSmoothing:'antialiased' }}>
          사주 × MBTI = 나만의 운세
        </h1>
        <p style={{ color:'rgba(200,180,255,0.65)', fontSize:'12px', margin:'0 0 10px' }}>
          16가지 MBTI 중 진짜 내 유형, 사주로 찾아줄게
        </p>
        <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
          <button onClick={async () => {
            const url = 'https://fortune.adelante-properties.com'
            if (navigator.share) { try { await navigator.share({ title:'후아모', text:'사주×MBTI 운세', url }) } catch(e) {} }
            else { await navigator.clipboard.writeText(url); alert('링크가 복사됐습니다!') }
          }} style={{ padding:'7px 18px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:'12px', fontWeight:'600', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
            🔗 공유하기
          </button>
          <button onClick={() => onGoContact && onGoContact()} style={{ padding:'7px 18px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:'12px', fontWeight:'600', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
            📩 문의하기
          </button>
        </div>
      </div>

      {/* 메인 카드 */}
      <div style={{
        width:'100%', maxWidth:'400px',
        borderRadius:'28px',
        padding:'20px',
        position:'relative', zIndex:1,
        background:'rgba(255,255,255,0.06)',
        backdropFilter:'blur(40px)',
        WebkitBackdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.18)',
        boxShadow:`
          inset 0 2px 0 rgba(255,255,255,0.35),
          inset 0 -2px 0 rgba(0,0,0,0.3),
          inset 1.5px 0 0 rgba(255,255,255,0.12),
          inset -1.5px 0 0 rgba(255,255,255,0.06),
          0 0 0 1px rgba(255,255,255,0.1),
          0 6px 0 rgba(0,0,0,0.4),
          0 8px 16px rgba(0,0,0,0.4),
          0 16px 48px rgba(0,0,0,0.5),
          0 32px 80px rgba(0,0,0,0.3),
          0 0 80px rgba(120,40,255,0.18),
          0 0 160px rgba(120,40,255,0.1)
        `,
      }}>

        {/* 생년월일 — 라벨 밖, 숫자만 작은 박스 */}
        <div style={{ marginBottom:'12px' }}>
          <div style={{ display:'flex', gap:'8px' }}>
            {[
              { label:'Year', placeholder:'1995', key:'year', flex:2.2 },
              { label:'Month', placeholder:'5', key:'month', flex:1.2 },
              { label:'Day', placeholder:'1', key:'day', flex:1.2 },
            ].map(f => (
              <div key={f.key} style={{ flex:f.flex, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{ color:'rgba(180,160,255,0.85)', fontSize:'9px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', textShadow:'0 0 8px rgba(167,139,250,0.5)' }}>{f.label}</div>
                <div style={{ width:'100%', borderRadius:'12px', padding:'6px 4px', textAlign:'center', background:'rgba(255,255,255,0.09)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.18)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.25)' }}>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    style={{
                      width:'100%', background:'transparent', border:'none',
                      outline:'none', color:'#fff', fontSize:'18px', fontWeight:'800',
                      textAlign:'center', padding:'0', fontFamily:"'Noto Sans KR', sans-serif",
                      textShadow:'none', WebkitFontSmoothing:'antialiased',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 양력/음력 + 윤달 + 성별 — 한 줄 */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
          {/* 양력/음력 그룹 */}
          <button onClick={() => setForm({...form, calendar:'solar', is_leap:false})}
            style={pillSt(form.calendar === 'solar', 'linear-gradient(135deg, #7c3aed, #a78bfa)')}>
            ☀️ 양력
          </button>
          <button onClick={() => setForm({...form, calendar:'lunar'})}
            style={pillSt(form.calendar === 'lunar', 'linear-gradient(135deg, #1e40af, #3b82f6)')}>
            🌙 음력
          </button>
          {/* 윤달 — 음력 선택시 바로 옆에 */}
          {form.calendar === 'lunar' && (
            <button onClick={() => setForm({...form, is_leap: !form.is_leap})}
              style={pillSt(form.is_leap, 'linear-gradient(135deg, #059669, #34d399)')}>
              🌕 윤달
            </button>
          )}
          {/* 구분선 */}
          <div style={{ width:'1px', background:'rgba(255,255,255,0.1)', margin:'4px 0', flexShrink:0 }} />
          {/* 성별 그룹 */}
          <button onClick={() => setForm({...form, gender:'M'})}
            style={pillSt(form.gender === 'M', 'linear-gradient(135deg, #0ea5e9, #38bdf8)')}>
            ♂ 남자
          </button>
          <button onClick={() => setForm({...form, gender:'F'})}
            style={pillSt(form.gender === 'F', 'linear-gradient(135deg, #db2777, #f472b6)')}>
            ♀ 여자
          </button>
        </div>

        {/* 태어난 시간 */}
        <div style={{ marginBottom:'12px' }}>
          <div style={{ color:'rgba(200,180,255,0.7)', fontSize:'10px', fontWeight:'700', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'8px' }}>태어난 시간</div>
          <select
            value={form.hour ?? ''}
            onChange={e => setForm({...form, hour: e.target.value === '' ? null : parseInt(e.target.value)})}
            style={{
              width:'100%', padding:'12px 14px',
              background:'rgba(255,255,255,0.07)',
              backdropFilter:'blur(12px)',
              WebkitBackdropFilter:'blur(12px)',
              border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:'14px', color:'#fff',
              fontSize:'13px', outline:'none',
              cursor:'pointer',
              boxShadow:'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            {HOURS.map(h => (
              <option key={h.label} value={h.value ?? ''} style={{ background:'#1a0a2e', color:'#fff' }}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* 서비스 선택 */}
        <div style={{ marginBottom:'14px' }}>
          <div style={{ color:'rgba(200,180,255,0.7)', fontSize:'10px', fontWeight:'700', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'8px' }}>서비스 선택</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
            {SERVICES.map(s => {
              const active = form.service_type === s.value
              const c = s.color
              return (
                <button key={s.value}
                  onClick={() => setForm({...form, service_type: s.value})}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'11px 14px',
                    borderRadius:'16px', border:'none',
                    cursor:'pointer', textAlign:'left',
                    transition:'all 0.18s ease',
                    background: active
                      ? `linear-gradient(135deg, ${c.base.replace('0.15','0.28')} 0%, ${c.base.replace('0.15','0.18')} 100%)`
                      : `linear-gradient(135deg, ${c.base} 0%, rgba(255,255,255,0.03) 100%)`,
                    backdropFilter:'none',
                    WebkitBackdropFilter:'none',
                    outline: active ? `1.5px solid ${c.border}` : `1px solid ${c.border.replace('0.5','0.25')}`,
                    boxShadow: active ? `
                      inset 0 2px 0 rgba(255,255,255,0.4),
                      inset 0 -2px 0 rgba(0,0,0,0.35),
                      inset 1px 0 0 rgba(255,255,255,0.15),
                      inset -1px 0 0 rgba(255,255,255,0.08),
                      0 0 0 1px ${c.border},
                      0 6px 0 rgba(0,0,0,0.4),
                      0 8px 20px rgba(0,0,0,0.4),
                      0 0 30px ${c.glow.replace('0.5','0.45')},
                      0 0 60px ${c.glow.replace('0.5','0.2')},
                      0 0 100px ${c.glow.replace('0.5','0.1')}
                    ` : `
                      inset 0 1.5px 0 rgba(255,255,255,0.18),
                      inset 0 -1.5px 0 rgba(0,0,0,0.25),
                      inset 1px 0 0 rgba(255,255,255,0.06),
                      0 0 0 1px ${c.border.replace('0.5','0.2')},
                      0 3px 0 rgba(0,0,0,0.3),
                      0 4px 12px rgba(0,0,0,0.25),
                      0 0 16px ${c.glow.replace('0.5','0.1')}
                    `,
                    transform: active ? 'translateY(-3px) scale(1.015)' : 'translateY(0) scale(1)',
                  }}
                >
                  <div>
                    <div style={{ color:'#fff', fontSize:'14px', fontWeight:'700', marginBottom:'2px', display:'flex', alignItems:'center', gap:'6px', WebkitFontSmoothing:'antialiased', MozOsxFontSmoothing:'grayscale' }}>
                      {s.label}
                      {s.hot && <span style={{ fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'20px', background:'rgba(251,146,60,0.25)', color:'#fb923c', border:'1px solid rgba(251,146,60,0.4)' }}>🔥 인기</span>}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'11px', WebkitFontSmoothing:'antialiased', MozOsxFontSmoothing:'grayscale' }}>{s.sub}</div>
                  </div>
                  <span style={{
                    fontSize:'12px', fontWeight:'800',
                    padding:'5px 12px', borderRadius:'20px', whiteSpace:'nowrap',
                    background: `linear-gradient(180deg, ${c.base.replace('0.15','0.35')} 0%, ${c.base.replace('0.15','0.15')} 100%)`,
                    color: c.priceColor,
                    border: `1px solid ${c.border.replace('0.5','0.5')}`,
                    boxShadow: `
                      inset 0 1.5px 0 rgba(255,255,255,0.3),
                      inset 0 -1.5px 0 rgba(0,0,0,0.2),
                      0 3px 0 rgba(0,0,0,0.3),
                      0 4px 8px rgba(0,0,0,0.2),
                      0 0 14px ${c.glow.replace('0.5','0.35')}
                    `,
                    textShadow: 'none',
                    transform: 'translateY(-1px)',
                  }}>{s.price}</span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{ color:'#f87171', fontSize:'12px', textAlign:'center', marginBottom:'10px', background:'rgba(248,113,113,0.1)', padding:'10px', borderRadius:'12px', border:'1px solid rgba(248,113,113,0.2)' }}>
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width:'100%', padding:'16px',
            borderRadius:'18px', border:'none', cursor:'pointer',
            background: loading
              ? 'rgba(167,139,250,0.3)'
              : 'linear-gradient(135deg, #b347ff 0%, #e040fb 30%, #ff4db8 65%, #ff6b9d 100%)',
            color:'#fff', fontSize:'17px', fontWeight:'900',
            letterSpacing:'0.3px',
            boxShadow: loading ? 'none' : `
              0 4px 0 rgba(100,0,180,0.5),
              0 8px 30px rgba(180,50,255,0.5),
              0 0 60px rgba(255,50,180,0.25),
              inset 0 1px 0 rgba(255,255,255,0.3),
              inset 0 -2px 0 rgba(0,0,0,0.15)
            `,
            transform: loading ? 'none' : 'translateY(-1px)',
            transition:'all 0.15s',
          }}
        >
          {loading ? LOADING_MESSAGES[loadingMsg] : '내 기운 읽어줘 ✨'}
        </button>
      </div>

      {/* 하단 */}
      <div style={{ marginTop:'16px', textAlign:'center', position:'relative', zIndex:1, width:'100%', maxWidth:'400px' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:'0 0 4px' }}>
          🔒 이름 등 개인정보는 수집하지 않아
        </p>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', margin:'0 0 8px' }}>
          생년월일·성별은 서비스 개선 및 맞춤 정보 제공 목적으로 수집됩니다
        </p>
        <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginBottom:'12px' }}>
          {[
            { label:'개인정보처리방침', tab:'privacy' },
            { label:'이용약관', tab:'terms' },
            { label:'사업자정보', tab:'biz' },
          ].map((item, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              {i > 0 && <span style={{ color:'rgba(255,255,255,0.15)', fontSize:'10px' }}>·</span>}
              <button onClick={() => onGoPrivacy && onGoPrivacy(item.tab)} style={{ background:'none', border:'none', color:'rgba(167,139,250,0.5)', fontSize:'10px', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                {item.label}
              </button>
            </span>
          ))}
        </div>
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.2)', fontSize:'10px', lineHeight:'1.8', textAlign:'center' }}>
          아델란테주식회사 · 대표 이경은 · 사업자등록번호 219-88-01348<br/>
          서울특별시 성동구 왕십리로 326, 604호 · 070-8064-2663<br/>
          info@adelante-properties.com
        </div>
      </div>
    </div>
  )
}
