import websocket
import json
import requests
import time
from datetime import datetime

# ==========================================
# 1. KIS API 인증 정보 (본인의 정보로 교체 필요)
# ==========================================
APP_KEY = "YOUR_APP_KEY"          
APP_SECRET = "YOUR_APP_SECRET"    
CANO = "YOUR_CANO"                
ACNT_PRDT_CD = "YOUR_ACNT_PRDT_CD"
WS_URL = "ws://ops.koreainvestment.com:21000" 

# ==========================================
# 2. 트레이딩 시스템 (Freeze 로직)
# ==========================================
class TradingSystem:
    def __init__(self):
        self.premarket_universe = []
        self.frozen_universe = set()
        self.is_market_open = False

    def add_premarket_stock(self, stock_code):
        if not self.is_market_open and stock_code not in self.premarket_universe:
            self.premarket_universe.append(stock_code)

    def on_market_open(self):
        self.is_market_open = True
        self.frozen_universe = set(self.premarket_universe)
        print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] 장전 유니버스 확정 및 잠금: {len(self.frozen_universe)}개 종목")
        print(f"   📌 선정된 종목: {', '.join(self.frozen_universe)}")

    def process_realtime_signal(self, stock_code, data):
        if stock_code in self.frozen_universe:
            # ★ 수정: data가 딕셔너리인지 정수인지 안전하게 처리
            price = data.get('price') if isinstance(data, dict) else data
            print(f"🟢 [{datetime.now().strftime('%H:%M:%S')}] [장전 확정] {stock_code} 현재가: {price}원 -> 신호 처리")
        else:
            # 유니버스 오염 방지! 장전 리스트에 없는 종목은 무시
            pass 

system = TradingSystem()

# ==========================================
# 3. KIS API 토큰 발급 (REST)
# ==========================================
def get_access_token():
    url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    body = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }
    res = requests.post(url, headers=headers, data=json.dumps(body))
    if res.status_code == 200:
        token = res.json().get("access_token")
        print(f"✅ Access Token 발급 성공")
        return token
    else:
        print(f"❌ Token 발급 실패: {res.text}")
        return None

# ==========================================
# 4. WebSocket 콜백 함수
# ==========================================
def on_message(ws, message):
    try:
        data = json.loads(message)
        if "body" in data:
            body = data["body"]
            stock_code = body.get("stck_bsop_code", "")
            current_price = body.get("stck_prpr", "0")
            
            # ★ 핵심: 오직 frozen_universe(5개 종목)에 있는 종목만 처리
            system.process_realtime_signal(stock_code, {"price": current_price})
    except Exception as e:
        print(f"데이터 파싱 오류: {e}")

def on_error(ws, error):
    print(f"WebSocket 오류: {error}")

def on_close(ws, close_status_code, close_msg):
    print("### WebSocket 연결 종료 ###")

def on_open(ws):
    print("### WebSocket 연결 성공 ###")
    register_realtime_tr(ws, system.frozen_universe)

def register_realtime_tr(ws, frozen_universe):
    access_token = get_access_token()
    if not access_token:
        print("토큰이 없어 실시간 등록을 중단합니다.")
        return

    print(f"📡 {len(frozen_universe)}개 종목에 대해 KIS 실시간 체결(H0STCNT0) 등록 시작...")
    for stock_code in frozen_universe:
        payload = {
            "header": {
                "approval_key": access_token,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNT0",
                    "tr_key": stock_code
                }
            }
        }
        ws.send(json.dumps(payload))
        print(f"  ✅ 실시간 등록 완료: {stock_code}")

# ==========================================
# 5. 실행 로직 (5개 종목 선정 시뮬레이션)
# ==========================================
if __name__ == "__main__":
    print("--- 08:30 장전 유니버스 선정 시뮬레이션 (5개 종목) ---")
    system.add_premarket_stock("005930") # 1. 삼성전자
    system.add_premarket_stock("000660") # 2. SK하이닉스
    system.add_premarket_stock("035420") # 3. NAVER
    system.add_premarket_stock("051910") # 4. LG화학
    system.add_premarket_stock("005380") # 5. 현대차
    
    print("\n--- 09:00 장 시작 (Freeze) ---")
    system.on_market_open()
    
    print("\n--- 장중 실시간 신호 테스트 (10:00) ---")
    # ★ 수정: 딕셔너리 형태로 전달하거나, 정수로 전달해도 에러 안 남
    system.process_realtime_signal("005930", {"price": 75000})  # 선정됨 -> 처리
    system.process_realtime_signal("035420", 210000)            # 선정됨 -> 처리 (정수 테스트)
    system.process_realtime_signal("123456", 10000)             # 선정 안 됨 -> 무시 (유니버스 오염 방지)
    
    print("\n✅ 5개 종목 Freeze 로직 테스트 완료! (실제 WebSocket 연결은 주석 해제 후 실행)")
