"""
공통 프롬프트 원칙
모든 서비스(올해운세·평생운세·궁합·육임)에 적용
"""

COMMON_PRINCIPLES = """
[공통 원칙 — 반드시 준수]

1. 구체적 행동 원칙
   - 추상적 경고나 조언 금지
   - 반드시 오늘 당장 할 수 있는 행동 하나로 구체화
   - 예시:
     관계 흉 → "오늘 오랫동안 연락 못 했던 사람에게 짧은 메시지나 이모티콘 하나 보내보세요"
     재물 흉 → "지금 당장 통장 잔액 확인하고 이번 달 지출 하나만 줄여보세요"
     커리어 흉 → "오늘 이력서 한 줄만 업데이트하거나 관심 있는 공고 하나만 저장해두세요"
     건강 흉 → "지금 물 한 잔 마시고 5분만 스트레칭해보세요"
     커리어 길 → "오늘 미뤄왔던 연락 하나, 지금 바로 하세요. 타이밍입니다"
     재물 길 → "지금 떠오르는 그 아이디어, 메모장에 적어두세요. 흘려보내지 마세요"

2. 언어 원칙
   - 사주·오행·천간·지지·대운·세운·십성 등 전통 용어 절대 금지
   - MBTI 유형명은 사용 가능 (ENFP, ISTJ 등)
   - 일상 언어, 현대 심리 언어로만 서술
   - 어렵고 무거운 표현 금지

3. 톤 원칙
   - 부정적 결과를 통보하지 말고 "이렇게 하면 넘길 수 있어요"로 전환
   - 공감 먼저, 분석 나중
   - 마지막은 반드시 희망적 메시지로 마무리
   - 사용자가 읽고 나서 "뭔가 할 수 있을 것 같다"는 느낌을 줘야 함

4. MBTI별 말투 원칙
   NT형 (INTJ/ENTJ/INTP/ENTP):
     - 논리적·구조적·직설적
     - 불릿 포인트 활용
     - 근거 제시
     - "왜냐하면" "분석하면" 등 사용
   
   NF형 (INFJ/ENFJ/INFP/ENFP):
     - 따뜻하고 공감적
     - 스토리텔링 형식
     - 감성적 언어
     - "느껴지시나요" "마음이" 등 사용
   
   SJ형 (ISTJ/ESTJ/ISFJ/ESFJ):
     - 구체적·실용적·안정감
     - 단계별 설명
     - 명확한 결론
     - "구체적으로" "정확히" 등 사용
   
   SP형 (ISTP/ESTP/ISFP/ESFP):
     - 짧고 임팩트 있게
     - 현재 중심
     - 직접적
     - 긴 설명 없이 핵심만

5. 용신·기신 활용 원칙
   용신 방향으로 변화 (편안한 에너지):
     - "지금 이 에너지를 최대한 활용하세요"
     - 적극적 행동 권장
     - 기회 포착 강조
   
   기신 방향으로 변화 (불편한 에너지):
     - "지금 이런 경향이 생길 수 있어요. 의식적으로 조율하세요"
     - 절제·조심 권고
     - 구체적 대응 행동 제시
   
   흉신 방향으로 변화 (극하는 에너지):
     - "이 시기에 특히 조심해야 할 것은..."
     - 명확한 경고 + 반드시 대안 행동 제시
   
   희신 방향으로 변화 (돕는 에너지):
     - "보조 에너지가 당신을 돕고 있어요"
     - 활용 방법 구체적 제시

6. 분량 원칙
   무료 다이제스트 (Haiku):
     - 300~400자
     - 핵심 3줄 + 구체적 행동 1개
     - 유료 전환 유도 1줄
   
   유료 풀버전 (Sonnet):
     - 1,500자 이상
     - 섹션당 최소 150자
     - 구체적 행동 조언 최소 3개
     - 각 행동은 오늘 당장 할 수 있는 것

7. 면책 원칙
   건강 관련 → 마지막에 추가:
     "이 풀이는 자기 이해를 위한 참고용입니다. 건강 문제는 반드시 전문의와 상담하세요."
   
   갈등·분쟁 관련 → 마지막에 추가:
     "이 풀이는 자기 이해를 위한 참고용입니다. 법적 문제는 반드시 전문가와 상담하세요."
"""

# MBTI 용신·기신·희신·흉신 체계
def get_mbti_yongsin(origin_type: str) -> dict:
    """원국 MBTI 기반 용신·기신·희신·흉신"""
    result = {}

    # EI축
    if 'E' in origin_type:
        result['EI'] = {"용신":"E","기신":"I","희신":"N","흉신":"J"}
    else:
        result['EI'] = {"용신":"I","기신":"E","희신":"T","흉신":"F"}

    # SN축
    if 'N' in origin_type:
        result['SN'] = {"용신":"N","기신":"S","희신":"F","흉신":"J"}
    else:
        result['SN'] = {"용신":"S","기신":"N","희신":"J","흉신":"P"}

    # TF축
    if 'T' in origin_type:
        result['TF'] = {"용신":"T","기신":"F","희신":"J","흉신":"N"}
    else:
        result['TF'] = {"용신":"F","기신":"T","희신":"E","흉신":"S"}

    # JP축
    if 'J' in origin_type:
        result['JP'] = {"용신":"J","기신":"P","희신":"T","흉신":"N"}
    else:
        result['JP'] = {"용신":"P","기신":"J","희신":"N","흉신":"S"}

    return result


def analyze_daewoon_quality(
    origin_scores: dict,
    origin_type: str,
    current_scores: dict,
    current_type: str
) -> dict:
    """대운·세운 에너지 질(質) 분석"""
    yongsin = get_mbti_yongsin(origin_type)

    axis_map = {
        "EI": ("E","I"),
        "SN": ("N","S"),
        "TF": ("F","T"),
        "JP": ("P","J")
    }

    quality_score_map = {"용신":2,"희신":1,"기신":-1,"흉신":-2}
    result = {}

    for axis, (high_letter, low_letter) in axis_map.items():
        origin  = origin_scores[axis]
        current = current_scores[axis]
        diff    = current - origin
        moving  = high_letter if diff > 0 else low_letter
        ys      = yongsin[axis]

        if moving == ys["용신"]:
            quality = "용신"
        elif moving == ys["기신"]:
            quality = "기신"
        elif moving == ys["희신"]:
            quality = "희신"
        else:
            quality = "흉신"

        # 구체적 행동 메시지
        ACTION_TEMPLATE = {
            "용신": {
                "EI": {"E": "지금 사람들과 적극적으로 교류하면 기회가 생겨요. 오늘 만남 하나 잡아보세요.",
                       "I": "혼자만의 시간에서 답이 나오는 시기예요. 오늘 30분 혼자 생각하는 시간을 가져보세요."},
                "SN": {"N": "직관이 폭발하는 시기예요. 지금 떠오르는 아이디어를 메모장에 적어두세요.",
                       "S": "현실적 실행력이 최고인 시기예요. 오늘 계획 하나를 구체적으로 써보세요."},
                "TF": {"F": "감성과 공감 능력이 최고인 시기예요. 오늘 소원해진 사람에게 이모티콘 하나 보내보세요.",
                       "T": "논리적 판단력이 선명한 시기예요. 미뤄왔던 결정 하나를 오늘 내려보세요."},
                "JP": {"J": "계획대로 실행하면 됩니다. 오늘 할 일 목록 3가지만 정해보세요.",
                       "P": "유연하게 흐름을 타는 게 유리해요. 오늘 계획을 조금 느슨하게 잡아보세요."},
            },
            "기신": {
                "EI": {"I": "혼자 있고 싶어지는 시기예요. 억지로 사람 만나려 하지 말고, 대신 오늘 소원해진 사람에게 짧은 메시지 하나만 보내보세요.",
                       "E": "에너지가 분산되기 쉬운 시기예요. 오늘 약속 하나를 줄이고 혼자만의 시간을 가져보세요."},
                "SN": {"S": "현실적 제약이 강해지는 시기예요. 너무 큰 그림보다 오늘 할 수 있는 것 하나에만 집중하세요.",
                       "N": "아이디어가 넘치지만 실행이 안 되는 시기예요. 오늘은 아이디어 하나만 골라 첫 걸음을 내딛어보세요."},
                "TF": {"T": "감정보다 논리가 앞서는 시기예요. 오늘 가까운 사람에게 먼저 안부를 물어보세요.",
                       "F": "감정에 휩쓸리기 쉬운 시기예요. 오늘 중요한 결정은 하루 미루고 냉정하게 생각해보세요."},
                "JP": {"P": "즉흥적 행동이 늘어나는 시기예요. 오늘 지출 하나를 참아보세요.",
                       "J": "답답하고 막히는 느낌이 드는 시기예요. 계획을 조금 느슨하게 조정해보세요."},
            },
        }

        action = ""
        if quality in ["용신", "기신"]:
            templates = ACTION_TEMPLATE.get(quality, {}).get(axis, {})
            action = templates.get(moving, "")

        result[axis] = {
            "origin":   origin,
            "current":  current,
            "diff":     round(diff, 1),
            "moving":   moving,
            "quality":  quality,
            "distance": abs(diff),
            "action":   action
        }

    # 전체 대운 요약
    total = sum(quality_score_map[v["quality"]] for v in result.values())
    if total >= 4:
        overall = "매우 좋은 흐름"
    elif total >= 1:
        overall = "전반적으로 좋은 흐름"
    elif total >= -1:
        overall = "중립적 흐름"
    elif total >= -4:
        overall = "주의가 필요한 흐름"
    else:
        overall = "신중하게 관리해야 할 흐름"

    return {
        "axes":        result,
        "overall":     overall,
        "total_score": total
    }

print("=== 공통 프롬프트 원칙 로드 완료 ===")
print(f"원칙 길이: {len(COMMON_PRINCIPLES)}자")

# 테스트
origin_scores  = {"EI":51.0,"SN":47.7,"TF":37.1,"JP":37.5}
current_scores = {"EI":52.8,"SN":47.8,"TF":35.2,"JP":38.8}
origin_type    = "ESTJ"
current_type   = "ESTJ"

quality = analyze_daewoon_quality(
    origin_scores, origin_type,
    current_scores, current_type
)

print(f"\n전체 흐름: {quality['overall']} (점수:{quality['total_score']})")
for axis, v in quality['axes'].items():
    print(f"{axis}: {v['moving']}방향 [{v['quality']}] 변화량:{v['diff']}")
    if v['action']:
        print(f"  → {v['action']}")

# ============================================================
# 십성별 관계·행동 매핑
# ============================================================

SIPSUNG_RELATION_ACTION = {
    "정인": {
        "관계": "어머니·보살펴주는 사람",
        "길": "지금 당신을 지지해주는 사람의 힘이 강한 시기예요. 도움을 받아도 됩니다.",
        "흉": "어머니나 당신을 아껴주는 분과의 연결이 약해지는 시기예요. 오늘 엄마에게 전화 한 통 해보세요. '밥은 먹었어요?' 이 한 마디면 충분합니다.",
        "action": "오늘 어머니 또는 당신을 늘 챙겨주는 분께 안부 전화 한 통 해보세요."
    },
    "편인": {
        "관계": "아버지·스승·멘토",
        "길": "아버지나 멘토의 도움이 오는 시기예요. 조언을 구해보세요.",
        "흉": "아버지나 멘토와의 연결이 약해지는 시기예요. 오늘 아버지께 짧은 카톡 하나 보내보세요.",
        "action": "오늘 아버지 또는 당신의 멘토에게 짧은 메시지 하나 보내보세요."
    },
    "식신": {
        "관계": "자녀·창의성·표현",
        "길": "창의적 에너지가 넘치는 시기예요. 아이디어를 바로 실행에 옮기세요.",
        "흉": "자녀나 창의적 에너지가 막히는 시기예요. 오늘 아이와 10분만 함께 앉아보세요. 스마트폰은 잠깐 내려놓고요.",
        "action": "오늘 자녀와 10분만 같이 앉아 이야기 나눠보세요. 스마트폰은 잠깐 내려놓고요."
    },
    "상관": {
        "관계": "자녀·표현·소통",
        "길": "표현력과 소통 에너지가 강한 시기예요. 하고 싶은 말을 솔직하게 해보세요.",
        "흉": "표현이 막히거나 자녀와 갈등이 생기기 쉬운 시기예요. 오늘 자녀에게 '오늘 어땠어?' 한 마디 먼저 물어봐주세요.",
        "action": "오늘 자녀에게 '오늘 어땠어?' 한 마디 먼저 물어봐주세요."
    },
    "정재": {
        "관계": "배우자·안정적 재물",
        "길": "파트너와의 관계가 안정되고 재물이 들어오는 시기예요.",
        "흉": "파트너와 소통이 줄어드는 시기예요. 오늘 배우자나 파트너에게 '고마워' 한 마디 해보세요. 작은 말 한 마디가 관계를 지킵니다.",
        "action": "오늘 배우자나 파트너에게 '고마워' 또는 '수고했어' 한 마디 해보세요."
    },
    "편재": {
        "관계": "아버지·이성·유동 재물",
        "길": "새로운 기회와 이성 에너지가 활성화되는 시기예요.",
        "흉": "재물이 새거나 이성 관계에 변수가 생기기 쉬운 시기예요. 오늘 지출 하나를 참아보세요.",
        "action": "오늘 충동적인 지출 하나를 참아보세요. 하루만 기다려도 충분합니다."
    },
    "정관": {
        "관계": "직장·사회·남편(여성의 경우)",
        "길": "사회적 인정과 직장 운이 좋은 시기예요. 적극적으로 나서보세요.",
        "흉": "직장에서 스트레스가 쌓이거나 규칙이 답답하게 느껴지는 시기예요. 오늘 상사나 동료에게 먼저 웃으며 인사 한 번 해보세요.",
        "action": "오늘 직장 동료에게 먼저 웃으며 인사 한 번 건네보세요. 분위기가 달라집니다."
    },
    "편관": {
        "관계": "직장 스트레스·도전·남편(여성의 경우)",
        "길": "도전적인 에너지가 강한 시기예요. 두려워하지 말고 치고 나가세요.",
        "흉": "스트레스와 압박이 강해지는 시기예요. 오늘 퇴근 후 10분만 혼자만의 시간을 가져보세요. 아무것도 안 해도 됩니다.",
        "action": "오늘 퇴근 후 10분만 혼자 조용히 앉아있어 보세요. 아무것도 안 해도 됩니다."
    },
    "비견": {
        "관계": "형제·친구·동료·경쟁",
        "길": "동료나 친구의 도움이 오는 시기예요. 협력하면 좋은 결과가 납니다.",
        "흉": "오랫동안 연락 못 한 친구나 형제와의 거리가 더 멀어지기 쉬운 시기예요. 오늘 오래된 친구에게 이모티콘 하나 보내보세요. 말 없이 이모티콘 하나만으로도 충분합니다.",
        "action": "오늘 오래된 친구에게 이모티콘 하나 보내보세요. 말 없이 이모티콘 하나만으로도 충분합니다."
    },
    "겁재": {
        "관계": "경쟁자·형제·지출",
        "길": "경쟁에서 이기는 에너지가 강한 시기예요.",
        "흉": "경쟁이나 손재가 생기기 쉬운 시기예요. 오늘 계약서나 중요 문서는 한 번 더 꼼꼼히 읽어보세요.",
        "action": "오늘 서명하거나 결정해야 할 것이 있다면 하루 더 생각해보세요."
    },
}


def get_sipsung_action(sipsung: str, is_good: bool) -> str:
    """십성별 구체적 행동 메시지 반환"""
    if sipsung not in SIPSUNG_RELATION_ACTION:
        return ""
    data = SIPSUNG_RELATION_ACTION[sipsung]
    return data["길"] if is_good else data["흉"]


def build_relation_context(pillars: list, daewoon_quality: dict) -> str:
    """
    사주 원국의 십성 정보 + 대운 질 분석을 결합해
    관계별 행동 메시지 생성
    """
    messages = []

    for pillar in pillars:
        stem_sipsin  = pillar.get("stemSipsin", "")
        branch_sipsin = pillar.get("branchSipsin", "")

        for sipsin in [stem_sipsin, branch_sipsin]:
            if sipsin in SIPSUNG_RELATION_ACTION:
                # 대운 전체 흐름 기반 길흉 판단
                total = daewoon_quality.get("total_score", 0)
                is_good = total >= 0
                action = get_sipsung_action(sipsin, is_good)
                if action and action not in messages:
                    messages.append(action)

    return "\n".join(f"• {m}" for m in messages[:3])  # 최대 3개


print("\n=== 십성-관계-행동 매핑 추가 완료 ===")
print(f"매핑된 십성 수: {len(SIPSUNG_RELATION_ACTION)}개")

# 테스트
print("\n=== 테스트: 정인 흉운 ===")
print(get_sipsung_action("정인", False))
print("\n=== 테스트: 비견 흉운 ===")
print(get_sipsung_action("비견", False))
print("\n=== 테스트: 식신 흉운 ===")
print(get_sipsung_action("식신", False))
