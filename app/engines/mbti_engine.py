# 사주×MBTI 통합이론 - Adaptive Personality Framework
# 대표님 이론 v2.0 기반

# 10천간 MBTI 벡터
CHEONGAN_VECTOR = {
    "甲": {"EI": 75, "SN": 65, "TF": 45, "JP": 60},
    "乙": {"EI": 40, "SN": 60, "TF": 65, "JP": 55},
    "丙": {"EI": 90, "SN": 55, "TF": 70, "JP": 70},
    "丁": {"EI": 45, "SN": 60, "TF": 72, "JP": 48},
    "戊": {"EI": 55, "SN": 30, "TF": 38, "JP": 28},
    "己": {"EI": 40, "SN": 32, "TF": 62, "JP": 35},
    "庚": {"EI": 60, "SN": 35, "TF": 18, "JP": 25},
    "辛": {"EI": 35, "SN": 55, "TF": 22, "JP": 30},
    "壬": {"EI": 58, "SN": 70, "TF": 35, "JP": 65},
    "癸": {"EI": 25, "SN": 68, "TF": 58, "JP": 42},
}

# 12지지 MBTI 벡터
JIJI_VECTOR = {
    "子": {"EI": 25, "SN": 68, "TF": 58, "JP": 42},
    "丑": {"EI": 33, "SN": 48, "TF": 46, "JP": 35},
    "寅": {"EI": 68, "SN": 57, "TF": 50, "JP": 55},
    "卯": {"EI": 55, "SN": 62, "TF": 57, "JP": 57},
    "辰": {"EI": 43, "SN": 51, "TF": 47, "JP": 38},
    "巳": {"EI": 72, "SN": 46, "TF": 45, "JP": 53},
    "午": {"EI": 73, "SN": 45, "TF": 54, "JP": 55},
    "未": {"EI": 42, "SN": 48, "TF": 58, "JP": 40},
    "申": {"EI": 58, "SN": 47, "TF": 25, "JP": 35},
    "酉": {"EI": 45, "SN": 46, "TF": 21, "JP": 28},
    "戌": {"EI": 48, "SN": 40, "TF": 33, "JP": 30},
    "亥": {"EI": 47, "SN": 69, "TF": 42, "JP": 57},
}

# 자리별 가중치
WEIGHT = {
    "year_stem":   1.0,  # 연간
    "year_branch": 1.0,  # 연지
    "month_stem":  2.0,  # 월간
    "month_branch":3.0,  # 월지 (가장 중요)
    "day_stem":    3.0,  # 일간 (자아의 중심)
    "day_branch":  2.0,  # 일지
    "hour_stem":   1.5,  # 시간
    "hour_branch": 1.5,  # 시지
}

TOTAL_WEIGHT = sum(WEIGHT.values())  # 16.0

# 대운·세운 영향 비율
DAEWOON_RATIO = {
    "origin":        0.70,  # 원국
    "daewoon_stem":  0.15,  # 대운 천간
    "daewoon_branch":0.10,  # 대운 지지
    "sewoon_stem":   0.03,  # 세운 천간
    "sewoon_branch": 0.02,  # 세운 지지
}

# 궁합 긴장도 가중치
GOONGHAP_WEIGHT = {
    "TF": 0.35,
    "SN": 0.25,
    "EI": 0.25,
    "JP": 0.15,
}

def get_vector(char: str) -> dict:
    """천간 또는 지지의 벡터 반환"""
    if char in CHEONGAN_VECTOR:
        return CHEONGAN_VECTOR[char]
    if char in JIJI_VECTOR:
        return JIJI_VECTOR[char]
    return {"EI": 50, "SN": 50, "TF": 50, "JP": 50}

def calculate_origin_score(pillars: list) -> dict:
    """원국 MBTI 스코어 계산"""
    if len(pillars) < 3:
        return {"EI": 50, "SN": 50, "TF": 50, "JP": 50}

    positions = [
        ("year_stem",    pillars[0]["pillar"]["stem"]),
        ("year_branch",  pillars[0]["pillar"]["branch"]),
        ("month_stem",   pillars[1]["pillar"]["stem"]),
        ("month_branch", pillars[1]["pillar"]["branch"]),
        ("day_stem",     pillars[2]["pillar"]["stem"]),
        ("day_branch",   pillars[2]["pillar"]["branch"]),
    ]

    # 시주가 있는 경우
    if len(pillars) >= 4:
        positions += [
            ("hour_stem",   pillars[3]["pillar"]["stem"]),
            ("hour_branch", pillars[3]["pillar"]["branch"]),
        ]

    scores = {"EI": 0, "SN": 0, "TF": 0, "JP": 0}
    total_w = sum(WEIGHT[pos] for pos, _ in positions)

    for pos, char in positions:
        w = WEIGHT[pos]
        v = get_vector(char)
        for axis in scores:
            scores[axis] += v[axis] * w

    # 정규화
    for axis in scores:
        scores[axis] = round(scores[axis] / total_w, 1)

    return scores

def score_to_mbti(scores: dict) -> str:
    """스코어를 MBTI 유형으로 변환"""
    ei = "E" if scores["EI"] >= 50 else "I"
    sn = "N" if scores["SN"] >= 50 else "S"
    tf = "F" if scores["TF"] >= 50 else "T"
    jp = "P" if scores["JP"] >= 50 else "J"
    return f"{ei}{sn}{tf}{jp}"

def get_mbti_label(scores: dict) -> dict:
    """각 축의 레이블과 강도 반환"""
    def label_strength(score):
        diff = abs(score - 50)
        if diff >= 20:
            return "강함"
        elif diff >= 10:
            return "보통"
        else:
            return "중간형"

    return {
        "EI": {
            "type": "E" if scores["EI"] >= 50 else "I",
            "score": scores["EI"],
            "strength": label_strength(scores["EI"])
        },
        "SN": {
            "type": "N" if scores["SN"] >= 50 else "S",
            "score": scores["SN"],
            "strength": label_strength(scores["SN"])
        },
        "TF": {
            "type": "F" if scores["TF"] >= 50 else "T",
            "score": scores["TF"],
            "strength": label_strength(scores["TF"])
        },
        "JP": {
            "type": "P" if scores["JP"] >= 50 else "J",
            "score": scores["JP"],
            "strength": label_strength(scores["JP"])
        },
    }

def calculate_period_score(origin_scores: dict, daewoon: dict, sewoon: dict = None) -> dict:
    """시기별 MBTI 스코어 계산 (원국 + 대운 + 세운)"""
    scores = {}
    for axis in ["EI", "SN", "TF", "JP"]:
        val = origin_scores[axis] * DAEWOON_RATIO["origin"]

        # 대운 반영
        if daewoon:
            dw_stem = get_vector(daewoon.get("stem", ""))
            dw_branch = get_vector(daewoon.get("branch", ""))
            val += dw_stem[axis] * DAEWOON_RATIO["daewoon_stem"]
            val += dw_branch[axis] * DAEWOON_RATIO["daewoon_branch"]

        # 세운 반영
        if sewoon:
            sw_stem = get_vector(sewoon.get("stem", ""))
            sw_branch = get_vector(sewoon.get("branch", ""))
            val += sw_stem[axis] * DAEWOON_RATIO["sewoon_stem"]
            val += sw_branch[axis] * DAEWOON_RATIO["sewoon_branch"]

        scores[axis] = round(val, 1)

    return scores

def calculate_goonghap(scores_a: dict, scores_b: dict) -> dict:
    """궁합 긴장도 계산"""
    tension = 0
    diff_detail = {}
    for axis, weight in GOONGHAP_WEIGHT.items():
        diff = abs(scores_a[axis] - scores_b[axis])
        diff_detail[axis] = round(diff, 1)
        tension += diff * weight

    tension = round(tension, 1)

    if tension <= 15:
        status = "공명기"
        desc = "두 사람의 성향이 매우 유사. 깊은 이해와 안정."
    elif tension <= 30:
        status = "조화기"
        desc = "약간의 차이가 있으나 보완 관계. 시너지 발생."
    elif tension <= 50:
        status = "긴장기"
        desc = "차이가 두드러지기 시작. 대화와 조율이 중요."
    elif tension <= 70:
        status = "충돌기"
        desc = "성향 차이가 크게 벌어진 시기. 반복적 갈등 가능."
    else:
        status = "분리기"
        desc = "두 사람의 현재 성향이 거의 반대."

    return {
        "tension": tension,
        "status": status,
        "description": desc,
        "diff_detail": diff_detail,
    }
