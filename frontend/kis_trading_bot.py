import websocket
import json
import time

# 1. 앞서 만든 트레이딩 시스템 클래스 (간소화 버전)
class TradingSystem:
    def __init__(self):
        self.premarket_universe = []
        self.frozen_universe = set()
        self.is_market_open = False

    def add_premarket_stock(self, stock_code):
        if not self.is_market_open:
            if stock_code not in self.premarket_universe:
                self.premarket_universe.append(stock_code)

    def on_market_open(self):
        self.is_market_open = True
        self.frozen_universe = set(self.premarket_universe)
        print(f"✅ 장전 유니버스 확정 및 잠금: {len(self.frozen_universe)}개 종목")

    def process_realtime_signal(self, stock_code, data):
        if stock_code in self.frozen_universe:
            print(f"🟢 [장전 확정 종목] {stock_code} 가격: {data.get('price')}원 -> 매수/매도 신호 처리")
        else:
            print(f"🟡 [실시간 경보] {stock_code}는 장전 유니버스에 없음. 무시됨.")

# 2. 시스템 인스턴스 생성
system = TradingSystem()

# 3. KIS API WebSocket 콜백 함수
def on_message(ws, message):
    try:
        data = json.loads(message)
        # KIS API 포맷에 맞춰 파싱 (실제 TR 응답 포맷에 따라 조정 필요)
        body = data.get('body', {})
        stock_code = body.get('stck_bsop_code', '')
        current_price = body.get('stck_prpr', '0')
        
        system.process_realtime_signal(stock_code, {"price": current_price})
    except Exception as e:
        print(f"실시간 데이터 파싱 오류: {e}")

def on_error(ws, error):
    print(f"WebSocket 오류: {error}")

def on_close(ws, close_status_code, close_msg):
    print("### WebSocket 연결 종료 ###")

def on_open(ws):
    print("### WebSocket 연결 성공 ###")
    # 09:00에 확정된 frozen_universe의 종목만 실시간 등록
    register_realtime_tr(ws, system.frozen_universe)

def register_realtime_tr(ws, frozen_universe):
    print(f"📡 {len(frozen_universe)}개 종목에 대해 KIS 실시간 등록 시작...")
    for stock_code in frozen_universe:
        payload = {
            "header": {
                "approval_key": "YOUR_APPROVAL_KEY", # 실제 승인키로 교체 필요
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

# 4. 테스트 실행 로직
if __name__ == "__main__":
    print("--- 08:30 장전 유니버스 선정 시뮬레이션 ---")
    system.add_premarket_stock("005930") # 삼성전자
    system.add_premarket_stock("000660") # SK하이닉스
    
    print("\n--- 09:00 장 시작 (Freeze) ---")
    system.on_market_open()
    
    print("\n--- WebSocket 연결 테스트 (실제 연결은 주석 해제 후 실행) ---")
    # ws_url = "ws://ops.koreainvestment.com:21000"
    # ws = websocket.WebSocketApp(ws_url, on_message=on_message, on_error=on_error, on_close=on_close, on_open=on_open)
    # ws.run_forever()
    
    print("✅ 파일 생성 및 기본 로직 테스트 완료!")
