import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { MonthlyWaveChart, DaewoonWaveChart } from '../components/WaveChart'

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '20px',
  padding: '20px',
  border: '1px solid rgba(255,255,255,0.07)',
  marginBottom: '16px',
}

const labelStyle = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  letterSpacing: '0.8px',
  marginBottom: '12px',
  display: 'block',
}

export default function Result({ data, onBack }) {
  const [tab, setTab] = useState('reading')
  const { saju, mbti, reading, form } = data
  const pillars = saju?.pillars || []
  const pillarLabels = ['년주', '월주', '일주', '시주']
  const serviceType = form?.service_type || 'year'

  // 월별·대운 차트 데이터 (API에서 받아야 함 — 임시 더미)
  const monthlyChart = data.monthly_chart || []
  const daewoonChart = data.daewoon_chart || []

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '24px 16px',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '12px',
            padding: '8px 16px', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: '13px'
          }}>← 돌아가기</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/huamo2.png" alt="후아모"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              후아모의 기운 리포트
            </span>
          </div>
        </div>

        {/* MBTI 원국 */}
        {mbti && (
          <div style={sectionStyle}>
            <span style={labelStyle}>타고난 기질</span>
            <div style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{
                  fontSize: '36px', fontWeight: '800',
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}>
                  {mbti.origin_type}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)',
                  fontSize: '12px', marginTop: '4px' }}>
                  타고난 에너지 중심
                </div>
              </div>
              {mbti.current_period_type !== mbti.origin_type && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700',
                    color: '#fb923c' }}>
                    {mbti.current_period_type}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                    지금 이 시기
                  </div>
                </div>
              )}
            </div>

            {/* 4축 바 (수치 없이) */}
            {mbti.labels && Object.entries(mbti.labels).map(([axis, info]) => (
              <div key={axis} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                    {axis}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                    {info.type} · {info.strength}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    width: `${info.score}%`,
                    background: 'linear-gradient(90deg, #a78bfa, #ec4899)',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 올해 월별 파동 차트 (유료) */}
        {serviceType === 'year' && monthlyChart.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>2026년 월별 기운 흐름</span>
            <MonthlyWaveChart data={monthlyChart} originType={mbti?.origin_type} />
          </div>
        )}

        {/* 평생 대운 파동 차트 (유료) */}
        {serviceType === 'life' && daewoonChart.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>평생 기운 흐름</span>
            <DaewoonWaveChart data={daewoonChart} originType={mbti?.origin_type} />
          </div>
        )}

        {/* 풀이문 */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '16px' }}>
            <img src="/huamo2.png" alt="후아모"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={labelStyle}>
              후아모가 이렇게 생각해
            </span>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '14px', lineHeight: '1.8',
          }}>
            <ReactMarkdown
              components={{
                p: ({children}) => (
                  <p style={{ marginBottom: '12px' }}>{children}</p>
                ),
                strong: ({children}) => (
                  <strong style={{ color: '#a78bfa', fontWeight: '700' }}>
                    {children}
                  </strong>
                ),
                em: ({children}) => (
                  <em style={{ color: '#ec4899' }}>{children}</em>
                ),
                h1: ({children}) => (
                  <h1 style={{ color: '#fff', fontSize: '16px',
                    fontWeight: '800', marginBottom: '12px' }}>
                    {children}
                  </h1>
                ),
                h2: ({children}) => (
                  <h2 style={{ color: '#fff', fontSize: '15px',
                    fontWeight: '700', marginBottom: '10px',
                    marginTop: '16px' }}>
                    {children}
                  </h2>
                ),
                li: ({children}) => (
                  <li style={{ marginBottom: '6px', paddingLeft: '4px' }}>
                    {children}
                  </li>
                ),
                ul: ({children}) => (
                  <ul style={{ paddingLeft: '16px', marginBottom: '12px' }}>
                    {children}
                  </ul>
                ),
              }}
            >
              {reading}
            </ReactMarkdown>
          </div>
        </div>

        {/* 사주 원국 (접기) */}
        <details style={{ marginBottom: '16px' }}>
          <summary style={{
            color: 'rgba(255,255,255,0.3)', fontSize: '12px',
            cursor: 'pointer', padding: '8px 0',
            listStyle: 'none',
          }}>
            사주 원국 보기 ▾
          </summary>
          <div style={{ ...sectionStyle, marginTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: '8px' }}>
              {pillars.map((p, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px', padding: '12px 8px',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)',
                    fontSize: '10px', marginBottom: '6px' }}>
                    {pillarLabels[i]}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700',
                    color: '#a78bfa' }}>
                    {p.pillar.stem}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700',
                    color: '#ec4899' }}>
                    {p.pillar.branch}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)',
                    fontSize: '10px', marginTop: '4px' }}>
                    {p.stemSipsin}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* 유료 서비스 유도 (무료일 때만) */}
        {serviceType === 'year' && (
          <div style={{
            ...sectionStyle,
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '12px' }}>
              <img src="/huamo2.png" alt="후아모"
                style={{ width: '20px', height: '20px' }} />
              <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: '600' }}>
                더 자세히 알고 싶어?
              </span>
            </div>
            {[
              { type: 'life',     label: '평생 기운 + 대운 파동', price: '1,650원' },
              { type: 'goonghap', label: '우리 궁합 보기',         price: '1,650원' },
              { type: 'yukim',    label: '지금 이 질문의 답',      price: '1,650원' },
            ].map(s => (
              <button key={s.type}
                style={{
                  width: '100%', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: '14px',
                  border: '1px solid rgba(167,139,250,0.15)',
                  background: 'rgba(167,139,250,0.06)',
                  color: '#fff', cursor: 'pointer',
                  marginBottom: '8px', fontSize: '13px',
                }}>
                <span>{s.label}</span>
                <span style={{ color: '#a78bfa', fontWeight: '700',
                  fontSize: '12px' }}>{s.price}</span>
              </button>
            ))}
          </div>
        )}

        {/* 다시하기 */}
        <button onClick={onBack} style={{
          width: '100%', padding: '14px',
          borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: '14px',
        }}>
          다시 볼게 🤍
        </button>

      </div>
    </div>
  )
}
