import { useState } from 'react'

export default function ContactModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setError('이름, 이메일, 문의 내용은 필수입니다')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) setDone(true)
      else setError('전송에 실패했습니다. 다시 시도해주세요.')
    } catch (e) {
      setError('전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  }

  const boxStyle = {
    width: '100%', maxWidth: '420px',
    background: 'linear-gradient(160deg, rgba(30,10,60,0.97) 0%, rgba(10,5,40,0.97) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(150,80,255,0.35)',
    boxShadow: '0 0 60px rgba(120,40,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
    padding: '24px',
    fontFamily: "'Noto Sans KR', sans-serif",
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(120,80,255,0.35)',
    borderRadius: '12px',
    color: '#fff', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    marginBottom: '10px',
  }

  const labelStyle = {
    color: 'rgba(200,180,255,0.8)',
    fontSize: '12px', fontWeight: '600',
    display: 'block', marginBottom: '5px',
  }

  if (done) return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <div style={{ color: '#a78bfa', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            문의가 접수되었습니다
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>
            입력하신 이메일로 답변 드릴게요 🤍
          </div>
          <button onClick={onClose} style={{
            padding: '12px 32px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #b347ff, #ff4db8)',
            color: '#fff', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer',
          }}>닫기</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '17px', fontWeight: '800' }}>
              📩 문의하기
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '3px' }}>
              이메일 주소 없이 문의하실 수 있습니다
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', padding: '6px 10px', fontSize: '13px',
          }}>✕</button>
        </div>

        {/* 이름 */}
        <label style={labelStyle}>이름 (필수)</label>
        <input
          type="text" placeholder="이름을 입력하세요"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          style={inputStyle}
        />

        {/* 이메일 */}
        <label style={labelStyle}>이메일 (답변 받을 주소)</label>
        <input
          type="email" placeholder="이메일을 입력하세요"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          style={inputStyle}
        />

        {/* 제목 */}
        <label style={labelStyle}>제목</label>
        <input
          type="text" placeholder="제목을 입력하세요"
          value={form.subject}
          onChange={e => setForm({...form, subject: e.target.value})}
          style={inputStyle}
        />

        {/* 내용 */}
        <label style={labelStyle}>문의 내용을 입력하세요</label>
        <textarea
          placeholder="문의 내용을 입력하세요"
          value={form.message}
          onChange={e => setForm({...form, message: e.target.value})}
          rows={5}
          style={{
            ...inputStyle,
            resize: 'vertical', lineHeight: '1.6',
          }}
        />

        {error && (
          <div style={{
            color: '#f87171', fontSize: '12px',
            background: 'rgba(248,113,113,0.1)',
            padding: '8px 12px', borderRadius: '8px',
            marginBottom: '10px',
          }}>{error}</div>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '13px',
            borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: loading
              ? 'rgba(167,139,250,0.3)'
              : 'linear-gradient(135deg, #b347ff, #ff4db8)',
            color: '#fff', fontSize: '14px', fontWeight: '700',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(180,50,255,0.4)',
          }}>
            {loading ? '전송 중...' : '전송 ▶'}
          </button>
          <button onClick={onClose} style={{
            padding: '13px 20px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer', fontSize: '13px',
          }}>닫기</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px',
          color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
          답변은 입력하신 이메일로 드립니다
        </div>
      </div>
    </div>
  )
}
