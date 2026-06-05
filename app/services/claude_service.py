import os
import httpx
from typing import Optional
from app.services.prompt_principles import (
    COMMON_PRINCIPLES,
    analyze_daewoon_quality,
    build_relation_context,
)
from app.engines.monthly_engine import get_best_worst_months

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

async def generate_reading(
    service_type: str,
    saju_data: dict,
    mbti_data: dict,
    gender: str,
    target_year: Optional[int] = None,
    monthly_chart: list = None,
) -> str:
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "your_api_key_here":
        return _dummy_response(service_type, mbti_data, monthly_chart or [])

    prompt = _build_prompt(
        service_type, saju_data, mbti_data, gender,
        target_year, monthly_chart or []
    )

    model = "claude-haiku-4-5-20251001" if service_type == "year" else "claude-sonnet-4-20250514"
    max_tokens = 600 if service_type == "year" else 2000

    last_error = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "messages": [{"role": "user", "content": prompt}]
                    },
                    timeout=40.0
                )
                result = response.json()
                if response.status_code == 529:
                    raise Exception("Claude API 과부하 — 재시도")
                if response.status_code != 200:
                    raise Exception(f"Claude API 오류: {result.get('error', {}).get('message', '알 수 없는 오류')}")
                return result["content"][0]["text"]
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            last_error = e
            if attempt < 2:
                import asyncio
                await asyncio.sleep(2 ** attempt)
        except Exception as e:
            last_error = e
            if attempt < 2 and "재시도" in str(e):
                import asyncio
                await asyncio.sleep(2 ** attempt)
            else:
                raise
    raise Exception(f"Claude API 3회 시도 실패: {last_error}")


def _build_prompt(
    service_type: str,
    saju_data: dict,
    mbti_data: dict,
    gender: str,
    target_year: Optional[int],
    monthly_chart: list,
) -> str:
    pillars         = saju_data.get("pillars", [])
    daewoon         = saju_data.get("daewoon", [])
    origin_scores   = mbti_data.get("origin_scores", {})
    origin_type     = mbti_data.get("origin_type", "")
    current_scores  = mbti_data.get("current_period_scores", origin_scores)
    current_type    = mbti_data.get("current_period_type", origin_type)
    current_daewoon = mbti_data.get("current_daewoon")
    gender_str      = "남성" if gender == "M" else "여성"

    pillar_str  = " / ".join([p["pillar"]["ganzi"] for p in pillars]) if pillars else "정보 없음"
    daewoon_str = ""
    if current_daewoon:
        daewoon_str = f"현재 대운: {current_daewoon.get('ganzi','')} ({current_daewoon.get('age','')}세~)"

    daewoon_quality = analyze_daewoon_quality(
        origin_scores, origin_type, current_scores, current_type
    )
    overall_flow = daewoon_quality.get("overall", "")
    total_score  = daewoon_quality.get("total_score", 0)

    bw = get_best_worst_months(monthly_chart) if monthly_chart else {"best": [], "worst": []}
    best_months  = ", ".join([m["month"] for m in bw["best"]])
    worst_months = ", ".join([m["month"] for m in bw["worst"]])

    relation_ctx = build_relation_context(pillars, daewoon_quality)

    def axis_desc(scores, axis):
        v = scores.get(axis, 50)
        letters = {"EI": ("E","I"), "SN": ("N","S"), "TF": ("F","T"), "JP": ("P","J")}
        high, low = letters[axis]
        dominant = high if v >= 50 else low
        diff = abs(v - 50)
        strength = "강하게" if diff >= 20 else ("보통으로" if diff >= 10 else "약하게")
        return f"{dominant} 성향 {strength} ({v:.0f}/100)"

    scores_str = "\n".join([
        f"  - EI축: {axis_desc(origin_scores, 'EI')}",
        f"  - SN축: {axis_desc(origin_scores, 'SN')}",
        f"  - TF축: {axis_desc(origin_scores, 'TF')}",
        f"  - JP축: {axis_desc(origin_scores, 'JP')}",
    ])
    current_scores_str = "\n".join([
        f"  - EI축: {axis_desc(current_scores, 'EI')}",
        f"  - SN축: {axis_desc(current_scores, 'SN')}",
        f"  - TF축: {axis_desc(current_scores, 'TF')}",
        f"  - JP축: {axis_desc(current_scores, 'JP')}",
    ])

    header = f"""[사용자 기본 정보]
사주 원국: {pillar_str}
성별: {gender_str}
타고난 기질(MBTI): {origin_type}
원국 스코어:
{scores_str}

[현재 시기 에너지]
{daewoon_str}
현재 성향: {current_type}
현재 스코어:
{current_scores_str}
전체 흐름: {overall_flow} (점수: {total_score})

[관계별 행동 컨텍스트]
{relation_ctx if relation_ctx else "해당 없음"}

{COMMON_PRINCIPLES}
"""

    if service_type == "year":
        return header + _prompt_year_free(target_year, origin_type, current_type, overall_flow)
    elif service_type == "year_full":
        return header + _prompt_year_full(
            target_year, origin_type, current_type,
            overall_flow, best_months, worst_months, monthly_chart
        )
    elif service_type == "life":
        return header + _prompt_life(origin_type, current_type, overall_flow, daewoon_quality)
    elif service_type == "goonghap":
        return header + _prompt_goonghap(origin_type, current_type)
    else:
        return header + f"\n{target_year or ''}년 운세를 MZ세대 언어로 풀어주세요."


def _prompt_year_free(target_year, origin_type, current_type, overall_flow):
    return f"""
[서비스 유형] {target_year}년 운세 무료 다이제스트

[작성 지침]
- 600~800자 (10줄 내외)
- {target_year}년 전체 에너지 흐름을 2~3줄로 먼저 잡아줄 것
- 타고난 기질({origin_type})과 지금 이 시기 성향({current_type})이 어떻게 다른지,
  그 차이가 올해 어떤 느낌으로 나타나는지 공감되게 2~3줄
- 전체 흐름 "{overall_flow}"를 반영해 올해의 핵심 키워드 1개 제시
- 커리어 또는 관계 중 하나만 골라 2~3줄 구체적으로 서술
- 구체적 행동 조언 2개 (오늘 당장 할 수 있는 것)
- 읽고 나서 "맞아, 더 보고 싶다"는 느낌이 들도록 마무리
- 마지막 1줄: 유료 전환 유도 — 강요 말고 궁금증을 남기는 방식으로
- 사주·오행·천간·지지 등 전통 용어 절대 금지
- 볼드(**) 사용 금지 — 이모지로만 구분

[출력 형식]
후아모가 이렇게 생각해 🤍

(올해 전체 흐름 — 2~3줄)

(기질과 시기 성향의 차이 — 2~3줄)

(커리어 또는 관계 중 하나 — 2~3줄 구체적으로)

⚡ 지금 해볼 것
(행동 조언 2개 — 각 1~2줄)

(궁금증을 남기는 마무리 + 유료 전환 유도 1줄)
"""


def _prompt_year_full(
    target_year, origin_type, current_type,
    overall_flow, best_months, worst_months, monthly_chart
):
    month_summary = ""
    if monthly_chart:
        for m in monthly_chart:
            month_summary += f"  {m['month']}: {m['quality_label']} ({m['color']})\n"

    return f"""
[서비스 유형] {target_year}년 운세 풀버전 (유료)

[월별 에너지 데이터]
{month_summary}
가장 좋은 달: {best_months}
주의할 달: {worst_months}

[작성 지침]
- 1,500자 이상
- 타고난 기질({origin_type})이 이 시기에 {current_type} 모드로 움직이는 이유 설명
- 전체 흐름 "{overall_flow}" 반영해 한 해 전체 조망
- 가장 좋은 달과 주의할 달 구체적으로 언급
- 커리어·관계·재물·건강 4개 영역 각각 최소 150자
- 구체적 행동 조언 최소 3개
- 사주·오행·천간·지지 등 전통 용어 절대 금지
- 볼드(**) 사용 금지

[출력 형식]
후아모가 이렇게 생각해 🤍

(타고난 기질과 올해 에너지 — 2~3줄)

📊 올해 기운 흐름
(월별 흐름 요약 — 2~3줄)

✨ 가장 좋은 달
(구체적 행동 권장 포함)

⚠️ 조심해야 할 달
(구체적 대응 방법 포함)

💼 커리어
(최소 150자)

❤️ 관계
(최소 150자)

💰 재물
(최소 150자)

🌿 건강
(최소 120자, 마지막에 면책 문구)

⚡ 지금 당장 해야 할 것
(3가지 이상, 구체적으로)

🌟 마무리
(희망적 메시지 2~3줄)
"""


def _prompt_life(origin_type, current_type, overall_flow, daewoon_quality):
    axes = daewoon_quality.get("axes", {})
    daewoon_summary = ""
    for axis, v in axes.items():
        daewoon_summary += f"  {axis}축: {v['moving']}방향 [{v['quality']}]"
        if v.get("action"):
            daewoon_summary += f" → {v['action']}"
        daewoon_summary += "\n"

    return f"""
[서비스 유형] 평생 기운 (유료)

[대운 에너지 분석]
{daewoon_summary}

[작성 지침]
- 1,500자 이상
- 타고난 기질({origin_type})이 인생 전체에서 어떻게 작동하는지 설명
- 현재 시기({current_type} 모드, {overall_flow})를 중심으로
- 대운 에너지를 현대 심리 언어로만 풀어쓰기
- 인생의 큰 흐름을 파도나 계절 같은 은유로 표현
- 지금 집중할 것과 내려놓을 것 명확히
- 구체적 행동 조언 최소 3개
- 사주·오행·천간·지지·대운 등 전통 용어 절대 금지
- 볼드(**) 사용 금지

[출력 형식]
후아모가 이렇게 생각해 🤍

🌱 타고난 기질 — {origin_type}
(원국이 만드는 중력 중심 — 최소 200자)

🌊 지금 이 시기의 파도
(현재 에너지를 현대어로 — 최소 200자)

🗺️ 인생의 지도
(전체 흐름 조망 — 최소 150자)

💡 지금 집중할 것
(최소 120자)

🛡️ 내려놓을 것
(최소 120자)

⚡ 지금 당장 해야 할 것
(3가지 이상, 구체적으로)

🌟 마무리
(희망적이고 따뜻한 마무리 — 2~3줄)
"""


def _prompt_goonghap(origin_type, current_type):
    return f"""
[서비스 유형] 궁합 (유료)

[작성 지침]
- 1,500자 이상
- 두 사람의 기질 차이가 만드는 긴장과 시너지 모두 서술
- 타고난 기질({origin_type})이 상대방과 어떻게 상호작용하는지
- 현재 시기({current_type} 모드)가 관계에 미치는 영향
- 갈등 상황에서 구체적 대처법
- 사주·오행·천간·지지 등 전통 용어 절대 금지
- 볼드(**) 사용 금지

[출력 형식]
후아모가 이렇게 생각해 🤍

🔍 두 사람의 에너지 차이
(최소 200자)

✨ 시너지가 나는 부분
(최소 200자)

⚡ 주의해야 할 부분
(최소 200자)

💬 대화법
(최소 150자)

🌟 마무리
(희망적 메시지 — 2~3줄)
"""


def _dummy_response(service_type: str, mbti_data: dict, monthly_chart: list) -> str:
    origin_type  = mbti_data.get("origin_type", "ESTJ")
    current_type = mbti_data.get("current_period_type", origin_type)
    bw = get_best_worst_months(monthly_chart) if monthly_chart else {"best": [], "worst": []}
    best_str  = ", ".join([m["month"] for m in bw["best"]])  if bw["best"]  else "확인 중"
    worst_str = ", ".join([m["month"] for m in bw["worst"]]) if bw["worst"] else "확인 중"

    if service_type == "year":
        return f"""후아모가 이렇게 생각해 🤍

너의 타고난 기질은 {origin_type}이야.
지금 이 시기엔 {current_type} 모드로 움직이고 있어.
올해는 계획했던 것들을 밀어붙이기 좋은 흐름이야.

타고난 성향과 지금 시기의 에너지가 살짝 엇갈리는 느낌이 있어.
그게 오히려 새로운 걸 시도할 수 있는 틈이 되기도 해.
올해 키워드는 하나야 — 실행.

지금 네 에너지가 가장 잘 흐르는 건 관계 쪽이야.
오랫동안 연락이 뜸했던 사람이 한 명쯤 떠오르지 않아?
그 사람한테 먼저 연락하는 게 올해 흐름을 여는 첫 번째 열쇠야.

⚡ 지금 해볼 것
오늘 미뤄왔던 연락 하나, 지금 바로 해봐. 타이밍이야.
지금 떠오르는 아이디어 하나, 메모장에 적어두자. 흘려보내지 마.

월별로 에너지가 어떻게 흐르는지, 어떤 달에 밀고 어떤 달에 쉬어야 하는지 궁금하다면 풀버전을 확인해봐 🌙

*개발 테스트용 더미 응답*"""

    elif service_type == "year_full":
        return f"""후아모가 이렇게 생각해 🤍

너의 타고난 기질은 {origin_type}이야.
지금 이 시기엔 {current_type} 모드로 움직이고 있어.

📊 올해 기운 흐름
위 차트를 보면 올해 에너지 흐름이 한눈에 보여.

✨ 가장 좋은 달
{best_str} — 이 시기엔 적극적으로 움직여봐. 미뤄왔던 것들, 지금이 딱이야.

⚠️ 조심해야 할 달
{worst_str} — 이 시기엔 큰 결정보다 현상 유지가 더 현명해.

💼 커리어
지금 대운의 흐름이 실행력을 높여주는 시기야. 계획했던 것들 밀어붙이기 좋아.

❤️ 관계
주변 사람들과의 에너지 교류가 활발해지는 시기야.
오랫동안 연락 못 했던 친구에게 이모티콘 하나만 보내봐. 그걸로 충분해 🤍

💰 재물
지금은 벌기보다 쌓는 시기야. 큰 투자보다 기반을 다지는 방향이 맞아.

🌿 건강
에너지가 넘치는 만큼 무리하지 않는 게 중요해. 번아웃 오면 다 날아가거든.

⚡ 지금 당장 해야 할 것
오늘 미뤄왔던 연락 하나, 지금 바로 해봐. 타이밍이야.
지금 떠오르는 아이디어, 메모장에 적어두자. 흘려보내지 마.
오늘 지출 하나만 줄여봐. 작은 것부터 시작하는 거야.

🌟 마무리
지금 이 순간, 너는 이미 충분히 잘 하고 있어. 흐름은 네 편이야 🤍

*개발 테스트용 더미 응답*"""

    elif service_type == "life":
        return f"""후아모가 이렇게 생각해 🤍

🌱 타고난 기질 — {origin_type}
당신의 원국이 만드는 중력 중심이에요. 어떤 시기에도 결국 이 지점으로 돌아와요.

🌊 지금 이 시기의 파도
지금은 {current_type} 모드가 활성화된 시기예요. 이 에너지를 잘 활용하면 큰 도약이 가능해요.

⚡ 지금 당장 해야 할 것
오늘 오랫동안 연락 못 했던 사람에게 짧은 메시지 하나 보내보세요.
지금 떠오르는 아이디어를 메모장에 적어두세요.
오늘 물 한 잔 마시고 5분만 스트레칭해보세요.

🌟 마무리
지금 이 순간, 당신은 이미 충분히 잘 하고 있어요. 흐름은 당신 편이에요 🤍

*개발 테스트용 더미 응답*"""

    else:
        return "개발 테스트용 더미 응답입니다."


async def generate_goonghap_reading(
    person_a: dict,
    person_b: dict,
    goonghap_score: dict,
    target_year: int,
) -> str:
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "your_api_key_here":
        return _dummy_goonghap(person_a, person_b, goonghap_score)

    prompt = _build_goonghap_prompt(person_a, person_b, goonghap_score, target_year)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 2500,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30.0
        )
        result = response.json()
        if response.status_code != 200:
            raise Exception(f"Claude API 오류: {result.get('error', {}).get('message', '')}")
        return result["content"][0]["text"]


def _build_goonghap_prompt(person_a, person_b, goonghap_score, target_year):
    a_mbti = person_a["mbti"]
    b_mbti = person_b["mbti"]

    a_type    = a_mbti.get("origin_type", "")
    b_type    = b_mbti.get("origin_type", "")
    a_current = a_mbti.get("current_period_type", a_type)
    b_current = b_mbti.get("current_period_type", b_type)

    a_pillars = person_a["saju"].get("pillars", [])
    b_pillars = person_b["saju"].get("pillars", [])
    a_pillar_str = " / ".join([p["pillar"]["ganzi"] for p in a_pillars]) if a_pillars else "정보 없음"
    b_pillar_str = " / ".join([p["pillar"]["ganzi"] for p in b_pillars]) if b_pillars else "정보 없음"

    tension      = goonghap_score.get("tension", 0)
    status       = goonghap_score.get("status", "")
    diff_detail  = goonghap_score.get("diff_detail", {})

    diff_str = ""
    for axis, diff in diff_detail.items():
        diff_str += f"  {axis}축: {diff}점 차이\n"

    # 올해 좋은 달 비교
    a_chart = person_a.get("monthly_chart", [])
    b_chart = person_b.get("monthly_chart", [])

    same_good = []
    both_bad  = []
    opposite  = []

    for i, (a, b) in enumerate(zip(a_chart, b_chart)):
        a_good = a.get("quality_score", 0) >= 0.5
        b_good = b.get("quality_score", 0) >= 0.5
        if a_good and b_good:
            same_good.append(a["month"])
        elif not a_good and not b_good:
            both_bad.append(a["month"])
        elif a_good != b_good:
            opposite.append(a["month"])

    same_good_str = ", ".join(same_good) if same_good else "없음"
    both_bad_str  = ", ".join(both_bad)  if both_bad  else "없음"
    opposite_str  = ", ".join(opposite)  if opposite  else "없음"

    return f"""{COMMON_PRINCIPLES}

[두 사람 기본 정보]

나 (A):
  사주 원국: {a_pillar_str}
  타고난 기질: {a_type}
  지금 이 시기 성향: {a_current}

상대방 (B):
  사주 원국: {b_pillar_str}
  타고난 기질: {b_type}
  지금 이 시기 성향: {b_current}

[궁합 긴장도 분석]
전체 긴장도: {tension}점 ({status})
축별 차이:
{diff_str}

[{target_year}년 월별 에너지 비교]
두 사람 모두 좋은 달: {same_good_str}
두 사람 모두 주의할 달: {both_bad_str}
에너지가 엇갈리는 달: {opposite_str}

[서비스 유형] 궁합 풀이 (유료, Sonnet)

[작성 지침]
- 2,000자 이상
- A의 타고난 기질({a_type}) 설명 — 이 사람이 관계에서 어떤 사람인지
- B의 타고난 기질({b_type}) 설명 — 이 사람이 관계에서 어떤 사람인지
- 두 사람의 성향 차이가 만드는 긴장과 시너지를 구체적으로
- {target_year}년 두 사람의 에너지 흐름 비교 — 같이 좋은 달, 엇갈리는 달 언급
- 갈등 상황에서 구체적 대처법
- 관계를 더 좋게 만드는 실천 방법 3가지
- 사주·오행·천간·지지 등 전통 용어 절대 금지
- 볼드(**) 사용 금지

[출력 형식]
후아모가 이렇게 생각해 🤍

🙋 너는 이런 사람이야
({a_type} 기질 — 관계에서의 특징 최소 200자)

🧑 상대방은 이런 사람이야
({b_type} 기질 — 관계에서의 특징 최소 200자)

💫 두 사람이 만났을 때
(긴장도 {tension}점 — {status} 상태를 현대어로 최소 200자)

✨ 시너지가 나는 부분
(보완 관계 설명 최소 150자)

⚡ 주의해야 할 부분
(갈등 포인트와 구체적 대처법 최소 200자)

📅 {target_year}년 두 사람의 흐름
(같이 좋은 달과 엇갈리는 달 언급 — 최소 150자)

💬 관계를 더 좋게 만드는 방법
(3가지, 각 항목 구체적으로)

🌟 마무리
(희망적이고 따뜻한 마무리 — 2~3줄)
"""


def _dummy_goonghap(person_a, person_b, goonghap_score):
    a_type   = person_a["mbti"].get("origin_type", "")
    b_type   = person_b["mbti"].get("origin_type", "")
    tension  = goonghap_score.get("tension", 0)
    status   = goonghap_score.get("status", "")

    a_chart   = person_a.get("monthly_chart", [])
    b_chart   = person_b.get("monthly_chart", [])
    same_good = []
    for a, b in zip(a_chart, b_chart):
        if a.get("quality_score", 0) >= 0.5 and b.get("quality_score", 0) >= 0.5:
            same_good.append(a["month"])
    same_str = ", ".join(same_good[:3]) if same_good else "확인 중"

    return f"""후아모가 이렇게 생각해 🤍

🙋 너는 이런 사람이야
{a_type} 기질을 가진 너는 관계에서 독특한 매력을 가지고 있어.
타고난 에너지가 상대방과 만났을 때 흥미로운 화학반응이 일어나.

🧑 상대방은 이런 사람이야
{b_type} 기질의 상대방은 너와는 다른 방식으로 세상을 바라봐.
그 차이가 때로는 긴장이 되지만, 때로는 가장 큰 매력이 되기도 해.

💫 두 사람이 만났을 때
긴장도 {tension}점 — {status} 상태야.
두 사람의 에너지가 만나는 방식이 특별해. 차이를 이해하면 더 깊어질 수 있어.

✨ 시너지가 나는 부분
서로 다른 강점이 보완되는 조합이야. 한 사람이 약한 부분을 상대방이 채워줄 수 있어.

⚡ 주의해야 할 부분
성향 차이로 인한 오해가 생길 수 있어. 서로의 방식이 다를 뿐이라는 걸 기억해.

📅 올해 두 사람의 흐름
같이 에너지가 좋은 달은 {same_str}이야. 이 시기에 중요한 대화를 나눠봐.

💬 관계를 더 좋게 만드는 방법
오늘 상대방에게 "오늘 어땠어?" 한 마디 먼저 물어봐.
서로의 다름을 틀림이 아닌 다름으로 받아들여봐.
같이 좋은 달에 특별한 시간을 계획해봐.

🌟 마무리
두 사람의 기운은 서로를 더 풍요롭게 만들어줘. 흐름은 너희 편이야 🤍

*개발 테스트용 더미 응답*"""
