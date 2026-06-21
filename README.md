# ACUVUE Competitor Activity Crawler

알콘, 쿠퍼, 바슈롬 관련 공개 웹/뉴스/블로그 검색 결과를 수집해서 대시보드용 Excel로 정리합니다.

## 실행

```bash
pip install -r requirements.txt
python competitor_watch_crawler.py --out competitor_activity.xlsx
```

## 결과 시트

- `Competitor_Activity`: 대시보드에 넣기 좋은 요약 시트
- `Raw_Posts`: 원문 제목/요약/URL/브랜드/지역/채널 추정값

## 주의

- Instagram 자동 크롤링은 로그인/약관/차단 이슈가 있어 제외했습니다.
- 네이버 검색 HTML 구조는 바뀔 수 있어, 결과가 적으면 selector 수정이 필요할 수 있습니다.
- 회사 업무용이면 사내 보안/개인정보/저작권 정책 확인 후 사용하세요.
