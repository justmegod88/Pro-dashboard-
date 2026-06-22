from pathlib import Path
import csv, datetime as dt

# MVP placeholder crawler output.
# 기존 competitor_watch_crawler.py를 쓰는 경우 이 파일은 덮어써도 됩니다.
# GitHub Actions가 output/Competitor_Activity.csv를 루트 기준으로 생성하도록 유지하세요.

rows = [
    {"월": dt.datetime.now().strftime("%Y-%m"), "지역": "서울", "알콘": 0, "쿠퍼": 0, "바슈롬": 0},
    {"월": dt.datetime.now().strftime("%Y-%m"), "지역": "부산", "알콘": 0, "쿠퍼": 0, "바슈롬": 0},
]
out = Path("output")
out.mkdir(exist_ok=True)
with (out / "Competitor_Activity.csv").open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["월","지역","알콘","쿠퍼","바슈롬"])
    w.writeheader()
    w.writerows(rows)
print("Created output/Competitor_Activity.csv")
