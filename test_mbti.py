import sys
sys.path.insert(0, '/root/fortune-server')

from app.engines.mbti_engine import (
    calculate_origin_score,
    score_to_mbti,
    get_mbti_label,
    calculate_period_score,
    calculate_goonghap
)

# 테스트용 사주 데이터 (1990.5.15 14:30 남)
pillars = [
    {"pillar": {"stem": "癸", "branch": "未"}},  # 년주
    {"pillar": {"stem": "庚", "branch": "辰"}},  # 월주
    {"pillar": {"stem": "辛", "branch": "巳"}},  # 일주
    {"pillar": {"stem": "庚", "branch": "午"}},  # 시주
]

print("=== 원국 MBTI 스코어 ===")
scores = calculate_origin_score(pillars)
print(f"EI: {scores['EI']} | SN: {scores['SN']} | TF: {scores['TF']} | JP: {scores['JP']}")
print(f"MBTI 유형: {score_to_mbti(scores)}")

print("\n=== 축별 상세 ===")
labels = get_mbti_label(scores)
for axis, info in labels.items():
    print(f"{axis}: {info['type']} (점수:{info['score']}, 강도:{info['strength']})")

print("\n=== 대운 적용 (27세 甲申 대운) ===")
daewoon = {"stem": "甲", "branch": "申"}
period = calculate_period_score(scores, daewoon)
print(f"EI: {period['EI']} | SN: {period['SN']} | TF: {period['TF']} | JP: {period['JP']}")
print(f"시기별 MBTI: {score_to_mbti(period)}")

print("\n=== 궁합 테스트 ===")
# 다른 사람 (1995.3.20 10:00 여)
pillars_b = [
    {"pillar": {"stem": "乙", "branch": "亥"}},
    {"pillar": {"stem": "丁", "branch": "卯"}},
    {"pillar": {"stem": "甲", "branch": "子"}},
    {"pillar": {"stem": "壬", "branch": "午"}},
]
scores_b = calculate_origin_score(pillars_b)
print(f"B MBTI: {score_to_mbti(scores_b)}")
goonghap = calculate_goonghap(scores, scores_b)
print(f"궁합 긴장도: {goonghap['tension']}")
print(f"궁합 상태: {goonghap['status']}")
print(f"설명: {goonghap['description']}")
