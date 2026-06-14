import { useState } from 'react'
import { MonthlyWaveChart, DaewoonWaveChart } from '../components/WaveChart'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const SECTION_COLORS = {
  '📊': { border: '#6366f1', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
  '✨': { border: '#eab308', color: '#fde047', bg: 'rgba(234,179,8,0.12)' },
  '⚠️': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '📚': { border: '#10b981', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  '💼': { border: '#3b82f6', color: '#93c5fd', bg: 'rgba(59,130,246,0.12)' },
  '💰': { border: '#f59e0b', color: '#fcd34d', bg: 'rgba(234,179,8,0.12)' },
  '❤️': { border: '#ec4899', color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  '👥': { border: '#8b5cf6', color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)' },
  '🌿': { border: '#22c55e', color: '#86efac', bg: 'rgba(34,197,94,0.12)' },
  '🏠': { border: '#f97316', color: '#fdba74', bg: 'rgba(249,115,22,0.12)' },
  '📅': { border: '#6366f1', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
  '⚡': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '🌟': { border: '#a78bfa', color: '#ddd6fe', bg: 'rgba(167,139,250,0.12)' },
  '🎯': { border: '#f97316', color: '#fdba74', bg: 'rgba(249,115,22,0.12)' },
  '💑': { border: '#ec4899', color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  '💫': { border: '#a78bfa', color: '#ddd6fe', bg: 'rgba(167,139,250,0.12)' },
  '🔑': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '🧬': { border: '#10b981', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  '💥': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '🤫': { border: '#8b5cf6', color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)' },
  '💍': { border: '#ec4899', color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  '🌱': { border: '#22c55e', color: '#86efac', bg: 'rgba(34,197,94,0.12)' },
  '🌊': { border: '#3b82f6', color: '#93c5fd', bg: 'rgba(59,130,246,0.12)' },
  '🗺️': { border: '#8b5cf6', color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)' },
  '💡': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '🛡️': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '🔍': { border: '#6366f1', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
  '😔': { border: '#8b5cf6', color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)' },
  '💪': { border: '#10b981', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  '🚧': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '⏰': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '💌': { border: '#ec4899', color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  '🔥': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '👨': { border: '#f97316', color: '#fdba74', bg: 'rgba(249,115,22,0.12)' },
  '⭐': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '🌅': { border: '#f59e0b', color: '#fcd34d', bg: 'rgba(234,179,8,0.12)' },
  '🏆': { border: '#facc15', color: '#fef08a', bg: 'rgba(250,204,21,0.12)' },
  '💔': { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)' },
  '🌈': { border: '#6366f1', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
  '🤍': { border: '#a78bfa', color: '#ddd6fe', bg: 'rgba(167,139,250,0.12)' },
  '📊': { border: '#6366f1', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
}

function renderReading(text) {
  if (!text) return null
  const lines = text.split('\n')
  const result = []
  let currentSection = null
  let sectionContent = []
  let currentColor = '#a78bfa'

  const renderTextLine = (line, key) => {
    if (!line.trim()) return null
    // **볼드** → 섹션 색상으로
    const parts = line.split(/\*\*(.+?)\*\*/g)
    const rendered = parts.length > 1
      ? parts.map((p, j) => j % 2 === 1
          ? <span key={j} style={{ color: currentColor, fontWeight: '700' }}>{p}</span>
          : <span key={j}>{p}</span>)
      : line

    return (
      <p key={key} style={{
        margin: '0 0 10px 0',
        lineHeight: '1.85',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '14px',
      }}>{rendered}</p>
    )
  }

  const flushSection = (idx) => {
    if (currentSection) {
      const s = SECTION_COLORS[currentSection.emoji] || { border: '#a78bfa', color: '#ddd6fe', bg: 'rgba(167,139,250,0.12)' }
      result.push(
        <div key={`section-${idx}`} style={{
          background: s.bg,
          border: `1px solid ${s.border}50`,
          borderLeft: `4px solid ${s.border}`,
          borderRadius: '14px',
          padding: '16px 18px',
          marginBottom: '16px',
        }}>
          <div style={{
            color: s.color,
            fontWeight: '800',
            fontSize: '15px',
            marginBottom: '12px',
            textShadow: `0 0 12px ${s.border}80`,
          }}>
            {currentSection.title}
          </div>
          <div>
            {sectionContent.map((l, i) => renderTextLine(l, i))}
          </div>
        </div>
      )
    }
    sectionContent = []
    currentSection = null
  }

  // 이모지 없이도 "제목처럼 보이는 줄"을 섹션 헤더로 인식하기 위한 휴리스틱
  const FALLBACK_EMOJI = '🌟'
  const isLikelyHeading = (line, nextLine) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.length > 22) return false
    // 마침표/물음표/느낌표로 끝나면 본문 문장일 확률이 높음
    if (/[.!?。！？]$/.test(trimmed)) return false
    // 콜론으로 끝나는 라벨형 줄(예: "타고난 기질:")은 헤더로 보지 않음
    if (/[:：]$/.test(trimmed)) return false
    // 다음 줄이 존재하고 비어있지 않아야 본문이 이어지는 헤더로 간주
    if (nextLine === undefined) return false
    if (!nextLine.trim()) return false
    return true
  }

  lines.forEach((line, i) => {
    // 섹션 헤더 감지 (이모지로 시작)
    const emoji = Object.keys(SECTION_COLORS).find(e => line.startsWith(e))

    if (emoji) {
      flushSection(i)
      currentSection = { emoji, title: line }
      currentColor = SECTION_COLORS[emoji]?.color || '#a78bfa'
    } else if (line.includes('후아모가 이렇게 생각해')) {
      flushSection(i)
      result.push(
        <div key={`header-${i}`} style={{
          textAlign: 'center',
          color: '#e0aaff',
          fontWeight: '700',
          fontSize: '16px',
          margin: '8px 0 16px',
          textShadow: '0 0 12px rgba(167,139,250,0.6)',
        }}>{line}</div>
      )
    } else if (isLikelyHeading(line, lines[i + 1])) {
      // 이모지 없는 제목성 줄 → 새 섹션 시작 (기본 이모지 색상 사용)
      flushSection(i)
      currentSection = { emoji: FALLBACK_EMOJI, title: line.trim() }
      currentColor = SECTION_COLORS[FALLBACK_EMOJI]?.color || '#a78bfa'
    } else if (!currentSection) {
      // 아직 섹션이 시작되기 전의 일반 텍스트는 바로 본문으로 렌더링
      const rendered = renderTextLine(line, `pre-${i}`)
      if (rendered) result.push(rendered)
    } else {
      sectionContent.push(line)
    }
  })
  flushSection(lines.length)

  return result
}

export default function Result({ data, onBack, onGoonghap, onServiceChange, onUpgrade, loadingNext }) {
  const [showRaw, setShowRaw] = useState(false)
  const isGoonghap = data?.type === 'goonghap'
  const reading = data?.reading || ''
  const gReading = data?.reading || data?.goonghap_reading || ''
  const personA = isGoonghap ? (data?.person_a || {}) : data
  const personB = isGoonghap ? (data?.person_b || {}) : null
  const pillars = personA?.saju?.pillars || data?.pillars || []
  const daewoon = personA?.saju?.daewoon || data?.daewoon || []
  const monthlyChart = personA?.monthly_chart || data?.monthly_chart || []
  const daewoonChartA = personA?.daewoon_chart || data?.daewoon_chart || data?.mbti?.daewoon_chart || []
  const daewoonChartB = personB?.daewoon_chart || []
  const mbtiData = personA?.mbti || data?.mbti || data?.mbti_data || {}
  const mbtiDataB = personB?.mbti || {}
  const form = data?.form || data?.formA || {}
  const serviceType = isGoonghap ? 'goonghap' : (data?.type === 'yukim' ? 'yukim' : (form?.service_type || 'year'))
  const isYukim = serviceType === 'yukim' || data?.type === 'yukim'
  const originType = mbtiData?.origin_type || ''
  const currentType = mbtiData?.current_period_type || mbtiData?.current_type || originType
  const originTypeB = mbtiDataB?.origin_type || ''
  const currentTypeB = mbtiDataB?.current_period_type || mbtiDataB?.current_type || originTypeB

  const NEXT_PRODUCTS = {
    year: [
      { label: '올해 운세 FULL', sub: '월별로 언제 치고 언제 쉴지', price: '990원', type: 'year_full' },
      { label: '우리 궁합', sub: '우리 왜 이렇게 잘 맞아?', price: '1,990원', type: 'goonghap' },
    ],
    year_full: [
      { label: '우리 궁합', sub: '우리 왜 이렇게 잘 맞아?', price: '1,990원', type: 'goonghap' },
      { label: '평생 운세', sub: '내가 왜 이런 사람인지 이제 알겠어', price: '3,900원', type: 'life' },
    ],
    life: [
      { label: '올해 운세 FULL', sub: '올해 구체적인 흐름이 궁금해', price: '990원', type: 'year_full' },
      { label: '이 일은 이루어질까?', sub: 'YES or NO, 지금 바로 확인해', price: '990원', type: 'yukim' },
    ],
    goonghap: [
      { label: '평생 운세', sub: '내가 왜 이런 사람인지 이제 알겠어', price: '3,900원', type: 'life' },
      { label: '이 일은 이루어질까?', sub: 'YES or NO, 지금 바로 확인해', price: '990원', type: 'yukim' },
    ],
    yukim: [
      { label: '올해 운세 FULL', sub: '올해 전체 흐름이 궁금해', price: '990원', type: 'year_full' },
      { label: '우리 궁합', sub: '우리 왜 이렇게 잘 맞아?', price: '1,990원', type: 'goonghap' },
    ],
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0d0020 0%, #1a0035 30%, #0a0a3e 70%, #000d2e 100%)',
      padding: '20px 16px 80px',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div id="result-content" style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: '#fff',
            padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
          }}>← 다시 볼게</button>
          <div style={{ flex: 1, textAlign: 'center', color: '#a78bfa',
            fontWeight: '700', fontSize: '14px' }}>
            {isGoonghap ? '우리 궁합' :
              serviceType === 'year' ? '올해 내 운세' :
              serviceType === 'year_full' ? '올해 운세 FULL' :
              serviceType === 'life' ? '평생 운세' :
              serviceType === 'yukim' ? '이 일은 이루어질까?' : '운세 결과'}
          </div>
        </div>

        {/* MBTI 카드 — 궁합일 때 두 사람 나란히 */}
        {isGoonghap && originTypeB && (
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '16px',
          }}>
            {/* 나 */}
            <div style={{
              flex: 1,
              background: 'rgba(30,10,60,0.8)',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '16px', padding: '12px',
            }}>
              <div style={{ color: 'rgba(56,189,248,0.7)', fontSize: '11px', marginBottom: '6px', fontWeight: '700' }}>🙋 나</div>
              <div style={{ color: '#38bdf8', fontSize: '22px', fontWeight: '900' }}>{originType}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '4px 0' }}>→</div>
              <div style={{ color: '#f472b6', fontSize: '18px', fontWeight: '700' }}>{currentType}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginTop: '4px' }}>지금 이 시기</div>
            </div>
            {/* 상대방 */}
            <div style={{
              flex: 1,
              background: 'rgba(30,10,60,0.8)',
              border: '1px solid rgba(244,114,182,0.3)',
              borderRadius: '16px', padding: '12px',
            }}>
              <div style={{ color: 'rgba(244,114,182,0.7)', fontSize: '11px', marginBottom: '6px', fontWeight: '700' }}>🧑 상대방</div>
              <div style={{ color: '#f472b6', fontSize: '22px', fontWeight: '900' }}>{originTypeB}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '4px 0' }}>→</div>
              <div style={{ color: '#a78bfa', fontSize: '18px', fontWeight: '700' }}>{currentTypeB}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginTop: '4px' }}>지금 이 시기</div>
            </div>
          </div>
        )}
        {/* MBTI 카드 — 일반 */}
        {!isGoonghap && !isYukim && originType && (
          <div style={{
            background: 'rgba(30,10,60,0.8)',
            border: '1px solid rgba(150,80,255,0.3)',
            borderRadius: '16px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>타고난 기질</div>
                <div style={{ color: '#a78bfa', fontSize: '28px', fontWeight: '900' }}>{originType}</div>
              </div>
              <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '20px' }}>→</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>지금 이 시기</div>
                <div style={{ color: '#f472b6', fontSize: '28px', fontWeight: '900' }}>{currentType}</div>
              </div>
            </div>
            {originType !== currentType ? (
              <div style={{
                background: 'rgba(167,139,250,0.1)',
                borderRadius: '10px', padding: '10px 12px',
                marginBottom: '10px',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '13px', lineHeight: '1.7',
              }}>
                타고난 기질은 <span style={{ color: '#a78bfa', fontWeight: '700' }}>{originType}</span>이지만
                지금 이 시기에는 <span style={{ color: '#f472b6', fontWeight: '700' }}>{currentType}</span> 성향으로 살아가고 있어요.
                삶의 흐름과 환경이 당신을 변화시키고 있는 거예요 🌙
              </div>
            ) : (
              <div style={{
                background: 'rgba(167,139,250,0.1)',
                borderRadius: '10px', padding: '10px 12px',
                marginBottom: '10px',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '13px', lineHeight: '1.7',
              }}>
                타고난 기질 <span style={{ color: '#a78bfa', fontWeight: '700' }}>{originType}</span> 그대로
                살아가고 있어요. 지금 당신은 가장 자연스러운 상태예요 ✨
              </div>
            )}
            {mbtiData?.scores && Object.entries(mbtiData.scores).map(([axis, val]) => (
              <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', width: '20px' }}>{axis}</div>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    width: `${Math.abs(val) * 5 + 50}%`,
                    background: 'linear-gradient(90deg, #a78bfa, #ec4899)',
                  }} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', width: '60px', textAlign: 'right' }}>
                  {mbtiData?.axis_labels?.[axis] || ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 월별 차트 */}
        {/* 궁합 두 사람 대운 차트 */}
        {isGoonghap && daewoonChartA.length > 0 && (
          <div style={{
            background: 'rgba(20,8,50,0.85)',
            border: '1px solid rgba(150,80,255,0.2)',
            borderRadius: '16px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px', fontWeight: '700' }}>
              📊 두 사람 평생 에너지 흐름
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: '#38bdf8' }}>● 나</span>
              <span style={{ color: '#f472b6' }}>● 상대방</span>
            </div>
            <DaewoonWaveChart data={daewoonChartA} dataB={daewoonChartB} originType="goonghap" />
          </div>
        )}
        {serviceType === 'life' && daewoonChartA.length > 0 && !isGoonghap && (
          <div style={{
            background: 'rgba(30,10,60,0.8)',
            border: '1px solid rgba(150,80,255,0.3)',
            borderRadius: '16px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '8px', fontWeight: '700' }}>
              📊 10대부터 70대까지, 평생 에너지 흐름
            </div>
            <DaewoonWaveChart data={daewoonChartA} originType={originType} />
          </div>
        )}
        {monthlyChart.length > 0 && !isGoonghap && !isYukim && serviceType !== 'life' && (
          <div style={{
            background: 'rgba(30,10,60,0.8)',
            border: '1px solid rgba(150,80,255,0.3)',
            borderRadius: '16px', padding: '16px', marginBottom: '16px',
          }}>
            <MonthlyWaveChart data={monthlyChart} />
          </div>
        )}

        {/* 풀이문 */}
        <div style={{
          background: 'rgba(20,8,50,0.85)',
          border: '1px solid rgba(150,80,255,0.2)',
          borderRadius: '16px', padding: '18px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/huamo2.png" alt="후아모" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>후아모가 이렇게 생각해</span>
          </div>
          {renderReading(isGoonghap ? gReading : reading)}
        </div>

        {/* 사주 원국 */}
        {pillars.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowRaw(!showRaw)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: '12px',
                cursor: 'pointer', padding: '4px 0',
              }}
            >
              사주 원국 보기 {showRaw ? '▲' : '▼'}
            </button>
            {showRaw && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px', padding: '12px', marginTop: '8px',
              }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {pillars.map((p, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px' }}>
                        {['시', '일', '월', '년'][i]}
                      </div>
                      <div style={{
                        background: 'rgba(167,139,250,0.15)',
                        border: '1px solid rgba(167,139,250,0.3)',
                        borderRadius: '8px', padding: '8px 12px',
                        color: '#fff', fontSize: '16px', fontWeight: '700',
                      }}>
                        {p.pillar?.ganzi || '?'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 다음 상품 유도 */}
        <div style={{
          background: 'rgba(30,10,60,0.8)',
          border: '1px solid rgba(150,80,255,0.25)',
          borderRadius: '16px', padding: '16px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <img src="/huamo2.png" alt="후아모" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span style={{ color: '#c4b5fd', fontSize: '13px', fontWeight: '700' }}>더 자세히 알고 싶어?</span>
          </div>
          {loadingNext && (
            <div style={{
              textAlign: 'center', color: '#e0aaff', fontSize: '13px',
              fontWeight: '700', marginBottom: '12px',
              padding: '10px', background: 'rgba(167,139,250,0.1)',
              borderRadius: '10px',
            }}>
              후아모가 새로운 운세를 읽고 있어... 🤍 (최대 1분 정도 걸릴 수 있어요)
            </div>
          )}
          {(NEXT_PRODUCTS[serviceType] || NEXT_PRODUCTS.year).map((p, i) => (
            <button key={i}
              disabled={loadingNext}
              onClick={() => {
                if (loadingNext) return
                if (p.type === 'goonghap') { onGoonghap && onGoonghap(); return }
                if (onServiceChange) { onServiceChange(p.type); return }
                onBack && onBack(p.type)
              }}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '12px 14px', marginBottom: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: loadingNext ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                opacity: loadingNext ? 0.5 : 1,
              }}>
              <div>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{p.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{p.sub}</div>
              </div>
              <div style={{
                color: '#a78bfa', fontSize: '12px', fontWeight: '700',
                background: 'rgba(167,139,250,0.15)',
                padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
              }}>{loadingNext ? '...' : p.price}</div>
            </button>
          ))}
        </div>

        {/* 다시 보기 */}
        <button onClick={onBack} style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: 'rgba(255,255,255,0.5)',
          fontSize: '14px', cursor: 'pointer',
        }}>
        {/* 저장/인쇄 버튼 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={(e) => { e.stopPropagation(); window.print(); }} style={{
            flex: 1, padding: '12px',
            borderRadius: '12px', border: '1px solid rgba(167,139,250,0.3)',
            background: 'rgba(167,139,250,0.1)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          }}>
            🖨️ 인쇄하기
          </button>
          <button onClick={async (e) => {
            e.stopPropagation();
            try {
              const el = document.getElementById('result-content')
              const canvas = await html2canvas(el, {
                backgroundColor: '#1a0533',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                logging: false,
                ignoreElements: (el) => el.tagName === 'IFRAME',
              })
              const imgData = canvas.toDataURL('image/png')
              const pdf = new jsPDF('p', 'mm', 'a4')
              const pageWidth  = pdf.internal.pageSize.getWidth()
              const pageHeight = pdf.internal.pageSize.getHeight()
              const imgWidth  = pageWidth
              const imgHeight = (canvas.height * imgWidth) / canvas.width

              let heightLeft = imgHeight
              let position = 0

              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
              heightLeft -= pageHeight

              while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
              }

              pdf.save('후아모_운세결과.pdf')
            } catch(err) {
              console.error('캡처 오류:', err)
              // 폴백: 텍스트 저장
              const el = document.getElementById('result-content')
              const text = el ? el.innerText : ''
              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = '후아모_운세결과.txt'
              a.click()
            }
          }} style={{
            flex: 1, padding: '12px',
            borderRadius: '12px', border: '1px solid rgba(167,139,250,0.3)',
            background: 'rgba(167,139,250,0.1)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          }}>
            💾 저장하기
          </button>
        </div>
          다시 볼게 🤍
        </button>
      </div>
    </div>
  )
}
