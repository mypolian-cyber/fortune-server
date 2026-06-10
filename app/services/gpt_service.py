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
        origin_type = mbti_data.get("origin_type", "")
        origin_type_2 = mbti_data_2.get("origin_type", "")
        daewoon_a = mbti_data.get("daewoon_chart", [])
        daewoon_b = mbti_data_2.get("daewoon_chart", [])
        prompt = _prompt_goonghap(
            origin_type, origin_type_2,
            daewoon_a=daewoon_a, daewoon_b=daewoon_b,
            gender_a=gender, gender_b=gender_2 or "M"
        )
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

def _prompt_goonghap(origin_type_a, origin_type_b, daewoon_a=None, daewoon_b=None, gender_a="F", gender_b="M"):
    # 시기별 궁합 데이터 구성
    daewoon_str = ""
    if daewoon_a and daewoon_b:
        # 두 사람의 대운을 나이대별로 매칭
        for dw_a in daewoon_a:
            age_start = dw_a.get("age_start", 0)
            age_end = dw_a.get("age_end", 0)
            age_label = dw_a.get("age_label", "")
            type_a = dw_a.get("type", "")
            quality_a = dw_a.get("quality_label", "")
            # 상대방의 같은 시기 찾기
            type_b = ""
            quality_b = ""
            for dw_b in daewoon_b:
                if abs(dw_b.get("age_start", 0) - age_start) <= 10:
                    type_b = dw_b.get("type", "")
                    quality_b = dw_b.get("quality_label", "")
                    break
            if type_a and type_b:
                daewoon_str += f"  {age_label}: 나={type_a}({quality_a}) ↔ 상대={type_b}({quality_b})\n"

    return f"""
당신은 MBTI와 동양 철학을 결합한 관계 분석 코치 후아모입니다.
두 사람의 평생 궁합을 MZ식으로 따뜻하고 솔직하게 분석해주세요.
반드시 3,500자 이상 작성하세요. 절대 요약하거나 줄이지 마세요.
전문용어 절대 금지. 볼드(**) 절대 금지. 헤더(###) 절대 금지. 이모지로만 구분.

[나] 타고난 기질: {origin_type_a} ({gender_a})
[상대] 타고난 기질: {origin_type_b} ({gender_b})

[시기별 두 사람 MBTI 에너지 — 반드시 활용하세요]
{daewoon_str if daewoon_str else "데이터 없음"}

후아모가 이렇게 생각해 🤍
(두 사람의 만남을 따뜻하게 소개 — 300자 이상)

💫 첫인상이 끌린 이유
(왜 서로에게 끌렸는지 MBTI 기반으로 — 300자 이상)

🌱 20~30대의 궁합
이 시기 두 사람의 MBTI 변화를 활용해서:
- 나는 어떤 모습이고 상대는 어떤 모습인지
- 잘 맞는 점과 충돌하는 점
- 이 시기 함께하면 좋은 것과 주의할 것
(500자 이상, "맞아 우리 이래!" 싶은 느낌으로)

🌊 40~50대의 궁합
이 시기 두 사람의 MBTI 변화를 활용해서:
- 나는 어떤 모습이고 상대는 어떤 모습인지
- 중년의 변화 속에서 두 사람의 관계
- 이 시기 위기와 극복 방법
(500자 이상)

🗺️ 60~80대의 궁합
이 시기 두 사람의 MBTI 변화를 활용해서:
- 노년의 두 사람 모습
- 함께 늙어가는 방식
- 이 시기 행복하게 사는 법
(400자 이상)

⭐ 두 사람이 가장 잘 맞는 시기
(구체적으로 언제, 왜 — 300자 이상)

⚠️ 두 사람이 가장 조심해야 할 시기
(구체적으로 언제, 어떤 갈등, 어떻게 극복 — 300자 이상)

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
