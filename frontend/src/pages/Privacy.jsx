import React, { useState } from "react"

export default function Privacy({ onBack, initialTab }) {
  const [tab, setTab] = useState(initialTab || "privacy")

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.bar}>
          <button onClick={onBack} style={s.backBtn}>← 뒤로</button>
          <span style={s.barTitle}>약관 및 정책</span>
          <div style={{ width:60 }} />
        </div>

        <div style={s.tabs}>
          <button onClick={() => setTab("privacy")} style={{ ...s.tab, ...(tab==="privacy" ? s.tabOn : {}) }}>개인정보처리방침</button>
          <button onClick={() => setTab("terms")}   style={{ ...s.tab, ...(tab==="terms"   ? s.tabOn : {}) }}>이용약관</button>
          <button onClick={() => setTab("biz")}     style={{ ...s.tab, ...(tab==="biz"     ? s.tabOn : {}) }}>사업자정보</button>
        </div>

        <div style={s.body}>
          {tab === "privacy" && <Privacy_ />}
          {tab === "terms"   && <Terms />}
          {tab === "biz"     && <Biz />}
        </div>
      </div>
    </div>
  )
}

function Privacy_() {
  return (
    <div>
      <h2 style={s.h2}>개인정보처리방침</h2>
      <p style={s.updated}>시행일: 2026년 6월 12일</p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>아델란테주식회사(이하 "회사")는 후아모 기운 읽기(이하 "서비스") 제공을 위해 아래와 같은 정보를 수집합니다.</p>
        <ul style={s.ul}>
          <li>운세 분석을 위한 정보: 생년월일, 태어난 시(時), 성별, 양력/음력 구분</li>
          <li>궁합 서비스의 경우: 상대방의 생년월일, 태어난 시(時), 성별</li>
          <li>결제 시: 결제 내역, 주문번호 (결제대행사인 토스페이먼츠를 통해 처리되며, 카드번호 등 결제정보는 회사가 직접 저장하지 않습니다)</li>
          <li>문의 시: 이름, 이메일 주소, 문의 내용</li>
          <li>서비스 이용 과정에서 자동으로 생성되는 정보: 접속 로그, 쿠키, 접속 IP 정보</li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul style={s.ul}>
          <li>운세 분석 결과 생성 및 제공 (AI 기반 자동 분석)</li>
          <li>유료 서비스 결제 처리 및 환불, 분쟁 처리</li>
          <li>문의사항에 대한 답변 및 고지사항 전달</li>
          <li>서비스 품질 개선 및 부정 이용 방지</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, 관계 법령에 따라 보존할 필요가 있는 경우 회사는 아래와 같이 일정 기간 동안 회원정보를 보관합니다.</p>
        <ul style={s.ul}>
          <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>운세 분석을 위해 입력한 생년월일·시·성별 정보: 서비스 이용 종료 즉시 파기 (별도 회원 데이터베이스로 저장하지 않음)</li>
        </ul>
      </Section>

      <Section title="4. 개인정보의 제3자 제공 및 처리위탁">
        <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
        <ul style={s.ul}>
          <li><b>토스페이먼츠</b>: 결제 처리 (결제정보)</li>
          <li><b>OpenAI (GPT)</b>: 운세 분석 텍스트 생성 (생년월일·시·성별 정보를 기반으로 한 분석 요청. 별도 개인 식별정보는 전송하지 않음)</li>
        </ul>
        <p>회사는 법령에 근거하거나 이용자의 동의가 있는 경우를 제외하고는 개인정보를 제3자에게 제공하지 않습니다.</p>
      </Section>

      <Section title="5. 이용자의 권리">
        <p>이용자는 언제든지 자신의 개인정보 처리 현황에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다. 문의는 아래 이메일로 접수해 주세요.</p>
        <p style={s.contact}>info@adelante-properties.com</p>
      </Section>

      <Section title="6. 개인정보의 안전성 확보 조치">
        <p>회사는 개인정보의 안전성 확보를 위해 접근권한 관리, 전송구간 암호화(SSL), 접속기록 보관 등의 조치를 취하고 있습니다.</p>
      </Section>

      <Section title="7. 쿠키의 운용">
        <p>서비스는 이용자 편의를 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
      </Section>

      <Section title="8. 개인정보 보호책임자">
        <p>성명: 이경은 (대표)</p>
        <p>이메일: info@adelante-properties.com</p>
      </Section>

      <Section title="9. 고지의 의무">
        <p>본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 내 공지사항을 통해 고지합니다.</p>
      </Section>
    </div>
  )
}

function Terms() {
  return (
    <div>
      <h2 style={s.h2}>이용약관</h2>
      <p style={s.updated}>시행일: 2026년 6월 12일</p>

      <Section title="제1조 (목적)">
        <p>이 약관은 아델란테주식회사(이하 "회사")가 운영하는 후아모 기운 읽기(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      </Section>

      <Section title="제2조 (서비스의 내용)">
        <p>회사가 제공하는 서비스는 다음과 같습니다.</p>
        <ul style={s.ul}>
          <li>올해 내 운세: 사주×MBTI 기반 무료 다이제스트 운세 (무료)</li>
          <li>올해 운세 FULL: 월별 흐름과 상세 풀이를 제공하는 AI 기반 분석 (990원)</li>
          <li>평생 운세: 생애 전반(10대~80대 이후)의 흐름을 분석하는 AI 기반 분석 (3,900원)</li>
          <li>우리 궁합: 두 사람의 사주×MBTI를 비교 분석하는 AI 기반 궁합 분석 (1,990원)</li>
          <li>이 일은 이루어질까?: 이용자의 질문에 대한 육임 기반 AI 분석 (990원)</li>
        </ul>
        <p>본 서비스는 오락 및 참고 목적의 콘텐츠로, 의학적·법률적·재정적 자문을 대체하지 않습니다.</p>
      </Section>

      <Section title="제3조 (서비스 이용 및 결제)">
        <ul style={s.ul}>
          <li>이용자는 생년월일·시·성별 등 필요한 정보를 정확히 입력해야 하며, 입력 정보의 오류로 인한 결과의 부정확성에 대해 회사는 책임을 지지 않습니다.</li>
          <li>유료 서비스는 결제 완료 즉시 콘텐츠가 제공되는 디지털 콘텐츠로서, 콘텐츠 제공이 완료된 이후에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 청약철회가 제한될 수 있습니다.</li>
          <li>결제는 토스페이먼츠를 통해 처리되며, 회사는 카드정보 등 결제수단 정보를 직접 저장하지 않습니다.</li>
        </ul>
      </Section>

      <Section title="제4조 (환불 정책)">
        <ul style={s.ul}>
          <li>콘텐츠가 정상적으로 제공되지 않았거나, 시스템 오류로 인해 결과를 확인할 수 없는 경우 전액 환불해 드립니다.</li>
          <li>콘텐츠가 정상적으로 제공된 이후에는 단순 변심에 의한 환불이 제한될 수 있습니다.</li>
          <li>환불 요청은 info@adelante-properties.com 으로 결제 정보(주문번호, 결제일시)를 포함하여 접수해 주세요. 접수 후 영업일 기준 3일 이내 처리됩니다.</li>
        </ul>
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul style={s.ul}>
          <li>타인의 정보를 도용하여 서비스를 이용하는 행위</li>
          <li>서비스의 안정적 운영을 방해하는 행위 (자동화된 비정상 접근, 과도한 요청 등)</li>
          <li>서비스를 통해 얻은 콘텐츠를 무단으로 복제, 배포, 상업적으로 이용하는 행위</li>
        </ul>
      </Section>

      <Section title="제6조 (면책조항)">
        <ul style={s.ul}>
          <li>본 서비스가 제공하는 운세 분석 결과는 전통 명리학 이론과 AI 분석을 결합한 참고용 콘텐츠로, 그 정확성이나 미래 결과에 대해 어떠한 보증도 하지 않습니다.</li>
          <li>이용자가 서비스 결과를 토대로 한 판단 및 행동으로 인해 발생한 손해에 대해 회사는 책임을 지지 않습니다.</li>
          <li>천재지변, 시스템 장애 등 회사의 통상적인 노력으로 통제할 수 없는 사유로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
        </ul>
      </Section>

      <Section title="제7조 (약관의 변경)">
        <p>회사는 필요한 경우 관계 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 서비스 내 공지사항을 통해 사전 고지합니다.</p>
      </Section>

      <Section title="제8조 (분쟁 해결)">
        <p>서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사와 이용자가 성실히 협의하여 해결하며, 협의가 이루어지지 않을 경우 관련 법령 및 상관례에 따릅니다.</p>
      </Section>
    </div>
  )
}

function Biz() {
  return (
    <div>
      <h2 style={s.h2}>사업자정보</h2>
      <Section title="">
        <table style={s.table}>
          <tbody>
            <tr><td style={s.tdLabel}>상호명</td><td style={s.td}>아델란테주식회사</td></tr>
            <tr><td style={s.tdLabel}>대표자</td><td style={s.td}>이경은</td></tr>
            <tr><td style={s.tdLabel}>사업자등록번호</td><td style={s.td}>219-88-01348</td></tr>
            <tr><td style={s.tdLabel}>사업장 주소</td><td style={s.td}>서울특별시 성동구 왕십리로 326, 604호</td></tr>
            <tr><td style={s.tdLabel}>이메일</td><td style={s.td}>info@adelante-properties.com</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize:11, color:"#999", marginTop:12, lineHeight:1.7 }}>
          사업자등록정보는 국세청 홈택스 사업자등록상태조회 서비스를 통해 확인하실 수 있습니다.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      {title && <h3 style={s.h3}>{title}</h3>}
      <div style={s.content}>{children}</div>
    </div>
  )
}

const s = {
  page:    { minHeight:"100vh", background:"#f0f0f0", display:"flex", justifyContent:"center" },
  card:    { width:"100%", maxWidth:480, minHeight:"100vh", background:"#fff", fontFamily:"Noto Sans KR,sans-serif" },
  bar:     { background:"#1a0a2e", padding:"11px 16px 9px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  backBtn: { background:"transparent", border:"none", color:"rgba(212,187,255,0.8)", fontSize:13, cursor:"pointer" },
  barTitle:{ fontSize:14, fontWeight:500, color:"#c9a84c", letterSpacing:"0.05em" },
  tabs:    { display:"flex", borderBottom:"1px solid #eee" },
  tab:     { flex:1, padding:"11px 0", fontSize:12, color:"#999", background:"none", border:"none", borderBottom:"2px solid transparent", cursor:"pointer" },
  tabOn:   { color:"#7c3aed", borderBottom:"2px solid #7c3aed", fontWeight:500 },
  body:    { padding:"18px 16px 40px" },
  h2:      { fontSize:16, fontWeight:600, color:"#1a1a1a", marginBottom:4 },
  updated: { fontSize:11, color:"#999", marginBottom:18 },
  h3:      { fontSize:13, fontWeight:600, color:"#333", marginBottom:6 },
  content: { fontSize:12.5, color:"#555", lineHeight:1.8 },
  ul:      { margin:"6px 0 0", paddingLeft:18 },
  contact: { color:"#7c3aed", fontWeight:500 },
  table:   { width:"100%", borderCollapse:"collapse", fontSize:12.5 },
  tdLabel: { padding:"8px 10px", background:"#f7f7f7", color:"#666", fontWeight:500, width:"35%", border:"1px solid #eee" },
  td:      { padding:"8px 10px", color:"#1a1a1a", border:"1px solid #eee" },
}
