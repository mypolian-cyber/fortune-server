import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell, BarChart, Bar
} from 'recharts'

const COLOR_MAP = {
  purple: '#a78bfa',
  blue:   '#60a5fa',
  gray:   '#9ca3af',
  orange: '#fb923c',
  red:    '#f87171',
}

const LABEL_MAP = {
  purple: '최고',
  blue:   '좋음',
  gray:   '보통',
  orange: '주의',
  red:    '조심',
}

// 월별 파동 차트
export function MonthlyWaveChart({ data, originType }) {
  if (!data || data.length === 0) return null

  // 4축 평균으로 단일 파동 생성
  const chartData = data.map(d => ({
    month: d.month,
    value: (d.EI + d.SN + (100 - d.TF) + (100 - d.JP)) / 4,
    color: d.color,
    label: d.quality_label,
    type:  d.type,
  }))

  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    return (
      <circle cx={cx} cy={cy} r={5}
        fill={COLOR_MAP[payload.color] || '#9ca3af'}
        stroke="#1a0a2e" strokeWidth={2}
      />
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div style={{
        background: 'rgba(26,10,46,0.95)',
        border: `1px solid ${COLOR_MAP[d?.color]}`,
        borderRadius: '12px', padding: '10px 14px',
        fontSize: '13px', color: '#fff'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: COLOR_MAP[d?.color] }}>{d?.label}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          이 달의 기운: {d?.type}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {Object.entries(COLOR_MAP).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              {LABEL_MAP[key]}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false} tickLine={false} />
          <YAxis hide={true} domain={[20, 80]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4" />
          <Line type="monotone" dataKey="value"
            stroke="rgba(167,139,250,0.3)"
            strokeWidth={2} dot={<CustomDot />}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 대운 파동 차트
export function DaewoonWaveChart({ data, originType }) {
  if (!data || data.length === 0) return null

  const chartData = data.map(d => ({
    age:   d.age_label,
    ganzi: d.ganzi,
    value: (d.EI + d.SN + (100 - d.TF) + (100 - d.JP)) / 4,
    color: d.color,
    label: d.quality_label,
    type:  d.type,
  }))

  const CustomBar = (props) => {
    const { x, y, width, height, payload } = props
    const color = COLOR_MAP[payload.color] || '#9ca3af'
    return (
      <g>
        <rect x={x} y={y} width={width} height={height}
          fill={color} opacity={0.7} rx={4} />
        <rect x={x} y={y} width={width} height={3}
          fill={color} rx={2} />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div style={{
        background: 'rgba(26,10,46,0.95)',
        border: `1px solid ${COLOR_MAP[d?.color]}`,
        borderRadius: '12px', padding: '10px 14px',
        fontSize: '13px', color: '#fff'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px',
          marginBottom: '4px' }}>{d?.ganzi}</div>
        <div style={{ color: COLOR_MAP[d?.color] }}>{d?.label}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          기운 유형: {d?.type}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {Object.entries(COLOR_MAP).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              {LABEL_MAP[key]}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="age" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={false} tickLine={false} />
          <YAxis hide={true} domain={[0, 80]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" shape={<CustomBar />}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={COLOR_MAP[entry.color]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
