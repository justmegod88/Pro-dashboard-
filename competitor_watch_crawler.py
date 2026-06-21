"""
ACUVUE Competitor Activity Crawler
- Crawls public web/blog/news search result pages for competitor promotional activity.
- Outputs an Excel file that can be uploaded or copied into the dashboard's Competitor_Activity sheet.

Usage:
  pip install -r requirements.txt
  python competitor_watch_crawler.py --days 30 --out competitor_activity.xlsx

Notes:
  - This script collects only publicly visible search result metadata: title, snippet, URL, date if available.
  - Instagram crawling is not included because login/API restrictions often block compliant automated scraping.
  - For Instagram, use manual export, approved social listening tools, or official APIs.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import time
from dataclasses import dataclass, asdict
from typing import Iterable, List, Dict, Optional
from urllib.parse import quote_plus, urlparse

import pandas as pd
import requests
from bs4 import BeautifulSoup

BRANDS = {
    "알콘": ["알콘", "alcon", "토탈원", "워터렌즈", "데일리스", "프리시전원"],
    "쿠퍼": ["쿠퍼", "cooper", "쿠퍼비전", "coopervision", "마이데이", "바이오피니티"],
    "바슈롬": ["바슈롬", "bausch", "bausch lomb", "울트라", "바이오트루"],
}

ACTIVITY_KEYWORDS = [
    "프로모션", "이벤트", "행사", "상품권", "쿠폰", "체험", "체험팩", "샘플", "할인", "증정", "구매혜택", "후기"
]

REGION_KEYWORDS = [
    "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
    "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
]

CHANNEL_KEYWORDS = ["다비치", "으뜸", "안경진정성", "I/O", "아이오", "아이앤", "오렌즈", "렌즈미"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}

@dataclass
class ActivityRow:
    collected_at: str
    source: str
    brand: str
    query: str
    title: str
    snippet: str
    url: str
    domain: str
    inferred_region: str
    inferred_channel: str
    activity_type: str
    score: int


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def infer_first(text: str, keywords: Iterable[str], default: str = "미확인") -> str:
    text_l = text.lower()
    for kw in keywords:
        if kw.lower() in text_l:
            return kw
    return default


def infer_activity_type(text: str) -> str:
    text_l = text.lower()
    if any(k in text_l for k in ["상품권", "쿠폰", "증정", "구매혜택"]):
        return "구매혜택/증정"
    if any(k in text_l for k in ["체험", "체험팩", "샘플"]):
        return "체험/샘플"
    if any(k in text_l for k in ["할인", "특가"]):
        return "가격/할인"
    if any(k in text_l for k in ["후기", "리뷰"]):
        return "후기/리뷰"
    if any(k in text_l for k in ["교육", "세미나"]):
        return "교육/세미나"
    return "프로모션/행사"


def score_row(text: str, brand_aliases: List[str]) -> int:
    text_l = text.lower()
    score = 0
    if any(a.lower() in text_l for a in brand_aliases):
        score += 40
    score += min(30, sum(1 for k in ACTIVITY_KEYWORDS if k.lower() in text_l) * 8)
    if infer_first(text, REGION_KEYWORDS, ""):
        score += 10
    if infer_first(text, CHANNEL_KEYWORDS, ""):
        score += 10
    if any(k in text_l for k in ["원데이", "렌즈", "콘택트"]):
        score += 10
    return min(score, 100)


def fetch(url: str, sleep_sec: float = 1.0) -> Optional[str]:
    try:
        time.sleep(sleep_sec)
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200 and r.text:
            return r.text
        print(f"[WARN] HTTP {r.status_code}: {url}")
    except Exception as e:
        print(f"[WARN] fetch failed: {url} / {e}")
    return None


def crawl_google_news_rss(query: str, brand: str, aliases: List[str]) -> List[ActivityRow]:
    # Google News RSS is relatively stable for public news/blog mentions.
    url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=ko&gl=KR&ceid=KR:ko"
    xml = fetch(url, sleep_sec=0.3)
    rows: List[ActivityRow] = []
    if not xml:
        return rows
    soup = BeautifulSoup(xml, "xml")
    for item in soup.find_all("item")[:30]:
        title = normalize_text(item.title.text if item.title else "")
        link = normalize_text(item.link.text if item.link else "")
        desc = BeautifulSoup(item.description.text if item.description else "", "html.parser").get_text(" ")
        snippet = normalize_text(desc)
        text = f"{title} {snippet}"
        rows.append(ActivityRow(
            collected_at=dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
            source="Google News RSS",
            brand=brand,
            query=query,
            title=title,
            snippet=snippet[:500],
            url=link,
            domain=urlparse(link).netloc,
            inferred_region=infer_first(text, REGION_KEYWORDS),
            inferred_channel=infer_first(text, CHANNEL_KEYWORDS),
            activity_type=infer_activity_type(text),
            score=score_row(text, aliases),
        ))
    return rows


def crawl_naver_blog(query: str, brand: str, aliases: List[str]) -> List[ActivityRow]:
    url = f"https://search.naver.com/search.naver?where=blog&query={quote_plus(query)}&sm=tab_opt&nso=so:r,p:1m"
    html = fetch(url, sleep_sec=1.0)
    rows: List[ActivityRow] = []
    if not html:
        return rows
    soup = BeautifulSoup(html, "html.parser")
    # Naver changes classes often. Try multiple selectors.
    candidates = soup.select("a.title_link, a.api_txt_lines.total_tit, a.link_tit")
    for a in candidates[:30]:
        title = normalize_text(a.get_text(" "))
        link = a.get("href", "")
        container = a.find_parent()
        snippet = ""
        if container:
            parent_text = normalize_text(container.get_text(" "))
            snippet = parent_text.replace(title, "").strip()[:500]
        text = f"{title} {snippet}"
        rows.append(ActivityRow(
            collected_at=dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
            source="Naver Blog Search",
            brand=brand,
            query=query,
            title=title,
            snippet=snippet,
            url=link,
            domain=urlparse(link).netloc,
            inferred_region=infer_first(text, REGION_KEYWORDS),
            inferred_channel=infer_first(text, CHANNEL_KEYWORDS),
            activity_type=infer_activity_type(text),
            score=score_row(text, aliases),
        ))
    return rows


def build_queries() -> Dict[str, List[str]]:
    queries: Dict[str, List[str]] = {}
    for brand, aliases in BRANDS.items():
        base_aliases = aliases[:3]
        qs = []
        for alias in base_aliases:
            qs.append(f'{alias} 콘택트렌즈 프로모션')
            qs.append(f'{alias} 렌즈 상품권 이벤트')
            qs.append(f'{alias} 체험팩 샘플 안경원')
        queries[brand] = qs
    return queries


def dedupe(rows: List[ActivityRow]) -> List[ActivityRow]:
    seen = set()
    out = []
    for row in rows:
        key = (row.brand, row.url or row.title)
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def make_summary(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["월", "지역", "채널", "알콘", "쿠퍼", "바슈롬", "총건수"])
    df = df.copy()
    df["월"] = pd.to_datetime(df["collected_at"]).dt.strftime("%Y-%m")
    df["지역"] = df["inferred_region"].replace("미확인", "전국/미확인")
    df["채널"] = df["inferred_channel"].replace("미확인", "전체/미확인")
    pivot = pd.pivot_table(
        df,
        index=["월", "지역", "채널"],
        columns="brand",
        values="title",
        aggfunc="count",
        fill_value=0,
    ).reset_index()
    for brand in ["알콘", "쿠퍼", "바슈롬"]:
        if brand not in pivot.columns:
            pivot[brand] = 0
    pivot["총건수"] = pivot[["알콘", "쿠퍼", "바슈롬"]].sum(axis=1)
    return pivot[["월", "지역", "채널", "알콘", "쿠퍼", "바슈롬", "총건수"]].sort_values("총건수", ascending=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="competitor_activity.xlsx", help="Output Excel file path")
    parser.add_argument("--min-score", type=int, default=45, help="Keep rows above this relevance score")
    parser.add_argument("--source", choices=["all", "news", "naver"], default="all")
    args = parser.parse_args()

    all_rows: List[ActivityRow] = []
    for brand, queries in build_queries().items():
        aliases = BRANDS[brand]
        for q in queries:
            print(f"[INFO] crawling {brand}: {q}")
            if args.source in ["all", "news"]:
                all_rows.extend(crawl_google_news_rss(q, brand, aliases))
            if args.source in ["all", "naver"]:
                all_rows.extend(crawl_naver_blog(q, brand, aliases))

    rows = [r for r in dedupe(all_rows) if r.score >= args.min_score]
    df = pd.DataFrame([asdict(r) for r in rows])
    summary = make_summary(df)

    with pd.ExcelWriter(args.out, engine="openpyxl") as writer:
        summary.to_excel(writer, sheet_name="Competitor_Activity", index=False)
        df.to_excel(writer, sheet_name="Raw_Posts", index=False)

    print(f"[DONE] saved: {args.out}")
    print(f"[DONE] rows: {len(df)}")


if __name__ == "__main__":
    main()
