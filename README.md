# Pro-dashboard V3 Clean

ACUVUE Professional Education Intelligence Dashboard V3

## 구조
- `index.html`: 화면 구조
- `styles.css`: 디자인
- `app.js`: 데이터 분석 / 추천 교육 엔진 / CSV 자동 연동
- `output/Competitor_Activity.csv`: 경쟁사 활동 데이터
- `.github/workflows/competitor-monitor.yml`: GitHub Actions 자동 실행

## 핵심 흐름
교육 → 프로그램 활용 → 인식 변화 → 기능성렌즈 성과

## 업로드 엑셀 시트
- Account_Master
- Education_History
- Program_Usage
- Sales_Performance
- Perception
- Education_Master
- Competitor_Activity

## 경쟁사 활동
대시보드는 `./output/Competitor_Activity.csv`를 자동으로 읽습니다.
경쟁사 활동은 안경원 단위가 아니라 지역 단위로 해석하는 것을 권장합니다.
