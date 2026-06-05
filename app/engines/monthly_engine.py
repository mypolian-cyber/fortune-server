"""
월별 MBTI 파동 계산 엔진
월운 천간·지지의 용신·기신·흉신 기준
"""
from app.engines.mbti_engine import get_vector, score_to_mbti
from app.services.prompt_principles import get_mbti_yongsin

MONTHLY_STEMS = {
    2026: {
        1:  {"stem":"己","branch":"丑"},
        2:  {"stem":"庚","branch":"申"},
        3:  {"stem":"戊","branch":"子"},
        4:  {"stem":"己","branch":"未"},
        5:  {"stem":"己","branch":"丑"},
        6:  {"stem":"庚","branch":"申"},
        7:  {"stem":"庚","branch":"寅"},
        8:  {"stem":"辛","branch":"酉"},
        9:  {"stem":"壬","branch":"辰"},
        10: {"stem":"壬","branch":"戌"},
        11: {"stem":"癸","branch":"巳"},
        12: {"stem":"癸","branch":"亥"},
    }
}

# MBTI 각 글자의 오행 성질
# 각 글자가 어느 방향 벡터를 강화하는가
LETTER_QUALITY = {
    # E 강화 글자들 (EI축 high)
    "E": ["甲","丙","庚","壬","寅","巳","午","申"],
    # I 강화 글자들 (EI축 low)
    "I": ["乙","丁","己","辛","癸","子","丑","卯","未","酉","戌","亥"],
    # N 강화 글자들 (SN축 high)
    "N": ["壬","癸","亥","子","卯","亥"],
    # S 강화 글자들 (SN축 low)
    "S": ["戊","己","庚","辛","丑","辰","申","酉","戌","未"],
    # F 강화 글자들 (TF축 high)
    "F": ["乙","丁","己","癸","丑","卯","未","亥"],
    # T 강화 글자들 (TF축 low)
    "T": ["甲","庚","辛","壬","寅","申","酉","子"],
    # P 강화 글자들 (JP축 high)
    "P": ["壬","癸","甲","乙","亥","子","寅","卯"],
    # J 강화 글자들 (JP축 low)
    "J": ["庚","辛","戊","己","申","酉","丑","辰","戌","未"],
}

def classify_char(char: str, yongsin: dict) -> dict:
    """
    천간·지지 한 글자가
    원국 MBTI 기준 용신·기신·희신·흉신 중 어느 것인지 판별
    """
    scores = {"용신":0, "희신":0, "기신":0, "흉신":0}

    for axis, ys in yongsin.items():
        yong = ys["용신"]   # 원국 방향
        gi   = ys["기신"]   # 반대 방향
        hui  = ys["희신"]   # 보조
        hyung = ys["흉신"]  # 극하는

        if char in LETTER_QUALITY.get(yong, []):
            scores["용신"] += 1
        if char in LETTER_QUALITY.get(gi, []):
            scores["기신"] += 1
        if char in LETTER_QUALITY.get(hui, []):
            scores["희신"] += 1
        if char in LETTER_QUALITY.get(hyung, []):
            scores["흉신"] += 1

    # 가장 높은 점수의 분류 반환
    dominant = max(scores, key=scores.get)
    return {
        "dominant": dominant,
        "scores":   scores
    }

def evaluate_monthly_quality(
    wolju: dict,
    yongsin: dict
) -> dict:
    """
    월주 천간·지지 기준
    용신·기신·흉신 판별 후 길흉 점수 계산
    """
    QUALITY_SCORE = {"용신": 2, "희신": 1, "기신": -1, "흉신": -2}
    COLOR_MAP = {
        "매우 길": "purple",
        "길":      "blue",
        "중립":    "gray",
        "주의":    "orange",
        "흉":      "red",
    }

    stem_class   = classify_char(wolju["stem"],   yongsin)
    branch_class = classify_char(wolju["branch"], yongsin)

    stem_score   = QUALITY_SCORE.get(stem_class["dominant"],   0)
    branch_score = QUALITY_SCORE.get(branch_class["dominant"], 0)

    # 천간 60% + 지지 40% 가중
    total = round(stem_score * 0.6 + branch_score * 0.4, 1)

    if total >= 1.5:
        label = "매우 길"
    elif total >= 0.5:
        label = "길"
    elif total >= -0.5:
        label = "중립"
    elif total >= -1.5:
        label = "주의"
    else:
        label = "흉"

    return {
        "total":        total,
        "label":        label,
        "color":        COLOR_MAP[label],
        "stem_class":   stem_class["dominant"],
        "branch_class": branch_class["dominant"],
    }

def calculate_monthly_wave(monthly: dict) -> dict:
    """월운 100% — 천간 50% + 지지 50%"""
    stem_v   = get_vector(monthly["stem"])
    branch_v = get_vector(monthly["branch"])
    scores = {}
    for axis in ["EI","SN","TF","JP"]:
        scores[axis] = round(stem_v[axis]*0.5 + branch_v[axis]*0.5, 1)
    return scores

def get_monthly_chart_data(
    origin_scores: dict,
    origin_type: str,
    year: int = 2026
) -> list:
    """연간 월별 파동 차트 데이터"""
    monthly_data = MONTHLY_STEMS.get(year, MONTHLY_STEMS[2026])
    yongsin = get_mbti_yongsin(origin_type)
    chart = []

    for month, wolju in monthly_data.items():
        m_scores = calculate_monthly_wave(wolju)
        m_type   = score_to_mbti(m_scores)
        quality  = evaluate_monthly_quality(wolju, yongsin)

        chart.append({
            "month":         f"{month}월",
            "month_num":     month,
            "wolju":         f"{wolju['stem']}{wolju['branch']}",
            "type":          m_type,
            "EI":            m_scores["EI"],
            "SN":            m_scores["SN"],
            "TF":            m_scores["TF"],
            "JP":            m_scores["JP"],
            "quality_score": quality["total"],
            "quality_label": quality["label"],
            "color":         quality["color"],
            "stem_class":    quality["stem_class"],
            "branch_class":  quality["branch_class"],
        })

    return chart

def get_best_worst_months(chart_data: list) -> dict:
    """최고·최악 월 추출"""
    sorted_data = sorted(chart_data, key=lambda x: x["quality_score"])
    worst = sorted_data[:3]
    best  = sorted_data[-3:][::-1]
    return {
        "best":  [{"month":d["month"],"label":d["quality_label"],"wolju":d["wolju"]} for d in best],
        "worst": [{"month":d["month"],"label":d["quality_label"],"wolju":d["wolju"]} for d in worst],
    }

def get_daewoon_chart_data(
    origin_scores: dict,
    origin_type: str,
    daewoon_list: list
) -> list:
    """
    평생 대운 파동 차트 데이터
    orrery daewoon 데이터 기반
    """
    yongsin = get_mbti_yongsin(origin_type)
    chart = []

    for dw in daewoon_list:
        ganzi   = dw.get("ganzi", "")
        stem    = ganzi[0] if len(ganzi) > 0 else ""
        branch  = ganzi[1] if len(ganzi) > 1 else ""
        age     = dw.get("age", 0)

        if not stem or not branch:
            continue

        wolju   = {"stem": stem, "branch": branch}
        scores  = calculate_monthly_wave(wolju)
        m_type  = score_to_mbti(scores)
        quality = evaluate_monthly_quality(wolju, yongsin)

        # 대운 시작·종료 나이
        age_end = age + 9

        chart.append({
            "ganzi":         ganzi,
            "stem":          stem,
            "branch":        branch,
            "age_start":     age,
            "age_end":       age_end,
            "age_label":     f"{age}~{age_end}세",
            "type":          m_type,
            "EI":            scores["EI"],
            "SN":            scores["SN"],
            "TF":            scores["TF"],
            "JP":            scores["JP"],
            "quality_score": quality["total"],
            "quality_label": quality["label"],
            "color":         quality["color"],
            "stem_class":    quality["stem_class"],
            "branch_class":  quality["branch_class"],
        })

    return chart
