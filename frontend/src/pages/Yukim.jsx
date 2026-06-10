import { useState } from 'react'
import { calculateYukim } from '../services/api'

const QUESTION_TYPES = [
  {
    type: '사업/직업',
    emoji: '💼',
    items: ['취업/이직', '사업 시작', '계약/거래', '승진/발령', '창업']
  },
  {
    type: '연애/결혼',
    emoji: '❤️',
    items: ['새로운 만남', '고백/프로포즈', '결혼', '재회', '이별 후 관계']
  },
  {
    type: '재물/투자',
    emoji: '💰',
    items: ['투자/주식', '부동산', '대출/돈 빌리기', '복권/횡재', '빚 해결']
  },
  {
    type: '시험/학업',
    emoji: '📚',
    items: ['시험 합격', '입학/입시', '자격증', '유학', '학업 성취']
  },
  {
    type: '건강',
    emoji: '💪',
    items: ['병 완치', '수술 결과', '건강 회복', '임신/출산', '다이어트']
  },
  {
    type: '이사/여행',
    emoji: '🏠',
    items: ['이사', '해외여행', '이민', '귀향', '집 구매']
  },
]

export default function Yukim({ onResult, onBack, preFill }) {
  const [selectedType, setSelectedType] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [questionText, setQuestionText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState(0)

  const LOADING_MESSAGES = [
    '후아모가 점괘를 뽑는 중... ✨',
    '우주에서 답을 찾는 중... 🔮',
    '기운을 읽고 있어... 💫',
    '거의 다 됐어... 🤍',
  ]

  const toggleItem = (item) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const handleSubmit = async () => {
    if (!selectedType) { setError('질문 유형을 선택해줘'); return }
    if (selectedItems.length === 0) { setError('세부 항목을 하나 이상 선택해줘'); return }
    setError('')
    setLoading(true)
    const msgInterval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1800)
    try {
      const result = await calculateYukim({
        year: parseInt(preFill?.year || new Date().getFullYear()),
        month: parseInt(preFill?.month || new Date().getMonth() + 1),
        day: parseInt(preFill?.day || new Date().getDate()),
        hour: preFill?.hour ?? null,
        minute: 0,
        gender: preFill?.gender || 'M',
        calendar: preFill?.calendar || 'solar',
        question_type: selectedType,
        question_items: selectedItems,
        question_text: questionText || `${selectedType} - ${selectedItems.join(', ')}`,
      })
      console.log('육임 결과:', result)
      onResult({ ...result, type: 'yukim', form: preFill })
    } catch (e) {
      setError('앗, 뭔가 잘못됐어. 다시 시도해봐 🤍')
    } finally {
      setLoading(false)
      clearInterval(msgInterval)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5,0,20,0.93)',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <img src="/huamo2.png" alt="후아모" style={{
            width: '90px', height: '90px', objectFit: 'contain',
            marginBottom: '24px',
            filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.9))',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ fontSize: '22px', letterSpacing: '8px', marginBottom: '16px' }}>
            {['✦','✧','✦','✧','✦'].map((s,i) => (
              <span key={i} style={{
                display: 'inline-block',
                animation: `twinkle 1.2s ease-in-out ${i*0.2}s infinite`,
              }}>{s}</span>
            ))}
          </div>
          <div style={{
            color: '#e0aaff', fontSize: '15px', fontWeight: '700',
            textAlign: 'center', padding: '0 32px',
          }}>
            {LOADING_MESSAGES[loadingMsg]}
          </div>
          <style>{`
            @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
            @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }
          `}</style>
        </div>
      )}
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '16px',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <img src="/huamo2.png" alt="후아모" style={{
            width: '60px', height: '60px', objectFit: 'contain',
            display: 'block', margin: '0 auto 10px',
            filter: 'drop-shadow(0 0 15px rgba(167,139,250,0.4))'
          }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 4px' }}>
            이 일은 이루어질까? 🔮
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            궁금한 것을 선택해줘
          </p>
        </div>

        {/* 질문 유형 선택 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'rgba(200,180,255,0.9)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            어떤 일이 궁금해?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {QUESTION_TYPES.map(q => (
              <button key={q.type} onClick={() => { setSelectedType(q.type); setSelectedItems([]) }}
                style={{
                  padding: '12px', borderRadius: '12px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: selectedType === q.type
                    ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                    : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '13px', fontWeight: '700',
                  outline: selectedType === q.type ? '2px solid #a78bfa' : 'none',
                }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{q.emoji}</div>
                {q.type}
              </button>
            ))}
          </div>
        </div>

        {/* 세부 항목 */}
        {selectedType && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'rgba(200,180,255,0.9)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
              세부 항목 선택 (복수 가능)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUESTION_TYPES.find(q => q.type === selectedType)?.items.map(item => (
                <button key={item} onClick={() => toggleItem(item)}
                  style={{
                    padding: '8px 14px', borderRadius: '20px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    background: selectedItems.includes(item)
                      ? 'linear-gradient(135deg, #f472b6, #ec4899)'
                      : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 질문 직접 입력 (선택사항) */}
        {selectedType && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'rgba(200,180,255,0.9)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
              더 구체적으로 말해줘 (선택사항)
            </div>
            <input
              type="text"
              placeholder="예: 이번 면접에서 합격할 수 있을까?"
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {error && (
          <div style={{
            color: '#f87171', fontSize: '12px', textAlign: 'center',
            margin: '12px 0', background: 'rgba(248,113,113,0.1)',
            padding: '8px', borderRadius: '8px'
          }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: '14px',
          border: 'none', cursor: 'pointer',
          background: loading ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #ec4899)',
          color: '#fff', fontSize: '15px', fontWeight: '700',
          marginBottom: '12px',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(167,139,250,0.4)',
        }}>
          {loading ? '후아모가 읽는 중... 🤍' : '점괘 뽑아줘 🔮'}
        </button>

        <button onClick={onBack} style={{
          width: '100%', padding: '12px', borderRadius: '14px',
          border: 'none', background: 'transparent',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px',
        }}>
          돌아가기
        </button>
      </div>
    </div>
    </div>
  )
}
