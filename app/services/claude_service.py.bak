import os
import httpx
from typing import Optional

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

async def generate_reading(
    service_type: str,
    saju_data: dict,
    mbti_data: dict,
    gender: str,
    target_year: Optional[int] = None
) -> str:
    """
    Claude API로 운세 풀이문 생성
    API 키 없으면 더미 응답 반환
    """

    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "your_api_key_here":
        return _dummy_response(service_type, mbti_data)

    # 실제 Claude API 연동 (나중에 구현)
    prompt = _build_prompt(service_type, saju_data, mbti_data, gender, target_year)

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
                "max_tokens": 1500,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30.0
        )
        result = response.json()
        return result["content"][0]["text"]


def _dummy_response(service_type: str, mbti_data: dict) -> str:
    """개발용 더미 응답"""
    mbti_type = mbti_data.get("origin_type", "ESTJ")
    current_type = mbti_data.get("current_period_type", mbti_type)

    if service_type == "year":
        return f"""올해 당신의 기운은 [{current_type}] 모드로 흐르고 있어요.

🔥 **이 시기의 핵심 에너지**
타고난 기질({mbti_type})에 대운의 흐름이 더해지면서 지금은 {current_type} 성향이 활성화된 시기예요.

💼 **커리어 & 돈**
지금 대운의 흐름이 실행력을 높여주는 시기. 계획했던 것들을 밀어붙이기 좋아요.

❤️ **관계 & 연애**
주변 사람들과의 에너지 교류가 활발해지는 시기. 새로운 인연도 기대해봐요.

⚡ **주의할 것**
에너지가 넘치는 만큼 무리하지 않는 것이 중요해요.

*이 풀이는 개발 테스트용 더미 응답입니다.*"""

    elif service_type == "life":
        return f"""당신의 평생 기운 지도를 펼쳐볼게요.

🌱 **타고난 기질 — {mbti_type}**
당신의 원국이 만드는 중력 중심이에요. 어떤 시기에도 결국 이 지점으로 돌아와요.

🌊 **인생의 흐름**
대운의 파도를 타며 시기마다 다른 성향이 활성화돼요.

*이 풀이는 개발 테스트용 더미 응답입니다.*"""

    elif service_type == "goonghap":
        return f"""두 사람의 기운이 만나는 방식을 읽어볼게요.

*이 풀이는 개발 테스트용 더미 응답입니다.*"""

    else:
        return "개발 테스트용 더미 응답입니다."


def _build_prompt(
    service_type: str,
    saju_data: dict,
    mbti_data: dict,
    gender: str,
    target_year: Optional[int]
) -> str:
    """Claude 프롬프트 생성 (나중에 정교하게 설계)"""

    pillars = saju_data.get("pillars", [])
    pillar_str = " / ".join([p["pillar"]["ganzi"] for p in pillars])
    mbti_type = mbti_data.get("origin_type", "")
    current_type = mbti_data.get("current_period_type", "")

    base = f"""당신은 사주명리와 MBTI를 통합한 현대적 운세 전문가입니다.
사주: {pillar_str}
기본 기질: {mbti_type}
현재 시기 성향: {current_type}
성별: {"남성" if gender == "M" else "여성"}
"""

    if service_type == "year":
        return base + f"\n{target_year}년 운세를 MZ세대 언어로 풀어주세요."
    elif service_type == "life":
        return base + "\n평생 운세를 MZ세대 언어로 풀어주세요."
    else:
        return base + "\n운세를 MZ세대 언어로 풀어주세요."

# year_full 더미 응답
def _dummy_year_full(mbti_data: dict, monthly_chart: list) -> str:
    mbti_type    = mbti_data.get("origin_type", "ESTJ")
    current_type = mbti_data.get("current_period_type", mbti_type)

    best_months  = [d for d in monthly_chart if d.get("color") == "purple"][:3]
    worst_months = [d for d in monthly_chart if d.get("color") in ["red","orange"]][:3]

    best_str  = ", ".join([m["month"] for m in best_months])  if best_months  else "없음"
    worst_str = ", ".join([m["month"] for m in worst_months]) if worst_months else "없음"

    return f"""후아모가 이렇게 생각해 🤍

너의 타고난 기질은 {mbti_type}이야.
지금 이 시기엔 {current_type} 모드로 움직이고 있어.

📊 2026년 기운 흐름은 위 차트를 봐줘.

✨ 올해 가장 좋은 달
{best_str} — 이 시기엔 적극적으로 움직여봐.
미뤄왔던 것들, 지금이 딱이야.

⚠️ 조심해야 할 달
{worst_str} — 이 시기엔 큰 결정보다
현상 유지가 더 현명해.

💼 커리어
지금 대운의 흐름이 실행력을 높여주는 시기야.
계획했던 것들 밀어붙이기 좋아.

❤️ 관계
주변 사람들과의 에너지 교류가 활발해지는 시기야.
오랫동안 연락 못 했던 친구에게
이모티콘 하나만 보내봐. 그걸로 충분해 🤍

💰 돈
지금은 벌기보다 쌓는 시기야.
큰 투자보다 기반을 다지는 방향이 맞아.

⚡ 이 시기의 함정
에너지가 넘치는 만큼 무리하지 않는 게 중요해.
번아웃 오면 다 날아가거든.

*개발 테스트용 더미 응답입니다."""
