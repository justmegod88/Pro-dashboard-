
"""
ACUVUE Competitor Activity Crawler
- Collects public web search results for Alcon / Cooper / Bausch+Lomb activity
- Classifies brand, region, channel, promotion type
- Outputs CSV files that can be uploaded to the dashboard

Important:
- This is public web monitoring, not official market data.
- It does not crawl Instagram.
- Search result HTML can change; use this as an MVP crawler.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from urllib.parse import quote_plus, urlparse, parse_qs, unquote

import requests
from bs4 import BeautifulSoup


BRANDS = {
    "알콘": ["알콘", "alcon", "토탈원", "워터렌즈", "데일리스", "프리시전원", "precision1", "total1"],
    "쿠퍼": ["쿠퍼", "쿠퍼비전", "cooper", "마이데이", "바이오피니티", "클래리티", "myday", "biofinity"],
    "바슈롬": ["바슈롬", "bausch", "lomb", "울트라", "바이오트루", "소프렌", "ultra", "biotrue"],
}

REGIONS = [
    "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
    "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
]

CHANNELS = ["다비치", "으뜸", "안경진정성", "I/O", "아이옵틱", "아이앤옵틱"]

PROMO_KEYWORDS = {
    "상품권": ["상품권", "기프티콘", "쿠폰"],
    "이벤트": ["이벤트", "행사", "프로모션", "혜택"],
    "체험/샘플": ["체험", "샘플", "시험착용", "무료체험"],
    "후기": ["후기", "리뷰", "체험단"],
    "가격/할인": ["할인", "가격", "특가", "세일"],
}

DEFAULT_QUERIES = [
    "알콘 렌즈 프로모션",
    "알콘 토탈원 이벤트",
    "알콘 상품권 렌즈",
    "쿠퍼렌즈 프로모션",
    "쿠퍼비전 이벤트",
    "마이데이 렌즈 행사",
    "바슈롬 렌즈 프로모션",
    "바슈롬 울트라 이벤트",
    "바슈롬 상품권 렌즈",
]


@dataclass
class Result:
    collected_at: str
    source: str
    query: str
    brand: str
    title: str
    snippet: str
    url: str
    region: str
    channel: str
    promotion_type: str


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def classify_brand(text: str) -> str:
    low = text.lower()
    scores = {}
    for brand, kws in BRANDS.items():
        scores[brand] = sum(1 for kw in kws if kw.lower() in low)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "기타"


def classify_region(text: str) -> str:
    for region in REGIONS:
        if region in text:
            return region
    return "미확인"


def classify_channel(text: str) -> str:
    low = text.lower()
    for ch in CHANNELS:
        if ch.lower() in low:
            if ch in ["아이옵틱", "아이앤옵틱"]:
                return "I/O"
            return ch
    return "미확인"


def classify_promo(text: str) -> str:
    low = text.lower()
    found = []
    for label, kws in PROMO_KEYWORDS.items():
        if any(kw.lower() in low for kw in kws):
            found.append(label)
    return ", ".join(found) if found else "기타"


def normalize_naver_url(url: str) -> str:
    # Naver search result links sometimes wrap external URL in query params.
    try:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        for key in ["url", "u"]:
            if key in qs and qs[key]:
                return unquote(qs[key][0])
    except Exception:
        pass
    return url


def fetch_naver_search(query: str, pages: int = 2, delay: float = 1.0) -> list[Result]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ACUVUECompetitorMonitor/1.0; +https://example.com)"
    }
    results: list[Result] = []
    collected_at = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for page in range(pages):
        start = page * 10 + 1
        url = f"https://search.naver.com/search.naver?where=view&query={quote_plus(query)}&start={start}"
        try:
            res = requests.get(url, headers=headers, timeout=15)
            res.raise_for_status()
        except Exception as exc:
            print(f"[WARN] query failed: {query} page={page+1} error={exc}")
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        candidates = soup.select("a.title_link, a.api_txt_lines, a.link_tit")

        for a in candidates:
            title = clean_text(a.get_text(" "))
            href = normalize_naver_url(a.get("href", ""))
            if not title or not href:
                continue

            # Try nearby snippet
            parent = a.find_parent()
            snippet = ""
            if parent:
                snippet = clean_text(parent.get_text(" "))
            text = f"{title} {snippet} {href}"
            brand = classify_brand(text)

            if brand == "기타":
                continue

            results.append(Result(
                collected_at=collected_at,
                source="Naver View",
                query=query,
                brand=brand,
                title=title,
                snippet=snippet[:300],
                url=href,
                region=classify_region(text),
                channel=classify_channel(text),
                promotion_type=classify_promo(text),
            ))

        time.sleep(delay)

    return results


def dedupe(rows: list[Result]) -> list[Result]:
    seen = set()
    out = []
    for r in rows:
        key = (r.brand, r.title, r.url)
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def write_csv(rows: list[Result], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(asdict(rows[0]).keys()) if rows else [
        "collected_at", "source", "query", "brand", "title", "snippet", "url",
        "region", "channel", "promotion_type"
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            writer.writerow(asdict(r))


def write_activity_summary(rows: list[Result], path: Path) -> None:
    # Dashboard-friendly summary: 월, 지역, 채널, 알콘, 쿠퍼, 바슈롬
    today_month = dt.datetime.now().strftime("%Y-%m")
    summary = {}
    for r in rows:
        key = (today_month, r.region or "미확인", r.channel or "미확인")
        if key not in summary:
            summary[key] = {"월": today_month, "지역": key[1], "채널": key[2], "알콘": 0, "쿠퍼": 0, "바슈롬": 0}
        if r.brand in ["알콘", "쿠퍼", "바슈롬"]:
            summary[key][r.brand] += 1

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        fields = ["월", "지역", "채널", "알콘", "쿠퍼", "바슈롬"]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in sorted(summary.values(), key=lambda x: (x["지역"], x["채널"])):
            writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages", type=int, default=2, help="Naver search pages per query")
    parser.add_argument("--delay", type=float, default=1.2, help="Delay between requests")
    parser.add_argument("--queries-file", default="queries.txt", help="Optional query file")
    parser.add_argument("--out-dir", default="output", help="Output directory")
    args = parser.parse_args()

    qpath = Path(args.queries_file)
    if qpath.exists():
        queries = [line.strip() for line in qpath.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#")]
    else:
        queries = DEFAULT_QUERIES

    all_rows = []
    for q in queries:
        print(f"[INFO] crawling: {q}")
        all_rows.extend(fetch_naver_search(q, pages=args.pages, delay=args.delay))

    rows = dedupe(all_rows)
    out_dir = Path(args.out_dir)
    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M")
    write_csv(rows, out_dir / f"competitor_raw_{stamp}.csv")
    write_activity_summary(rows, out_dir / "Competitor_Activity.csv")

    print(f"[DONE] raw rows: {len(rows)}")
    print(f"[DONE] wrote: {out_dir / 'Competitor_Activity.csv'}")


if __name__ == "__main__":
    main()
