import os
import httpx
from typing import Optional
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
from app.services.prompt_principles import (
    COMMON_PRINCIPLES,
    analyze_daewoon_quality,
    build_relation_context,
)
from app.engines.monthly_engine import get_best_worst_months

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

async def _call_openai(prompt: str, model: str, max_tokens: int) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.9,
            },
            timeout=120.0
        )
        result = response.json()
        if response.status_code != 200:
            raise Exception(f"OpenAI API 오류: {result.get('error', {}).get('message', '')}")
        return result["choices"][0]["message"]["content"]

async def generate_reading(
    service_type: str,
    saju_data: dict,
    mbti_data: dict,
    gender: str,
    target_year: Optional[int] = None,
    monthly_chart: list = None,
    mbti_data_2: dict = None,
    gender_2: str = None,
) -> str:
    if not OPENAI_API_KEY:
        return _dummy_response(service_type, mbti_data, monthly_chart or [])
    # 궁합은 두 사람 프롬프트 사용
    if service_type == "goonghap" and mbti_data_2:
        import asyncio
        origin_type = mbti_data.get("origin_type", "")
        origin_type_2 = mbti_data_2.get("origin_type", "")
        daewoon_a = mbti_data.get("daewoon_chart", [])
        daewoon_b = mbti_data_2.get("daewoon_chart", [])
        p1 = _prompt_goonghap(
            origin_type, origin_type_2,
            daewoon_a=daewoon_a, daewoon_b=daewoon_b,
            gender_a=gender, gender_b=gender_2 or "M",
            part=1
        )
        p2 = _prompt_goonghap(
            origin_type, origin_type_2,
            daewoon_a=daewoon_a, daewoon_b=daewoon_b,
            gender_a=gender, gender_b=gender_2 or "M",
            part=2
        )
        part1, part2 = await asyncio.gather(
            _call_openai(p1, "gpt-4o", 4000),
            _call_openai(p2, "gpt-4o", 4000),
        )
        import re
        text = part1 + "\n\n" + part2
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^[-—]{2,}\s*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        print(f"[OpenAI] model=gpt-4o, service=goonghap, 길이={len(text)}자")
        return text
    elif service_type == "life":
        # 평생운세는 4파트 병렬 호출
        import asyncio
        p1 = _build_prompt("life_part1", saju_data, mbti_data, gender, target_year, monthly_chart or [])
        p2 = _build_prompt("life_part2", saju_data, mbti_data, gender, target_year, monthly_chart or [])
        p3 = _build_prompt("life_part3", saju_data, mbti_data, gender, target_year, monthly_chart or [])
        p4 = _build_prompt("life_part4", saju_data, mbti_data, gender, target_year, monthly_chart or [])
        part1, part2, part3, part4 = await asyncio.gather(
            _call_openai(p1, "gpt-4o", 3000),
            _call_openai(p2, "gpt-4o", 3000),
            _call_openai(p3, "gpt-4o", 3000),
            _call_openai(p4, "gpt-4o", 3000),
        )
        text = part1 + "\n\n" + part2 + "\n\n" + part3 + "\n\n" + part4
        import re
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^[-—]{2,}\s*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        print(f"[OpenAI] model=gpt-4o, service=life, 길이={len(text)}자")
        return text
    else:
        prompt = _build_prompt(
            service_type, saju_data, mbti_data, gender,
            target_year, monthly_chart or []
        )
    model = "gpt-4o-mini" if service_type == "year" else "gpt-4o"
    if service_type == "year":
        max_tokens = 1500
    elif service_type == "year_full":
        max_tokens = 6000
    elif service_type == "life":
        max_tokens = 16000
    elif service_type == "goonghap":
        max_tokens = 8000
    else:
        max_tokens = 4000
    last_error = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens,
                        "temperature": 0.9,
                    },
                    timeout=120.0
                )
                result = response.json()
                if response.status_code != 200:
                    raise Exception(f"OpenAI API 오류: {result.get('error', {}).get('message', '알 수 없는 오류')}")
                text = result["choices"][0]["message"]["content"]
                # 후처리: ** 제거, -- 제거
                import re
                text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
                text = re.sub(r'^[-—]{2,}\s*$', '', text, flags=re.MULTILINE)
                text = re.sub(r"\n{3,}", "\n\n", text)

                print(f"[OpenAI] model={model}, service={service_type}, 길이={len(text)}자")
                return text
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            last_error = e
            if attempt < 2:
                import asyncio
                await asyncio.sleep(2 ** attempt)
        except Exception as e:
            last_error = e
            if attempt < 2:
                import asyncio
                await asyncio.sleep(2 ** attempt)
            else:
                raise
    raise Exception(f"OpenAI API 3회 시도 실패: {last_error}")


async def generate_goonghap_reading(
    person_a=None, person_b=None, goonghap_score=None, target_year=None,
    saju_data_1=None, mbti_data_1=None, gender_1=None,
    saju_data_2=None, mbti_data_2=None, gender_2=None,
):
    # person_a/person_b 방식 지원
    if person_a and mbti_data_1 is None:
        mbti_data_1 = person_a.get("mbti_data", {})
        gender_1 = person_a.get("gender", "F")
        mbti_data_2 = person_b.get("mbti_data", {}) if person_b else {}
        gender_2 = person_b.get("gender", "M") if person_b else "M"

    origin_type = mbti_data_1.get("origin_type", "") if mbti_data_1 else ""
    current_type = mbti_data_1.get("current_type", "") if mbti_data_1 else ""
    origin_type_2 = mbti_data_2.get("origin_type", "") if mbti_data_2 else ""
    current_type_2 = mbti_data_2.get("current_type", "") if mbti_data_2 else ""
    prompt = _prompt_goonghap(
        f"{origin_type}({gender_1})",
        f"{current_type} ↔ {origin_type_2}({gender_2}) {current_type_2}"
    )
    _api_key = os.getenv("OPENAI_API_KEY", "") or OPENAI_API_KEY
    print(f"[GOONGHAP] OPENAI_API_KEY 길이: {len(_api_key)}, 값: {_api_key[:10] if _api_key else 'EMPTY'}")
    if not _api_key:
        return "API 키가 설정되지 않았습니다."
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 8000,
                "temperature": 0.9,
            },
            timeout=120.0
        )
        result = response.json()
        if response.status_code != 200:
            raise Exception(f"OpenAI API 오류: {result.get('error', {}).get('message', '')}")
        text = result["choices"][0]["message"]["content"]
        print(f"[OpenAI] model=gpt-4o, service=goonghap, 길이={len(text)}자")
        return text
    return "궁합 풀이 생성에 실패했습니다."

async def generate_goonghap_reading(
    saju_data_1, mbti_data_1, gender_1,
    saju_data_2, mbti_data_2, gender_2,
):
    origin_type = mbti_data_1.get("origin_type", "")
    current_type = mbti_data_1.get("current_type", "")
    origin_type_2 = mbti_data_2.get("origin_type", "")
    current_type_2 = mbti_data_2.get("current_type", "")

    prompt = _prompt_goonghap(
        f"{origin_type}({gender_1})",
        f"{current_type} ↔ {origin_type_2}({gender_2}) {current_type_2}"
    )

    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return "API 키가 설정되지 않았습니다."

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 8000,
                    "temperature": 0.9,
                }
            },
            timeout=120.0
        )
        result = response.json()
        if response.status_code != 200:
            raise Exception(f"Gemini API 오류: {result.get('error', {}).get('message', '')}")
        candidates = result.get("candidates", [])
        if not candidates:
            raise Exception("Gemini 응답 없음")
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason", "")
        content_parts = candidate.get("content", {}).get("parts", [])
        if not content_parts:
            if finish_reason == "MAX_TOKENS":
                return "응답이 너무 길어 잘렸습니다. 다시 시도해주세요."
            raise Exception(f"Gemini 응답 파싱 실패: {candidate}")
        return content_parts[0]["text"]

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
당신은 한국의 MZ세대가 열광하는 사주 운세 전문가 후아모입니다.
따뜻하고 솔직하게, 마치 친한 친구가 털어놓듯 써주세요.
전문 용어 없이, 읽자마자 "이거 완전 나 얘기다!" 싶은 느낌으로.

[타고난 기질] {origin_type}
[현재 모드] {current_type}  
[올해 전체 흐름] {overall_flow}
[대상 연도] {target_year}년

아래 형식으로 정확히 1,000자 이상 작성하세요.
사주·오행·천간·지지 등 전문용어 절대 금지.
볼드(**) 금지. 이모지로만 구분.

후아모가 이렇게 생각해 🤍

(타고난 기질과 올해 에너지를 친근하게 2~3줄 소개)

✨ {target_year}년 한 줄 요약
(올해를 한 문장으로 — 임팩트 있게)

📅 좋은 달 & 조심할 달
(좋은 달 2~3개, 조심할 달 1~2개 — 구체적 이유와 함께)

🔑 올해 핵심 키워드
(올해를 관통하는 키워드 3개 — 각각 한 줄 설명)

🎯 올해 가장 중요한 것
(지금 당장 집중해야 할 것 — 구체적으로)

💫 풀버전 미리보기
(돈의 흐름, 사랑, 인간관계 변화에 대해 살짝 언급하며 궁금증 유발)
"더 자세히 알고 싶다면 올해 운세 FULL에서 확인해봐 🔮"
"""

def _prompt_year_full(
    target_year, origin_type, current_type,
    overall_flow, best_months, worst_months, monthly_chart
):
    month_summary = ""
    if monthly_chart:
        for m in monthly_chart:
            month_summary += f"  {m['month']}월: {m['quality_label']}\n"

    return f"""
당신은 한국 최고의 사주 운세 전문가 후아모입니다.
이것은 고객이 직접 돈을 내고 구매한 프리미엄 유료 서비스입니다.
최고의 품질과 정성을 다해 작성해야 합니다.
넷플릭스 드라마처럼 챕터별로 흥미롭게, 마치 친한 언니/오빠가
인생 상담해주듯 따뜻하고 솔직하게 써주세요.
읽다 보면 "이거 완전 나 얘기다!", "다음 챕터 빨리 보고 싶다!" 싶은 느낌으로.
절대 대충 쓰지 마세요. 각 챕터를 충분히 길고 깊이 있게 작성하세요.

[타고난 기질] {origin_type}
[현재 모드] {current_type}
[올해 전체 흐름] {overall_flow}
[대상 연도] {target_year}년
[월별 에너지]
{month_summary}
[가장 좋은 달] {best_months}
[주의할 달] {worst_months}

아래 형식으로 정확히 5,000자 이상 작성하세요.
각 챕터는 최소 300자 이상.
사주·오행·천간·지지 등 전문용어 절대 금지.
볼드(**) 금지. 이모지로만 구분.
MZ세대 언어로 공감되게, 하지만 깊이 있게.

후아모가 이렇게 생각해 🤍

(타고난 기질과 올해 에너지 전체 조망 — 200자 이상, 따뜻하게)

📊 {target_year}년 올해 한 줄 요약
(올해를 한 문장으로 임팩트 있게 — 그 아래 전체 흐름 300자 이상 설명)

✨ 기회의 달 TOP3
(가장 좋은 달 3개 — 각각 왜 좋은지, 뭘 하면 좋은지 구체적으로. 300자 이상)

⚠️ 위기의 달 TOP3
(가장 조심할 달 3개 — 각각 왜 조심해야 하는지, 어떻게 대응할지. 300자 이상)

💰 돈의 흐름
(수입, 지출, 투자, 저축 타이밍 — 구체적 조언 포함. 300자 이상)

❤️ 사랑의 흐름
(솔로라면 만남의 가능성, 커플이라면 관계 변화 — 현실적으로. 300자 이상)

👥 인간관계 변화
(누가 떠나고 누가 오는가, 조심해야 할 사람의 특징. 300자 이상)

💼 커리어 & 직업
(취업/이직/승진/사업 흐름 — 구체적 타이밍과 조언. 300자 이상)

📚 자기계발 & 성장
(배움, 자격증, 새로운 도전에 대한 조언. 200자 이상)

🌿 건강 & 에너지
(몸과 마음 관리법 — 구체적으로. 200자 이상)
이 풀이는 참고용이며 건강 문제는 반드시 전문의와 상담하세요.

🎯 올해를 100점 만점으로 평가하면
(점수와 이유 — 솔직하게. 200자 이상)

💑 올해 당신에게 들어오는 사람의 특징
(어떤 사람이 인연이 될지 — 궁합 구매 유도. 200자 이상)
"이 사람과의 궁합이 궁금하다면? 우리 궁합에서 확인해봐 💑"

⚡ 지금 당장 해야 할 것 5가지
(오늘 바로 실천할 수 있는 것들 — 각각 구체적으로)

🌟 후아모의 마지막 한마디
(따뜻하고 희망적인 마무리 — 150자 이상)
"""

def _prompt_life(origin_type, current_type, overall_flow, daewoon_quality):
    return f"""
당신은 한국 최고의 사주 운세 전문가 후아모입니다.
평생운세는 고객이 가장 많은 돈을 내고 구매한 최고 프리미엄 서비스입니다.
이 풀이 하나로 고객의 인생 방향이 바뀔 수 있습니다. 최고의 정성을 다하세요.
읽고 나서 눈물이 날 만큼 공감되고, "드디어 나를 이해해주는 사람을 만났다"는
느낌이 들도록 써주세요.

[타고난 기질] {origin_type}
[현재 모드] {current_type}
[전체 흐름] {overall_flow}
[대운 흐름] {daewoon_quality}

아래 형식으로 정확히 12,000자 이상 작성하세요.
각 챕터는 최소 500자 이상.
사주·오행·천간·지지 등 전문용어 절대 금지.
볼드(**) 금지. 이모지로만 구분.
읽다 보면 "이거 완전 나 얘기다!" 싶은 느낌으로.

후아모가 이렇게 생각해 🤍

(첫 인사 — 당신을 깊이 이해한다는 느낌으로. 300자 이상)

🔍 당신은 왜 이런 사람인가
(타고난 본성과 현재 모습의 차이 — 깊이 공감되게. 500자 이상)

💪 당신의 숨겨진 강점
(스스로도 잘 모르는 강점들 — 구체적으로. 400자 이상)

😔 당신의 약점 (솔직하게)
(약점이지만 따뜻하게 — 공감과 위로 포함. 400자 이상)

👥 인간관계 패턴
(왜 이런 사람들과 어울리는지, 어떤 사람과 맞는지. 500자 이상)

❤️ 연애 패턴
(연애할 때 어떤 모습인지, 왜 그런지, 어떤 사람과 잘 맞는지. 500자 이상)

💰 돈 버는 방식
(어떻게 돈을 버는 게 맞는지, 어떤 분야에서 돈이 되는지. 500자 이상)

💼 직업 적성
(어떤 일이 맞는지, 어떤 환경에서 빛나는지. 500자 이상)

🌱 20대
(20대에 어떤 흐름이 오는지, 무엇을 해야 하는지. 400자 이상)

🌊 30대
(30대의 핵심 과제와 흐름. 400자 이상)

🗺️ 40대
(40대의 변화와 기회. 400자 이상)

💡 50대
(50대의 흐름과 준비할 것. 400자 이상)

🛡️ 60대 이후
(인생 후반기의 흐름과 행복. 300자 이상)

⚡ 인생 전환점
(언제 큰 변화가 오는지 — 구체적으로. 400자 이상)

🌟 인생 총평
(당신의 인생을 한 편의 드라마로 요약 — 감동적으로. 500자 이상)
"당신의 올해 운세가 궁금하다면? 올해 운세 FULL에서 확인해봐 🔮"
"""

def _prompt_goonghap(origin_type, current_type):
    return f"""
당신은 한국 최고의 사주 운세 전문가 후아모입니다.
궁합은 고객이 돈을 내고 구매한 프리미엄 유료 서비스입니다.
두 사람의 관계를 깊이 분석하여 최고의 품질로 작성하세요.
"어떻게 이렇게 정확해?" 싶을 만큼 현실적이고 공감되게 써주세요.
두 사람 모두 읽고 싶어하는 내용으로.

[나의 기질] {origin_type}
[나의 현재 모드] {current_type}

아래 형식으로 정확히 7,000자 이상 작성하세요.
각 챕터는 최소 400자 이상.
사주·오행·천간·지지 등 전문용어 절대 금지.
볼드(**) 금지. 이모지로만 구분.

후아모가 이렇게 생각해 🤍

(두 사람의 만남에 대한 따뜻한 서두. 200자 이상)

💫 첫인상이 끌린 이유
(왜 서로에게 끌렸는지 — 심리적으로 정확하게. 400자 이상)

🧬 성격 궁합 (MBTI 포함)
(두 사람의 성격이 어떻게 맞고 안 맞는지. 500자 이상)

❤️ 연애 스타일 비교
(각자 연애할 때 어떤 모습인지, 어떻게 다른지. 500자 이상)

💥 싸우는 이유
(왜 충돌하는지 — 핵심 원인을 솔직하게. 400자 이상)

🤫 상대가 절대 말하지 않는 속마음
(상대방이 말은 못하지만 원하는 것 — 매우 구체적으로. 500자 이상)

💍 결혼하면 어떨까
(결혼했을 때의 현실적인 모습 — 좋은 점과 어려운 점 모두. 500자 이상)

💰 돈 문제 궁합
(돈 쓰는 방식, 재정 관리 궁합 — 현실적으로. 400자 이상)

⚠️ 헤어질 위험 시기
(언제 가장 위험한지, 어떻게 넘어야 하는지. 400자 이상)

🌱 관계를 오래 유지하는 방법
(구체적인 실천 방법 — 두 사람 모두를 위한 조언. 400자 이상)

🎯 두 사람의 미래 점수
(100점 만점 점수와 이유 — 솔직하게. 300자 이상)

🌟 후아모의 마지막 한마디
(두 사람에게 따뜻한 응원. 200자 이상)
"이 사람과 함께하는 올해가 궁금하다면? 올해 운세 FULL에서 확인해봐 🔮"
"""


def _prompt_goonghap(origin_type_a, origin_type_b, daewoon_a=None, daewoon_b=None, gender_a="F", gender_b="M", part=1):
    daewoon_str = ""
    if daewoon_a and daewoon_b:
        for dw_a in daewoon_a:
            age_start = dw_a.get("age_start", 0)
            age_label = dw_a.get("age_label", "")
            type_a = dw_a.get("type", "")
            quality_a = dw_a.get("quality_label", "")
            type_b, quality_b = "", ""
            for dw_b in daewoon_b:
                if abs(dw_b.get("age_start", 0) - age_start) <= 10:
                    type_b = dw_b.get("type", "")
                    quality_b = dw_b.get("quality_label", "")
                    break
            if type_a and type_b:
                daewoon_str += f"  {age_label}: 나={type_a}({quality_a}) ↔ 상대={type_b}({quality_b})\n"

    base = f"""
당신은 MBTI와 동양 철학을 결합한 관계 분석 코치 후아모입니다.
두 사람의 평생 궁합을 MZ식으로 따뜻하고 솔직하게 분석해주세요.
반드시 4,000자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 헤더(###) 절대 금지. 이모지로만 구분.

[나] 타고난 기질: {origin_type_a} ({gender_a})
[상대] 타고난 기질: {origin_type_b} ({gender_b})
[시기별 MBTI 에너지]
{daewoon_str if daewoon_str else "데이터 없음"}
"""

    if part == 1:
        return base + """
후아모가 이렇게 생각해 🤍
(두 사람의 만남을 따뜻하게 소개 — 300자 이상)

💫 첫인상이 끌린 이유
(왜 서로에게 끌렸는지 MBTI 기반으로 — 300자 이상)

💑 두 사람의 연애 스타일
나는 연애할 때 어떤 모습이고 상대는 어떤 모습인지, 둘이 만나면 어떤 케미인지 (500자 이상)

🔥 속궁합
두 사람의 내면 에너지가 어떻게 맞닿는지, 감정적 교감과 신체적 궁합 (400자 이상)

💰 재물 궁합
나의 돈 쓰는 방식과 상대의 돈 쓰는 방식, 함께할 때 재물운, 돈 갈등 포인트 (400자 이상)

💪 건강 궁합
두 사람의 건강 패턴, 서로의 건강에 미치는 영향 (300자 이상)

👨‍👩‍👧 자녀 & 가정 궁합
두 사람이 부모가 되면 어떤 스타일인지, 자녀와의 관계, 가정 분위기 (400자 이상)
"""
    else:
        return base + """
🌱 20~30대의 궁합
이 시기 두 사람의 MBTI 변화를 활용해서 잘 맞는 점, 충돌하는 점, 주의할 것 (500자 이상)

🌊 40~50대의 궁합
중년의 변화 속에서 두 사람의 관계, 이 시기 위기와 극복 방법 (500자 이상)

🗺️ 60~80대의 궁합
노년의 두 사람 모습, 함께 늙어가는 방식 (400자 이상)

⭐ 두 사람이 가장 잘 맞는 시기
(구체적으로 언제, 왜 — 300자 이상)

⚠️ 두 사람이 가장 조심해야 할 시기
(구체적으로 언제, 어떤 갈등, 어떻게 극복 — 300자 이상)

🔑 이 관계를 잘 유지하는 핵심 비결
(두 사람이 오래 행복하게 사는 법 — 400자 이상)

💑 종합 궁합 분석
(두 사람의 관계를 한 편의 드라마로 — 500자 이상)

💌 후아모의 한마디
(따뜻한 마무리 — 200자 이상)
"더 자세한 개인 운세가 궁금하다면? 평생 운세에서 확인해봐 🔮"
"""


def _prompt_life_part1(origin_type, current_type, overall_flow, daewoon_quality, daewoon_chart=None):
    daewoon_str = ""
    if daewoon_chart:
        for dw in daewoon_chart[:5]:
            daewoon_str += f"  {dw.get('age_label','')}: {dw.get('type','')} — {dw.get('quality_label','')}\n"
    return f"""
당신은 MBTI와 동양 철학을 결합한 인생 코치 후아모입니다.
MZ세대 언어로 따뜻하고 솔직하게, 마치 친한 언니/오빠가 말해주듯 써주세요.
반드시 3,000자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 이모지로만 구분.

[타고난 기질] {origin_type}
[현재 모드] {current_type}
[전체 흐름] {overall_flow}
[대운 흐름] {daewoon_quality}
[시기별 에너지]
{daewoon_str}

후아모가 이렇게 생각해 🤍
(당신을 깊이 이해한다는 느낌의 첫 인사 — 300자 이상, MZ식으로 따뜻하게)

🔍 당신은 왜 이런 사람인가
(타고난 기질과 현재 모습의 차이를 MZ식으로 깊이 분석 — 500자 이상)

💪 당신의 숨겨진 강점
(스스로도 잘 모르는 강점들 — 구체적이고 공감되게 — 400자 이상)

😔 당신의 약점 (솔직하게)
(약점을 따뜻하게, "이래서 힘들었구나" 싶은 공감 — 400자 이상)

👥 인간관계 패턴
(어떤 사람과 맞고 왜 충돌하는지 — MZ식으로 현실감 있게 — 500자 이상)

❤️ 연애 패턴
(연애할 때 어떤 모습인지, 왜 그런지 — 솔직하고 재미있게 — 500자 이상)
"""

def _prompt_life_part2(origin_type, current_type, overall_flow, daewoon_quality, daewoon_chart=None):
    daewoon_str = ""
    if daewoon_chart:
        for dw in daewoon_chart:
            daewoon_str += f"  {dw.get('age_label','')}: {dw.get('type','')} — {dw.get('quality_label','')}\n"
    return f"""
당신은 MBTI와 동양 철학을 결합한 인생 코치 후아모입니다.
반드시 3,500자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 이모지로만 구분.
각 연령대별 주요 관심사를 반드시 다루세요.

[타고난 기질] {origin_type} / [현재 모드] {current_type}
[전체 흐름] {overall_flow}
[시기별 에너지 변화 — 이 데이터를 반드시 활용하세요]
{daewoon_str}

💰 돈 버는 방식
(어떻게 돈을 버는 게 맞는지, 어떤 분야에서 재능이 빛나는지 — 500자 이상)

💼 직업 적성
(어떤 일이 맞는지, 어떤 환경에서 빛나는지 — 500자 이상)

📚 10대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 학업/진학: 어떤 공부가 맞는지, 진학 방향
- 교우관계: 친구 관계 패턴
- 첫사랑/연애: 10대 감정 흐름
- 부모와의 관계: 가족 역학
- 이 시기 조언: 지금 해야 할 것
(전체 700자 이상, MZ식으로 공감되게)

🌱 20대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 연애/결혼준비: 20대 연애 패턴과 이상형
- 취업/직장: 첫 직장과 커리어 방향
- 재물: 20대 돈 관리와 첫 목돈
- 인간관계: 진짜 친구 vs 스쳐가는 인연
- 이 시기 조언: 20대에 반드시 해야 할 것
(전체 700자 이상, MZ식으로 공감되게)

🌊 30대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 결혼/자녀: 결혼 타이밍과 부모 역할
- 재물/내집마련: 30대 재테크와 부동산
- 커리어/이직: 30대 직장 변화
- 부부관계: 파트너와의 갈등과 조화
- 이 시기 조언: 30대에 반드시 해야 할 것
(전체 700자 이상, MZ식으로 공감되게)
"""

def _prompt_life_part3(origin_type, current_type, overall_flow, daewoon_quality, daewoon_chart=None):
    daewoon_str = ""
    if daewoon_chart:
        for dw in daewoon_chart:
            daewoon_str += f"  {dw.get('age_label','')}: {dw.get('type','')} — {dw.get('quality_label','')}\n"
    return f"""
당신은 MBTI와 동양 철학을 결합한 인생 코치 후아모입니다.
반드시 3,500자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 이모지로만 구분.
각 연령대별 주요 관심사를 반드시 다루세요.

[타고난 기질] {origin_type} / [현재 모드] {current_type}
[시기별 에너지 변화 — 이 데이터를 반드시 활용하세요]
{daewoon_str}

🗺️ 40대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 직장/사업: 40대 커리어 정점과 변화
- 자녀: 자녀 교육과 관계
- 배우자: 40대 부부 관계 변화
- 재물: 40대 자산 증식과 관리
- 건강: 40대 건강 적신호와 관리법
- 이 시기 조언
(전체 700자 이상, MZ식으로 공감되게)

💡 50대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 직장/은퇴준비: 50대 커리어 마무리
- 재물: 노후 자금과 재테크
- 건강: 50대 건강 관리 필수사항
- 가족: 자녀 독립과 빈 둥지 증후군
- 부부: 50대 부부 관계 재정립
- 이 시기 조언
(전체 700자 이상, MZ식으로 공감되게)

🛡️ 60대의 흐름
이 시기 MBTI 에너지와 함께 아래를 구체적으로:
- 은퇴 후 생활: 새로운 삶의 시작
- 재물: 연금과 노후 생활비
- 건강: 60대 건강 관리
- 관계: 손자/손녀, 친구, 사회 활동
- 이 시기 조언
(전체 600자 이상)

🌅 70대 이후
이 시기 MBTI 에너지와 함께:
- 건강과 마음의 평화
- 가족과의 관계
- 인생의 의미와 행복
(전체 500자 이상)

⭐ 인생에서 운이 가장 좋은 시기
(구체적으로 몇 살 때, 왜 좋은지, 무엇을 해야 하는지 — 400자 이상)

⚠️ 인생에서 가장 조심해야 할 시기
(구체적으로 몇 살 때, 어떤 위험, 어떻게 대비 — 400자 이상)
"""

def _prompt_life_part4(origin_type, current_type, overall_flow, daewoon_quality, daewoon_chart=None):
    return f"""
당신은 MBTI와 동양 철학을 결합한 인생 코치 후아모입니다.
반드시 2,500자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 이모지로만 구분.

[타고난 기질] {origin_type} / [현재 모드] {current_type}
[전체 흐름] {overall_flow}

🎯 인생 주요 전환점
(몇 살에 큰 변화가 오는지, 어떤 사건들이 있는지 구체적으로 — 600자 이상)

📅 앞으로 10년 연도별 흐름
(매년 핵심 키워드와 조언 한 줄씩 — 10줄 이상)

🌈 후아모가 전하는 인생 조언
(지금 당신에게 꼭 필요한 말 — MZ식으로 따뜻하게 — 500자 이상)

🌟 인생 총평
(당신의 인생을 한 편의 드라마로 감동적으로 — 600자 이상)

💌 후아모의 마지막 한마디
(따뜻하고 희망적인 마무리 — 300자 이상)
"당신의 올해 운세가 궁금하다면? 올해 운세 FULL에서 확인해봐 🔮"
"""


def _prompt_life(origin_type, current_type, overall_flow, daewoon_quality):
    return f"""
당신은 한국 최고의 사주 운세 전문가 후아모입니다.
평생운세는 고객이 가장 많은 돈을 내고 구매한 최고 프리미엄 서비스입니다.
이 풀이 하나로 고객의 인생 방향이 바뀔 수 있습니다. 최고의 정성을 다하세요.
읽고 나서 눈물이 날 만큼 공감되고, "드디어 나를 이해해주는 사람을 만났다"는
느낌이 들도록 써주세요.

[타고난 기질] {origin_type}
[현재 모드] {current_type}
[전체 흐름] {overall_flow}
[대운 흐름] {daewoon_quality}

아래 형식으로 정확히 12,000자 이상 작성하세요.
각 챕터는 최소 500자 이상.
사주·오행·천간·지지 등 전문용어 절대 금지.
볼드(**) 금지. 이모지로만 구분.
읽다 보면 "이거 완전 나 얘기다!" 싶은 느낌으로.

후아모가 이렇게 생각해 🤍

(첫 인사 — 당신을 깊이 이해한다는 느낌으로. 300자 이상)

🔍 당신은 왜 이런 사람인가
(타고난 본성과 현재 모습의 차이 — 깊이 공감되게. 500자 이상)

💪 당신의 숨겨진 강점
(스스로도 잘 모르는 강점들 — 구체적으로. 400자 이상)

😔 당신의 약점 (솔직하게)
(약점이지만 따뜻하게 — 공감과 위로 포함. 400자 이상)

👥 인간관계 패턴
(왜 이런 사람들과 어울리는지, 어떤 사람과 맞는지. 500자 이상)

❤️ 연애 패턴
(연애할 때 어떤 모습인지, 왜 그런지, 어떤 사람과 잘 맞는지. 500자 이상)

💰 돈 버는 방식
(어떻게 돈을 버는 게 맞는지, 어떤 분야에서 돈이 되는지. 500자 이상)

💼 직업 적성
(어떤 일이 맞는지, 어떤 환경에서 빛나는지. 500자 이상)

🌱 20대
(20대에 어떤 흐름이 오는지, 무엇을 해야 하는지. 400자 이상)

🌊 30대
(30대의 핵심 과제와 흐름. 400자 이상)

🗺️ 40대
(40대의 변화와 기회. 400자 이상)

💡 50대
(50대의 흐름과 준비할 것. 400자 이상)

🛡️ 60대 이후
(인생 후반기의 흐름과 행복. 300자 이상)

⚡ 인생 전환점
(언제 큰 변화가 오는지 — 구체적으로. 400자 이상)

🌟 인생 총평
(당신의 인생을 한 편의 드라마로 요약 — 감동적으로. 500자 이상)
"당신의 올해 운세가 궁금하다면? 올해 운세 FULL에서 확인해봐 🔮"
"""
