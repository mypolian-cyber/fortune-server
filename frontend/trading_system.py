class TradingSystem:
    def __init__(self):
        self.premarket_universe = []  # 장전 선정용 (가변)
        self.frozen_universe = set()  # 장중 고정용 (불변)
        self.is_market_open = False   # 시간 잠금 플래그

    def add_premarket_stock(self, stock_code):
        """장전(08:00 ~ 08:59)에만 호출되는 함수"""
        if not self.is_market_open:
            if stock_code not in self.premarket_universe:
                self.premarket_universe.append(stock_code)

    def on_market_open(self):
        """09:00 장 시작 시 단 한 번만 호출"""
        self.is_market_open = True
        # ★ 핵심: 리스트를 Set으로 복사하여 물리적으로 고정 (Freeze)
        self.frozen_universe = set(self.premarket_universe)
        print(f"✅ 장전 유니버스 확정 및 잠금: {len(self.frozen_universe)}개 종목")

    def process_realtime_signal(self, stock_code, signal):
        """장중(09:00 ~ 15:30) 실시간 신호 처리"""
        # 1. 확정된 장전 유니버스에 있는 종목인지 확인
        if stock_code in self.frozen_universe:
            print(f"🟢 [장전 확정 종목] {stock_code} 매수/매도 신호 처리")
        # 2. 실시간 조건을 만족하는 '새로운 종목' 발견 시
        else:
            # ★ 절대 frozen_universe에 추가하면 안 됨! 별도의 경보 리스트에만 저장
            print(f"🟡 [실시간 경보] {stock_code}는 장전 유니버스에 없음. 임시 저장만 함.")

# --- 테스트 실행 코드 ---
if __name__ == "__main__":
    system = TradingSystem()
    
    print("--- 08:30 장전 유니버스 선정 ---")
    system.add_premarket_stock("005930") # 삼성전자
    system.add_premarket_stock("000660") # SK하이닉스
    
    print("\n--- 09:00 장 시작 (Freeze) ---")
    system.on_market_open()
    
    print("\n--- 10:00 장중 실시간 신호 처리 ---")
    system.process_realtime_signal("005930", "BUY")      # 장전 유니버스에 있음 → 정상 처리
    system.process_realtime_signal("035420", "BUY")      # 장전 유니버스에 없음 → 경보만 발생 (유니버스 오염 방지!)
