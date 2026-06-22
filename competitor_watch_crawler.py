from pathlib import Path
import csv, datetime as dt
out=Path('output'); out.mkdir(exist_ok=True)
rows=[{'월':dt.datetime.now().strftime('%Y-%m'),'지역':'서울','브랜드':'알콘','제목':'서울 알콘 렌즈 세미나 게시글','요약':'샘플 데이터입니다. 실제 크롤러로 교체 가능합니다.','URL':'#','출처':'sample','알콘':1,'쿠퍼':0,'바슈롬':0}]
with (out/'Competitor_Activity.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
