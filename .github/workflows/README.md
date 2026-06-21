# ACUVUE Competitor Monitoring Crawler

네이버 공개 검색 결과에서 알콘 / 쿠퍼 / 바슈롬 관련 행사·프로모션 게시글을 수집하고, 대시보드에 업로드 가능한 `Competitor_Activity.csv`를 생성하는 MVP 스크립트입니다.

## 1. 설치

```bash
pip install -r requirements.txt
```

## 2. 실행

```bash
python competitor_crawler.py
```

실행 후 `output/Competitor_Activity.csv`가 생성됩니다.

## 3. 대시보드 업로드

대시보드의 파일 업로드 기능에 `Competitor_Activity.csv` 또는 기존 엑셀 템플릿의 `Competitor_Activity` 시트에 붙여넣어 사용합니다.

## 4. 결과 컬럼

`Competitor_Activity.csv`

| 월 | 지역 | 채널 | 알콘 | 쿠퍼 | 바슈롬 |
|---|---|---|---:|---:|---:|

원문 링크는 `competitor_raw_YYYYMMDD_HHMM.csv`에서 확인합니다.

## 5. 검색어 수정

`queries.txt`를 수정하면 됩니다.

예:
```txt
알콘 상품권 렌즈
쿠퍼렌즈 프로모션
바슈롬 이벤트
다비치 알콘 이벤트
```

## 6. GitHub Actions 자동 실행

`.github/workflows/competitor-monitor.yml` 파일을 포함했습니다.
GitHub에 올리면 매주 월요일 오전 8시 기준으로 자동 실행되도록 설정되어 있습니다.

단, GitHub Actions에서 네이버 검색 접근이 제한될 수 있습니다. 제한되면 로컬 PC에서 실행하는 방식으로 사용하세요.

## 7. 주의사항

- 실제 공식 매출/점유율 데이터가 아니라 공개 게시글 기반의 노출량 지표입니다.
- 인스타그램은 로그인/차단 이슈가 있어 제외했습니다.
- 지역/채널은 제목·본문 일부 텍스트 기반 추정입니다.
- 중복 게시글이나 광고성 게시글은 일부 포함될 수 있어 최종 해석 시 원문 확인이 필요합니다.
