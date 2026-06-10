from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.engines.yukim_engine import calculate_yukim

router = APIRouter()

class YukimRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: Optional[int] = 12
    gender: str
    question_type: str
    question_items: List[str]
    question_text: Optional[str] = None
    mbti_type: Optional[str] = None

QUESTION_TYPE_PROMPT = {
    "커리어": "취직·이직·승진·합격 관련 질문입니다. 초전=현재 상황, 중전=진행 과정, 말전=최종 결과로 해석하세요.",
    "재물":   "돈·투자·사업·거래 관련 질문입니다. 초전=현재 재물 상태, 중전=변화 흐름, 말전=결과로 해석하세요.",
    "인연":   "연애·관계·인연 관련 질문입니다. 초전=현재 감정 상태, 중전=관계 흐름, 말전=결말로 해석하세요.",
    "건강":   "몸·건강·회복 관련 질문입니다. 초전=현재 상태, 중전=경과, 말전=회복 여부로 해석하세요.",
    "갈등":   "분쟁·갈등·해결 관련 질문입니다. 초전=현재 상황, 중전=전개, 말전=해결 여부로 해석하세요.",
    "이동":   "이사·이동·변화 관련 질문입니다. 초전=현재, 중전=과정, 말전=결과로 해석하세요.",
    "관계":   "대인관계·신뢰·동업 관련 질문입니다. 초전=현재 관계 상태, 중전=변화, 말전=결론으로 해석하세요.",
    "기타":   "현재 상황의 흐름에 대한 질문입니다. 초전=현재, 중전=전개, 말전=결론으로 해석하세요.",
}

SIPSUNG_CONTEXT = {
    "청룡": "밝고 발전적인 에너지가 흐르고 있어요. 좋은 소식이 올 수 있는 흐름입니다.",
    "귀인": "주변에서 도움의 손길이 생기는 에너지입니다. 혼자 해결하려 하지 말고 도움을 요청해보세요.",
    "태상": "안정적이고 차분한 에너지입니다. 급하게 밀어붙이기보다 천천히 진행하는 게 유리해요.",
    "육합": "연결되고 합쳐지는 에너지입니다. 관계나 일이 성사되는 흐름이에요.",
    "천후": "결실을 맺는 에너지입니다. 준비해온 것들이 빛을 발하는 시기예요.",
    "대음": "내면의 에너지가 강한 시기입니다. 직관을 믿고 움직이세요.",
    "주작": "말과 소통의 에너지가 활성화됩니다. 중요한 대화나 문서 작업이 있을 수 있어요.",
    "태음": "은밀하게 진행되는 에너지입니다. 숨겨진 부분을 잘 살펴야 해요.",
    "구진": "막히고 지연되는 에너지입니다. 서두르지 말고 인내가 필요한 시기예요.",
    "백호": "급격한 변화의 에너지입니다. 충동적인 결정은 피하고 신중하게 행동하세요.",
    "천공": "불확실한 에너지입니다. 정보를 더 모으고 확인한 후 움직이는 게 좋아요.",
    "현무": "숨겨진 변수가 있는 에너지입니다. 겉으로 보이는 것만 믿지 말고 꼼꼼히 살피세요.",
}

GILHUNG_SUMMARY = {
    "길": "전반적으로 유리한 흐름입니다.",
    "중": "조건에 따라 달라질 수 있는 흐름입니다.",
    "흉": "주의가 필요한 흐름입니다. 신중하게 접근하세요.",
}

SYSTEM_PROMPT = """당신은 대육임(大六壬)을 깊이 이해하는 현대적 운세 해석가입니다.
육임 에너지 데이터를 받아 사용자의 질문에 공감하고 깊이 있게 풀이합니다.

절대 지켜야 할 규칙:
1. 청룡·백호·귀인·주작·태상·육합·구진·천공·현무·태음·대음·천후 등 십성 이름을 절대 언급하지 마세요
2. 초전·중전·말전·4과·월장·일진·천간·지지 등 전통 육임 용어를 절대 쓰지 마세요
3. 오행·음양·사주 등 전통 용어도 쓰지 마세요
4. 현대 심리 언어와 일상 언어로만 풀이하세요
5. 부정적 결과도 반드시 희망적·건설적으로 전환하세요
6. 각 섹션을 충분히 풍부하게 작성하세요 (섹션당 최소 150자)
7. 건강 관련은 마지막에 반드시 면책 문구를 추가하세요
8. 갈등·분쟁 관련은 마지막에 반드시 법적 면책 문구를 추가하세요"""

def get_mbti_tone(mbti_type: str) -> str:
    if not mbti_type or len(mbti_type) < 4:
        return ""
    tone = []
    if mbti_type[1] == 'T':
        tone.append("논리적이고 구조적으로, 불릿 포인트를 활용해 명확하게 서술하세요.")
    else:
        tone.append("따뜻하고 공감하는 어조로, 감성적으로 서술하세요.")
    if mbti_type[0] == 'E':
        tone.append("활기차고 긍정적인 에너지로 서술하세요.")
    else:
        tone.append("차분하고 깊이 있게 서술하세요.")
    if mbti_type[2] == 'N':
        tone.append("큰 그림과 가능성 중심으로 서술하세요.")
    else:
        tone.append("구체적이고 실용적인 조언 중심으로 서술하세요.")
    if mbti_type[3] == 'J':
        tone.append("명확한 결론과 계획을 제시하세요.")
    else:
        tone.append("유연한 선택지와 가능성을 제시하세요.")
    return " ".join(tone)

def build_yukim_prompt(
    yukim_result: dict,
    question_type: str,
    question_items: list,
    question_text: str,
    gender: str,
    mbti_type: str = None
) -> str:
    sam_jeon   = yukim_result["sam_jeon"]
    sa_gwa     = yukim_result["sa_gwa"]
    haengnyeon = yukim_result["haengnyeon"]
    mbti_tone  = get_mbti_tone(mbti_type) if mbti_type else ""

    chojeon_ctx  = SIPSUNG_CONTEXT.get(sam_jeon['초전']['십성'], '')
    jungjeon_ctx = SIPSUNG_CONTEXT.get(sam_jeon['중전']['십성'], '')
    maljeon_ctx  = SIPSUNG_CONTEXT.get(sam_jeon['말전']['십성'], '')
    haeng_ctx    = SIPSUNG_CONTEXT.get(haengnyeon['sipsung'], '')

    gwa_summary = []
    for gwa, v in sa_gwa.items():
        ctx = SIPSUNG_CONTEXT.get(v['십성'], '')
        gwa_summary.append(f"{gwa}: {ctx} [{v['길흉']}]")

    return f"""{SYSTEM_PROMPT}

[에너지 흐름 데이터]

현재 상황 에너지:
{chojeon_ctx}
길흉: {GILHUNG_SUMMARY.get(sam_jeon['초전']['길흉'], '')}

전개 에너지:
{jungjeon_ctx}
길흉: {GILHUNG_SUMMARY.get(sam_jeon['중전']['길흉'], '')}

결론 에너지:
{maljeon_ctx}
길흉: {GILHUNG_SUMMARY.get(sam_jeon['말전']['길흉'], '')}

본인 고유 에너지:
{haeng_ctx}

주변 환경 에너지:
{chr(10).join(gwa_summary)}

시간대: {'낮 — 외향적 에너지 활성화' if yukim_result['is_day'] else '밤 — 내면 에너지 활성화'}

[질문 유형]
{question_type}
{QUESTION_TYPE_PROMPT.get(question_type, '')}

[선택한 항목]
{chr(10).join(f'- {item}' for item in question_items)}

[추가 질문]
{question_text if question_text else '없음'}

[사용자 정보]
성별: {'남성' if gender == 'M' else '여성'}
{'MBTI: ' + mbti_type if mbti_type else ''}

[말투 지침]
{mbti_tone if mbti_tone else '공감하고 따뜻하게, 직관적으로 서술하세요.'}

[출력 지침]
- 전체 1,500자 이상 작성하세요
- 각 섹션 최소 150자 이상
- 공감과 위로로 시작하세요
- 선택한 항목 하나하나에 대해 구체적으로 풀이하세요
- 구체적인 행동 조언을 포함하세요
- 타이밍과 주의사항을 명확히 하세요
- 마지막은 희망적인 메시지로 마무리하세요

[출력 형식 — 반드시 이 순서로]

지금 이 순간, 당신의 흐름을 읽었습니다

🔍 지금 이 상황
(현재 에너지 흐름 상세 설명 및 공감 — 최소 200자)

🌀 앞으로의 전개
(선택 항목별 구체적 풀이 포함 — 최소 300자)

✨ 결론과 방향
(결론 에너지 기반 — 최소 200자, 희망적으로)

⚡ 지금 당장 해야 할 것
(구체적 행동 조언 3가지 이상 — 각 항목 2줄 이상)

🕐 타이밍
(언제 움직이면 좋은지, 피해야 할 시기 — 최소 100자)

💡 이 시기를 잘 보내는 법
(에너지 활용 방법과 마음가짐 — 최소 150자)

🌟 마무리
(희망적이고 따뜻한 마무리 메시지 — 2~3줄)"""


async def generate_yukim_reading(
    yukim_result: dict,
    question_type: str,
    question_items: list,
    question_text: str,
    gender: str,
    mbti_type: str = None
) -> str:
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return _dummy_reading(yukim_result, question_type, question_items)

    prompt = build_yukim_prompt(
        yukim_result, question_type, question_items,
        question_text, gender, mbti_type
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 2000,
                    "temperature": 0.9,
                }
            },
            timeout=40.0
        )
        result = response.json()
        if response.status_code != 200:
            raise Exception(f"Gemini API 오류: {result.get('error', {}).get('message', '')}")
        return result["candidates"][0]["content"]["parts"][0]["text"]


def _dummy_reading(yukim_result: dict, question_type: str, question_items: list) -> str:
    sam_jeon = yukim_result["sam_jeon"]
    chojeon  = sam_jeon["초전"]["십성"]
    jungjeon = sam_jeon["중전"]["십성"]
    maljeon  = sam_jeon["말전"]["십성"]
    haengnyeon = yukim_result["haengnyeon"]["sipsung"]

    return f"""지금 이 순간, 당신의 흐름을 읽었습니다

🔍 지금 이 상황
{SIPSUNG_CONTEXT.get(chojeon, '지금 당신 주변의 에너지가 움직이기 시작하고 있어요.')}
선택하신 항목들을 보면, 지금 이 순간 당신이 가장 집중하고 있는 것이 무엇인지 느껴집니다.
{GILHUNG_SUMMARY.get(sam_jeon['초전']['길흉'], '')}

🌀 앞으로의 전개
{SIPSUNG_CONTEXT.get(jungjeon, '흐름이 변화하고 있어요.')}
지금 선택하신 항목들 — {', '.join(question_items[:2])} — 에 대해 말씀드리면,
이 시기의 에너지는 서두르기보다 흐름을 타는 것이 중요합니다.
{GILHUNG_SUMMARY.get(sam_jeon['중전']['길흉'], '')}
본인 고유의 에너지({SIPSUNG_CONTEXT.get(haengnyeon, '')})가 이 흐름에 어떻게 작용하는지도 중요합니다.

✨ 결론과 방향
{SIPSUNG_CONTEXT.get(maljeon, '결과가 만들어지고 있어요.')}
{GILHUNG_SUMMARY.get(sam_jeon['말전']['길흉'], '')}
지금의 흐름이 말하는 방향은 명확합니다. 준비된 만큼 결과가 따라옵니다.

⚡ 지금 당장 해야 할 것
- 지금 가장 중요한 것은 방향을 명확히 하는 것입니다.
  흔들리지 말고 본인이 원하는 것에 집중하세요.
- 주변 사람들과의 소통을 늘려보세요.
  혼자 해결하려 하기보다 도움을 요청하는 것이 유리한 시기입니다.
- 무리한 결정은 잠시 보류하세요.
  충분한 정보를 모은 후 움직이는 것이 현명합니다.

🕐 타이밍
{'지금 바로 움직이는 것이 유리합니다. 이 흐름을 놓치지 마세요.' if sam_jeon['말전']['길흉'] == '길' else '조금 더 기다리고 준비하는 것이 유리합니다. 서두르면 놓칠 수 있어요.'}
특히 앞으로 2~3주 안에 중요한 결정이 있다면, 충분히 생각하고 움직이세요.

💡 이 시기를 잘 보내는 법
지금 이 에너지를 잘 활용하려면 자신의 내면 목소리에 귀 기울이는 것이 중요합니다.
외부의 소음에 흔들리지 말고, 본인이 진정으로 원하는 것이 무엇인지 명확히 하세요.
작은 것부터 실행에 옮기다 보면 흐름이 자연스럽게 열립니다.

🌟 마무리
지금 이 순간, 당신은 이미 충분히 잘 하고 있습니다.
흐름은 당신 편입니다. 믿고 나아가세요.

*개발 테스트용 더미 응답입니다."""


@router.post("/calculate")
async def calculate(req: YukimRequest, db: AsyncSession = Depends(get_db)):
    node_url = os.getenv("NODE_SERVICE_URL", "http://localhost:3001")
    now = datetime.now()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{node_url}/yukim_base",
                json={
                    "birth_year":  req.year,
                    "birth_month": req.month,
                    "birth_day":   req.day,
                    "birth_hour":  req.hour,
                    "q_year":  now.year,
                    "q_month": now.month,
                    "q_day":   now.day,
                    "q_hour":  now.hour,
                }
            )
            orrery_data = response.json()["data"]

        yukim_result = calculate_yukim(orrery_data, q_hour=now.hour)

        reading = await generate_yukim_reading(
            yukim_result=yukim_result,
            question_type=req.question_type,
            question_items=req.question_items,
            question_text=req.question_text,
            gender=req.gender,
            mbti_type=req.mbti_type
        )

        return {
            "success": True,
            "yukim": {
                "iljin":      yukim_result["iljin"],
                "woljiang":   yukim_result["woljiang"],
                "sa_gwa":     yukim_result["sa_gwa"],
                "sam_jeon":   yukim_result["sam_jeon"],
                "haengnyeon": yukim_result["haengnyeon"],
            },
            "reading": reading
        }

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Node 서비스 오류: {str(e)}")
