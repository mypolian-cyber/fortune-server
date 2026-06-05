"""
대육임(大六壬) 계산 엔진
orrery/core에서 받은 데이터 기반
"""

# 12지지
JIJI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
JIJI_IDX = {j: i for i, j in enumerate(JIJI)}

# 십성(天將) 배속 - 지지별 고정
SIPSUNG = {
    "子": "대음",  "丑": "천후",  "寅": "천공",  "卯": "청룡",
    "辰": "육합",  "巳": "구진",  "午": "주작",  "未": "육합",
    "申": "태상",  "酉": "백호",  "戌": "태음",  "亥": "귀인",
}

# 십성 길흉 기본값
SIPSUNG_GILHUNG = {
    "귀인": "길", "청룡": "길", "육합": "길", "태상": "길", "천후": "길",
    "주작": "중", "태음": "중", "대음": "중",
    "구진": "흉", "백호": "흉", "천공": "흉", "현무": "흉",
}

# 오행
OHAENG = {
    "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火",
    "午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水"
}

# 오행 상극 (A가 B를 극)
GEUK = {"木":"土","火":"金","土":"水","金":"木","水":"火"}

# 일간 → 소속 지지
GAN_TO_JI = {
    "甲":"寅","乙":"卯","丙":"巳","丁":"午",
    "戊":"巳","己":"午","庚":"申","辛":"酉",
    "壬":"亥","癸":"子"
}

# 귀인 위치 (일간별 주귀/야귀)
GUIIN = {
    "甲":{"주":"未","야":"丑"}, "乙":{"주":"申","야":"子"},
    "丙":{"주":"酉","야":"亥"}, "丁":{"주":"亥","야":"酉"},
    "戊":{"주":"丑","야":"未"}, "己":{"주":"子","야":"申"},
    "庚":{"주":"丑","야":"未"}, "辛":{"주":"寅","야":"午"},
    "壬":{"주":"卯","야":"巳"}, "癸":{"주":"巳","야":"卯"},
}

def get_cheonban(woljiang: str) -> dict:
    """천반 포설 - 월장 기준"""
    wj_idx = JIJI_IDX[woljiang]
    result = {}
    for i in range(12):
        cb_idx = (wj_idx + i) % 12
        result[JIJI[i]] = JIJI[cb_idx]
    return result

def is_geuk(cheon: str, ji: str) -> bool:
    """천이 지를 극하는가"""
    return GEUK.get(OHAENG[cheon]) == OHAENG[ji]

def get_4gwa(ilgan: str, ilji: str, cheonban: dict) -> dict:
    """4과 도출"""
    ilgan_ji = GAN_TO_JI[ilgan]

    gwa1_cheon = cheonban[ilgan_ji]
    gwa1_ji    = ilgan_ji

    gwa2_cheon = cheonban[gwa1_cheon]
    gwa2_ji    = gwa1_cheon

    gwa3_cheon = cheonban[ilji]
    gwa3_ji    = ilji

    gwa4_cheon = cheonban[gwa3_cheon]
    gwa4_ji    = gwa3_cheon

    return {
        "1과": {"천": gwa1_cheon, "지": gwa1_ji, "십성": SIPSUNG[gwa1_cheon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[gwa1_cheon],"중")},
        "2과": {"천": gwa2_cheon, "지": gwa2_ji, "십성": SIPSUNG[gwa2_cheon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[gwa2_cheon],"중")},
        "3과": {"천": gwa3_cheon, "지": gwa3_ji, "십성": SIPSUNG[gwa3_cheon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[gwa3_cheon],"중")},
        "4과": {"천": gwa4_cheon, "지": gwa4_ji, "십성": SIPSUNG[gwa4_cheon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[gwa4_cheon],"중")},
    }

def get_3jeon(sa_gwa: dict, ilji: str, cheonban: dict) -> dict:
    """3전 도출"""
    geuk_list = []
    for gwa_name, gwa in sa_gwa.items():
        if is_geuk(gwa["천"], gwa["지"]):
            geuk_list.append(gwa["천"])

    chojeon = geuk_list[0] if geuk_list else cheonban[ilji]

    jungjeon = cheonban[chojeon]
    maljeon  = cheonban[jungjeon]

    return {
        "초전": {"지": chojeon, "십성": SIPSUNG[chojeon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[chojeon],"중")},
        "중전": {"지": jungjeon, "십성": SIPSUNG[jungjeon], "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[jungjeon],"중")},
        "말전": {"지": maljeon,  "십성": SIPSUNG[maljeon],  "길흉": SIPSUNG_GILHUNG.get(SIPSUNG[maljeon],"중")},
    }

def calculate_yukim(orrery_data: dict, q_hour: int) -> dict:
    """
    육임 전체 계산
    orrery_data: Node 서비스에서 받은 데이터
    """
    ilgan        = orrery_data["ilgan"]
    ilji         = orrery_data["ilji"]
    iljin        = orrery_data["iljin"]
    woljiang     = orrery_data["woljiang"]
    haengnyeon_ji = orrery_data["haengnyeon_ji"]

    # 낮/밤 판별
    is_day   = 6 <= q_hour < 18
    guiin    = GUIIN[ilgan]["주" if is_day else "야"]

    # 천반 포설
    cheonban = get_cheonban(woljiang)

    # 4과
    sa_gwa   = get_4gwa(ilgan, ilji, cheonban)

    # 3전
    sam_jeon = get_3jeon(sa_gwa, ilji, cheonban)

    # 행년 십성
    haengnyeon_sipsung = SIPSUNG[haengnyeon_ji]

    return {
        "iljin":      iljin,
        "ilgan":      ilgan,
        "ilji":       ilji,
        "woljiang":   woljiang,
        "is_day":     is_day,
        "guiin":      guiin,
        "cheonban":   cheonban,
        "sa_gwa":     sa_gwa,
        "sam_jeon":   sam_jeon,
        "haengnyeon": {
            "ji":      haengnyeon_ji,
            "sipsung": haengnyeon_sipsung
        }
    }
