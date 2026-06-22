const CHANNELS = ["다비치", "으뜸", "안경진정성", "I/O"];
const YEAR_BUCKETS = ["0~3년", "4~7년", "8~15년", "15년+"];
const REGIONS = ["서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종", "전북", "전남", "광주", "경북", "경남", "대구", "울산", "부산", "제주"];

let rawRows = [];
let educationMaster = [];
let competitorActivity = [];
let activeDetail = "education";

const $ = (id) => document.getElementById(id);
const pct = (v) => `${Math.round(Number(v) || 0)}%`;
const score = (v) => `${(Number(v) || 0).toFixed(1)}점`;
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number(v) || 0));
const avg = (rows, fn) => rows.length ? rows.reduce((s, r) => s + (Number(fn(r)) || 0), 0) / rows.length : 0;
const sum = (rows, fn) => rows.reduce((s, r) => s + (Number(fn(r)) || 0), 0);
const yn = (v) => String(v ?? "").match(/1|Y|YES|TRUE|완료|사용|예|O/i) != null;

function seedSampleData() {
  const names = ["밝은눈안경", "아이편한안경", "렌즈스토리", "비전케어", "오늘안경", "클리어뷰", "스마트렌즈", "하이비전"];
  const managers = ["홍길동", "김민지", "박서준", "이하나"];
  const rows = [];
  let idx = 1001;

  REGIONS.forEach((region, ri) => {
    const count = region === "서울" ? 28 : region === "경기" ? 32 : region === "부산" ? 22 : 12;
    for (let i = 0; i < count; i++) {
      const seed = (ri + 1) * 100 + i;
      const channel = CHANNELS[seed % CHANNELS.length];
      const years = YEAR_BUCKETS[(seed + 1) % YEAR_BUCKETS.length];
      const educationBase = 45 + ((seed * 7) % 45);
      const usageBase = 28 + ((seed * 5) % 52);
      const perfBase = 15 + ((seed * 3) % 35);

      rows.push({
        code: `ACV${idx++}`,
        store: `${names[(seed + 2) % names.length]} ${i + 1}`,
        region,
        channel,
        years,
        manager: managers[seed % managers.length],
        online: educationBase,
        ondemand: Math.max(10, educationBase - 5 + (seed % 17)),
        offline: Math.max(5, educationBase - 20 + (seed % 20)),
        smartFitting: usageBase,
        aiProgram: Math.max(5, usageBase - 12 + (seed % 18)),
        simulator: Math.max(5, usageBase - 8 + (seed % 22)),
        totalSales: 800 + (seed % 9) * 120,
        toricSales: Math.round((800 + (seed % 9) * 120) * (0.08 + ((seed % 12) / 100))),
        mfSales: Math.round((800 + (seed % 9) * 120) * (0.06 + (((seed + 3) % 10) / 100))),
        maxSales: Math.round((800 + (seed % 9) * 120) * (0.04 + (((seed + 5) % 9) / 100))),
        lastTotalSales: 760 + (seed % 8) * 110,
        lastToricSales: Math.round((760 + (seed % 8) * 110) * (0.07 + (((seed + 2) % 10) / 100))),
        lastMfSales: Math.round((760 + (seed % 8) * 110) * (0.05 + (((seed + 4) % 9) / 100))),
        lastMaxSales: Math.round((760 + (seed % 8) * 110) * (0.03 + (((seed + 6) % 8) / 100))),
        mfConfidence: 2.6 + ((seed % 24) / 10),
        timeSaving: 2.7 + (((seed + 3) % 23) / 10),
        asdAwareness: 2.8 + (((seed + 4) % 22) / 10),
        blueAwareness: 2.4 + (((seed + 5) % 25) / 10),
        acuvueRecommend: 2.8 + (((seed + 6) % 22) / 10),
        alcon: seed % 7,
        cooper: (seed + 2) % 5,
        bausch: (seed + 4) % 4
      });
    }
  });

  rawRows = rows;
  educationMaster = [
    { code: "E01", name: "멀티포컬 기초", purpose: "멀티포컬 피팅 자신감 향상", condition: "MF_CONF<3", priority: 1 },
    { code: "E02", name: "스마트피팅 활용", purpose: "피팅 프로그램 활용도 향상", condition: "USAGE<40", priority: 2 },
    { code: "E03", name: "ASD 난시 교육", purpose: "난시 ASD 인식 및 난시 판매 강화", condition: "ASD<3", priority: 3 },
    { code: "E04", name: "MAX 블루라이트", purpose: "블루라이트 인식 및 MAX 판매 강화", condition: "BLUE<3", priority: 4 },
    { code: "E05", name: "아큐브 추천 상담", purpose: "아큐브 추천 의향 강화", condition: "RECOMMEND<3.5", priority: 5 }
  ];

  competitorActivity = [];
  setStatus("샘플 데이터");
}

function metricEducation(r) { return (Number(r.online) + Number(r.ondemand) + Number(r.offline)) / 3; }
function metricUsage(r) { return (Number(r.smartFitting) + Number(r.aiProgram) + Number(r.simulator)) / 3; }
function metricPerception(r) { return ((Number(r.mfConfidence) + Number(r.timeSaving) + Number(r.asdAwareness) + Number(r.blueAwareness) + Number(r.acuvueRecommend)) / 5) / 5 * 100; }
function avgPerceptionScore(r) { return (Number(r.mfConfidence) + Number(r.timeSaving) + Number(r.asdAwareness) + Number(r.blueAwareness) + Number(r.acuvueRecommend)) / 5; }
function toricShare(r) { return Number(r.totalSales) ? Number(r.toricSales) / Number(r.totalSales) * 100 : 0; }
function mfShare(r) { return Number(r.totalSales) ? Number(r.mfSales) / Number(r.totalSales) * 100 : 0; }
function maxShare(r) { return Number(r.totalSales) ? Number(r.maxSales) / Number(r.totalSales) * 100 : 0; }
function functionalPerformance(r) { return (toricShare(r) + mfShare(r) + maxShare(r)) / 3; }
function lastFunctionalPerformance(r) {
  const total = Number(r.lastTotalSales) || 1;
  return ((Number(r.lastToricSales) / total * 100) + (Number(r.lastMfSales) / total * 100) + (Number(r.lastMaxSales) / total * 100)) / 3;
}
function competitorCount(r) { return Number(r.alcon || 0) + Number(r.cooper || 0) + Number(r.bausch || 0); }

function filteredRows() {
  const q = $("searchBox").value.trim().toLowerCase();
  const region = $("regionFilter").value;
  const channel = $("channelFilter").value;
  const years = $("yearFilter").value;

  return rawRows.filter(r => {
    const text = `${r.code} ${r.store} ${r.region}`.toLowerCase();
    return (!q || text.includes(q)) &&
      (region === "all" || r.region === region) &&
      (channel === "all" || r.channel === channel) &&
      (years === "all" || r.years === years);
  });
}

function setStatus(msg) {
  const el = $("fileStatus");
  if (el) el.textContent = msg;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function renderAll() {
  const rows = filteredRows();
  renderKpis(rows);
  renderFunnel(rows);
  renderInsight(rows);
  renderRecommendations(rows);
  renderMatrix(rows);
  renderROI(rows);
  renderDetail(rows);
  renderTable(rows);
}

function renderKpis(rows) {
  setText("kpiStores", rows.length.toLocaleString("ko-KR"));
  setText("kpiEducation", pct(avg(rows, metricEducation)));
  setText("kpiUsage", pct(avg(rows, metricUsage)));
  setText("kpiPerception", score(avg(rows, avgPerceptionScore)));
  setText("kpiFunctional", pct(avg(rows, functionalPerformance)));
}

function renderFunnel(rows) {
  setText("funnelEducation", pct(avg(rows, metricEducation)));
  setText("funnelUsage", pct(avg(rows, metricUsage)));
  setText("funnelPerception", score(avg(rows, avgPerceptionScore)));
  setText("funnelPerformance", pct(avg(rows, functionalPerformance)));
}

function classifyGroup(rows) {
  const edu = avg(rows, metricEducation);
  const usage = avg(rows, metricUsage);
  const perception = avg(rows, avgPerceptionScore);
  const performance = avg(rows, functionalPerformance);
  const comp = avg(rows, competitorCount);

  if (comp >= 8 && (performance < 15 || usage < 45)) return ["risk", "경쟁사 압력 주의"];
  if (edu >= 70 && usage >= 60 && perception >= 4 && performance >= 16) return ["good", "Best Practice"];
  if (edu >= 65 && usage < 45) return ["growth", "교육 후 실행 전환 필요"];
  if (perception < 3.2 || performance < 12) return ["risk", "Follow-up 우선"];
  return ["watch", "선택 성장"];
}

function renderInsight(rows) {
  const [cls, label] = classifyGroup(rows);
  const edu = avg(rows, metricEducation);
  const usage = avg(rows, metricUsage);
  const perception = avg(rows, avgPerceptionScore);
  const performance = avg(rows, functionalPerformance);
  const max = avg(rows, maxShare);
  const blue = avg(rows, r => r.blueAwareness);
  const mf = avg(rows, mfShare);
  const mfConf = avg(rows, r => r.mfConfidence);

  $("insightBadge").className = `badge ${cls}`;
  $("insightBadge").textContent = label;

  let text = "";
  if (edu >= 65 && usage < 45) {
    text = `교육 참여도는 ${pct(edu)}로 양호하지만 프로그램 활용도는 ${pct(usage)}로 낮습니다. 교육 이후 실제 피팅 프로그램 사용으로 이어지는 전환 구간이 약합니다. 스마트피팅 활용 교육과 사용 리마인드를 우선 추천합니다.`;
  } else if (blue < 3.2 && max < avg(rawRows, maxShare)) {
    text = `블루라이트 인식 점수가 ${score(blue)}로 낮고 MAX 판매 비중도 평균 대비 낮습니다. MAX 블루라이트 교육을 우선 배포하면 인식과 판매 성과를 동시에 개선할 가능성이 있습니다.`;
  } else if (mfConf < 3.2 && mf < avg(rawRows, mfShare)) {
    text = `멀티포컬 피팅 자신감이 ${score(mfConf)}로 낮고 멀티포컬 판매 비중도 평균 이하입니다. 멀티포컬 기초 교육과 AI 프로그램 활용 교육을 함께 추천합니다.`;
  } else if (performance >= avg(rawRows, functionalPerformance) && perception >= 4) {
    text = `기능성렌즈 성과와 인식 점수가 모두 양호합니다. 우수 안경원의 교육→활용→인식→성과 패턴을 다른 지역/채널에 복제하는 Best Practice 후보입니다.`;
  } else {
    text = `현재 필터 기준 교육 참여도 ${pct(edu)}, 프로그램 활용도 ${pct(usage)}, 인식 ${score(perception)}, 기능성렌즈 성과 ${pct(performance)}입니다. 낮은 세부 항목을 기준으로 추천 교육 대상을 다운로드해 Follow-up 하세요.`;
  }

  $("autoInsight").textContent = text;
}

function recommendForRow(r) {
  const recs = [];
  const nationalMf = avg(rawRows, mfShare);
  const nationalMax = avg(rawRows, maxShare);
  const nationalToric = avg(rawRows, toricShare);

  if (Number(r.blueAwareness) < 3.2 || maxShare(r) < nationalMax * 0.8) {
    recs.push({ code: "E04", name: "MAX 블루라이트", reason: "블루라이트 인식 또는 MAX 판매 비중 낮음" });
  }
  if (Number(r.mfConfidence) < 3.2 || mfShare(r) < nationalMf * 0.8) {
    recs.push({ code: "E01", name: "멀티포컬 기초", reason: "멀티포컬 자신감 또는 판매 비중 낮음" });
  }
  if (Number(r.asdAwareness) < 3.2 || toricShare(r) < nationalToric * 0.8) {
    recs.push({ code: "E03", name: "ASD 난시 교육", reason: "난시 ASD 인식 또는 난시 판매 비중 낮음" });
  }
  if (metricUsage(r) < 40) {
    recs.push({ code: "E02", name: "스마트피팅 활용", reason: "피팅 프로그램 활용도 낮음" });
  }
  if (Number(r.acuvueRecommend) < 3.5) {
    recs.push({ code: "E05", name: "아큐브 추천 상담", reason: "아큐브 추천 의향 낮음" });
  }
  return recs;
}

function renderRecommendations(rows) {
  const enriched = rows.map(r => ({ ...r, recommendations: recommendForRow(r) })).filter(r => r.recommendations.length);
  const uniqueStores = enriched.length;
  const totalRecs = enriched.reduce((s, r) => s + r.recommendations.length, 0);

  $("recommendedSummary").innerHTML = `
    <div class="summary-mini"><span>추천 대상</span><strong>${uniqueStores.toLocaleString("ko-KR")}</strong></div>
    <div class="summary-mini"><span>추천 교육 수</span><strong>${totalRecs.toLocaleString("ko-KR")}</strong></div>
  `;

  $("recommendedList").innerHTML = enriched.slice(0, 12).map(r => `
    <div class="recommend-item">
      <strong>${r.store} <span class="badge watch">${r.code}</span></strong>
      <small>${r.region} · ${r.channel} · ${r.years}</small>
      <div class="recommend-tags">
        ${r.recommendations.slice(0, 3).map(x => `<span>${x.code} ${x.name}</span>`).join("")}
      </div>
      <small>${r.recommendations[0].reason}</small>
    </div>
  `).join("") || `<div class="recommend-item"><strong>추천 대상 없음</strong><small>현재 필터 기준 우선 추천 대상이 낮습니다.</small></div>`;
}

function tierClass(value, goodHigh = true) {
  if (goodHigh) {
    if (value >= 70) return "good";
    if (value >= 45) return "growth";
    return "risk";
  }
  if (value >= 8) return "risk";
  if (value >= 4) return "growth";
  return "good";
}

function renderMatrix(rows) {
  const source = rows.length ? rows : rawRows;
  const pairs = [];
  REGIONS.forEach(region => {
    CHANNELS.forEach(channel => {
      const subset = source.filter(r => r.region === region && r.channel === channel);
      if (subset.length) {
        pairs.push({
          region, channel,
          education: avg(subset, metricEducation),
          usage: avg(subset, metricUsage),
          perception: avg(subset, metricPerception),
          performance: avg(subset, functionalPerformance)
        });
      }
    });
  });

  const top = pairs.slice(0, 28);
  $("matrixView").innerHTML = `
    <table class="matrix-table">
      <thead><tr><th>지역</th><th>채널</th><th>교육</th><th>활용</th><th>인식</th><th>성과</th></tr></thead>
      <tbody>
        ${top.map(p => `
          <tr>
            <td>${p.region}</td>
            <td>${p.channel}</td>
            <td><span class="cell-score ${tierClass(p.education)}">${pct(p.education)}</span></td>
            <td><span class="cell-score ${tierClass(p.usage)}">${pct(p.usage)}</span></td>
            <td><span class="cell-score ${tierClass(p.perception)}">${pct(p.perception)}</span></td>
            <td><span class="cell-score ${tierClass(p.performance)}">${pct(p.performance)}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderROI(rows) {
  const eduRows = rows.filter(r => metricEducation(r) >= 60);
  const noEduRows = rows.filter(r => metricEducation(r) < 60);
  const items = [
    ["난시", avg(eduRows, toricShare), avg(noEduRows, toricShare)],
    ["멀티포컬", avg(eduRows, mfShare), avg(noEduRows, mfShare)],
    ["MAX", avg(eduRows, maxShare), avg(noEduRows, maxShare)]
  ];

  $("roiView").innerHTML = items.map(([name, educated, notEducated]) => {
    const gap = educated - notEducated;
    return `
      <div class="roi-card">
        <span>${name} 비중</span>
        <strong>${pct(educated)}</strong>
        <small>교육 이수군 / 미이수군 ${pct(notEducated)}</small>
        <div class="roi-bar"><i style="width:${clamp(educated * 4)}%"></i></div>
        <p class="note">Gap ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}%p</p>
      </div>
    `;
  }).join("");
}

function metricRow(label, value, color = "") {
  return `
    <div class="metric-row">
      <span>${label}</span>
      <div class="bar ${color}"><i style="width:${clamp(value)}%"></i></div>
      <b>${pct(value)}</b>
    </div>
  `;
}

function renderDetail(rows) {
  const el = $("detailView");
  if (activeDetail === "education") {
    el.innerHTML = [
      metricRow("온라인 라이브", avg(rows, r => r.online), "green"),
      metricRow("온디맨드", avg(rows, r => r.ondemand), ""),
      metricRow("오프라인", avg(rows, r => r.offline), "amber")
    ].join("") + `<p class="note">교육 참여도는 세 교육 유형 평균으로 계산됩니다.</p>`;
  } else if (activeDetail === "usage") {
    el.innerHTML = [
      metricRow("스마트피팅", avg(rows, r => r.smartFitting), "green"),
      metricRow("AI 프로그램", avg(rows, r => r.aiProgram), ""),
      metricRow("시뮬레이터", avg(rows, r => r.simulator), "amber")
    ].join("");
  } else if (activeDetail === "perception") {
    el.innerHTML = [
      metricRow("멀티포컬 피팅 자신감", avg(rows, r => r.mfConfidence) / 5 * 100, "green"),
      metricRow("피팅 시간 단축 인식", avg(rows, r => r.timeSaving) / 5 * 100, ""),
      metricRow("난시 ASD 인식", avg(rows, r => r.asdAwareness) / 5 * 100, "amber"),
      metricRow("블루라이트 인식", avg(rows, r => r.blueAwareness) / 5 * 100, ""),
      metricRow("아큐브 추천 의향", avg(rows, r => r.acuvueRecommend) / 5 * 100, "green")
    ].join("");
  } else if (activeDetail === "performance") {
    el.innerHTML = [
      metricRow("난시 판매 비중", avg(rows, toricShare), "green"),
      metricRow("멀티포컬 판매 비중", avg(rows, mfShare), ""),
      metricRow("MAX 판매 비중", avg(rows, maxShare), "amber"),
      metricRow("전년 대비 성과", avg(rows, r => functionalPerformance(r) - lastFunctionalPerformance(r)) + 50, "")
    ].join("") + `<p class="note">전년 대비 성과는 50%를 기준선으로 표시합니다. 50% 초과는 전년 대비 개선을 의미합니다.</p>`;
  } else {
    el.innerHTML = `
      <div class="comp-grid">
        <div class="comp-card"><span>알콘</span><strong>${sum(rows, r => r.alcon).toLocaleString("ko-KR")}</strong></div>
        <div class="comp-card"><span>쿠퍼</span><strong>${sum(rows, r => r.cooper).toLocaleString("ko-KR")}</strong></div>
        <div class="comp-card"><span>바슈롬</span><strong>${sum(rows, r => r.bausch).toLocaleString("ko-KR")}</strong></div>
      </div>
      <p class="note">경쟁사 활동은 안경원 단위가 아니라 지역 단위 공개 게시글 모니터링으로 해석하는 것이 적합합니다.</p>
    `;
  }
}

function renderTable(rows) {
  const nationalPerf = avg(rawRows, functionalPerformance);
  $("storeTable").innerHTML = rows.slice(0, 300).map(r => {
    const recs = recommendForRow(r);
    const [cls, label] = classifyGroup([r]);
    const perf = functionalPerformance(r);
    return `
      <tr>
        <td>${r.code}</td>
        <td>${r.store}</td>
        <td>${r.region}</td>
        <td>${r.channel}</td>
        <td>${r.years}</td>
        <td>${pct(metricEducation(r))}</td>
        <td>${pct(metricUsage(r))}</td>
        <td>${score(avgPerceptionScore(r))}</td>
        <td>${pct(perf)} <small>${perf >= nationalPerf ? "평균↑" : "평균↓"}</small></td>
        <td>${recs[0] ? `${recs[0].code} ${recs[0].name}` : "-"}</td>
        <td><span class="pill ${cls}">${label}</span></td>
      </tr>
    `;
  }).join("");
}

function parseUploadedWorkbook(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: "array" });
    const sheets = {};
    wb.SheetNames.forEach(name => {
      sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
    });

    if (sheets.Account_Master && sheets.Sales_Performance) {
      loadStructuredWorkbook(sheets);
    } else {
      loadFlatSheet(sheets[wb.SheetNames[0]] || []);
    }

    setStatus(file.name);
    renderAll();
    loadCompetitorCsv();
  };
  reader.readAsArrayBuffer(file);
}

function loadStructuredWorkbook(sheets) {
  const master = sheets.Account_Master || [];
  const edu = indexBy(sheets.Education_History || [], "안경원코드");
  const usage = indexBy(sheets.Program_Usage || [], "안경원코드");
  const sales = indexBy(sheets.Sales_Performance || [], "안경원코드");
  const perception = indexBy(sheets.Perception || [], "안경원코드");

  if (sheets.Education_Master) {
    educationMaster = sheets.Education_Master.map(x => ({
      code: x["교육코드"], name: x["교육명"], purpose: x["목적"], condition: x["대상조건"], priority: Number(x["우선순위"] || 9)
    })).filter(x => x.code);
  }

  rawRows = master.map(m => {
    const code = m["안경원코드"];
    const e = edu.get(code) || {};
    const u = usage.get(code) || {};
    const s = sales.get(code) || {};
    const p = perception.get(code) || {};
    return {
      code,
      store: m["안경원명"] || "",
      region: m["지역"] || "",
      channel: m["채널"] || "",
      years: toYearBucket(m["연차"]),
      manager: m["담당자"] || "",
      online: yn(e["온라인라이브완료"]) ? 100 : 0,
      ondemand: yn(e["온디맨드완료"]) ? 100 : 0,
      offline: yn(e["오프라인완료"]) ? 100 : 0,
      smartFitting: yn(u["스마트피팅"]) ? 100 : 0,
      aiProgram: yn(u["AI프로그램"]) ? 100 : 0,
      simulator: yn(u["시뮬레이터"]) ? 100 : 0,
      totalSales: Number(s["전체렌즈판매"] || 0),
      toricSales: Number(s["난시판매"] || 0),
      mfSales: Number(s["멀티포컬판매"] || 0),
      maxSales: Number(s["맥스판매"] || 0),
      lastTotalSales: Number(s["전년동기전체"] || 0),
      lastToricSales: Number(s["전년동기난시"] || 0),
      lastMfSales: Number(s["전년동기멀티포컬"] || 0),
      lastMaxSales: Number(s["전년동기맥스"] || 0),
      mfConfidence: Number(p["멀티포컬피팅자신감"] || 0),
      timeSaving: Number(p["피팅시간단축인식"] || 0),
      asdAwareness: Number(p["난시ASD인식"] || 0),
      blueAwareness: Number(p["블루라이트인식"] || 0),
      acuvueRecommend: Number(p["아큐브추천의향"] || 0),
      alcon: 0, cooper: 0, bausch: 0
    };
  }).filter(r => r.code);
}

function loadFlatSheet(rows) {
  rawRows = rows.map((r, i) => ({
    code: r["안경원코드"] || r.code || `UP${i + 1}`,
    store: r["안경원명"] || r.store || "",
    region: r["지역"] || r.region || "서울",
    channel: r["채널"] || r.channel || "다비치",
    years: toYearBucket(r["연차"] || r.years || "0~3년"),
    manager: r["담당자"] || r.manager || "",
    online: Number(r["온라인"] || r.online || 0),
    ondemand: Number(r["온디맨드"] || r.ondemand || 0),
    offline: Number(r["오프라인"] || r.offline || 0),
    smartFitting: Number(r["스마트피팅"] || r.smartFitting || 0),
    aiProgram: Number(r["AI프로그램"] || r.aiProgram || 0),
    simulator: Number(r["시뮬레이터"] || r.simulator || 0),
    totalSales: Number(r["전체렌즈판매"] || r.totalSales || 0),
    toricSales: Number(r["난시판매"] || r.toricSales || 0),
    mfSales: Number(r["멀티포컬판매"] || r.mfSales || 0),
    maxSales: Number(r["맥스판매"] || r.maxSales || 0),
    lastTotalSales: Number(r["전년동기전체"] || r.lastTotalSales || 0),
    lastToricSales: Number(r["전년동기난시"] || r.lastToricSales || 0),
    lastMfSales: Number(r["전년동기멀티포컬"] || r.lastMfSales || 0),
    lastMaxSales: Number(r["전년동기맥스"] || r.lastMaxSales || 0),
    mfConfidence: Number(r["멀티포컬피팅자신감"] || r.mfConfidence || 0),
    timeSaving: Number(r["피팅시간단축인식"] || r.timeSaving || 0),
    asdAwareness: Number(r["난시ASD인식"] || r.asdAwareness || 0),
    blueAwareness: Number(r["블루라이트인식"] || r.blueAwareness || 0),
    acuvueRecommend: Number(r["아큐브추천의향"] || r.acuvueRecommend || 0),
    alcon: Number(r["알콘"] || r.alcon || 0),
    cooper: Number(r["쿠퍼"] || r.cooper || 0),
    bausch: Number(r["바슈롬"] || r.bausch || 0)
  }));
}

function indexBy(rows, key) {
  const map = new Map();
  rows.forEach(r => map.set(r[key], r));
  return map;
}

function toYearBucket(v) {
  const s = String(v ?? "");
  const n = Number(s.replace(/[^0-9]/g, ""));
  if (s.includes("0~3") || s.includes("신규")) return "0~3년";
  if (s.includes("4~7")) return "4~7년";
  if (s.includes("8~15")) return "8~15년";
  if (s.includes("15")) return "15년+";
  if (!Number.isFinite(n)) return "0~3년";
  if (n <= 3) return "0~3년";
  if (n <= 7) return "4~7년";
  if (n <= 15) return "8~15년";
  return "15년+";
}

async function loadCompetitorCsv() {
  try {
    const res = await fetch("./output/Competitor_Activity.csv?ts=" + Date.now());
    if (!res.ok) throw new Error("No competitor csv");
    const text = await res.text();
    const rows = parseCsv(text);
    competitorActivity = rows;
    applyCompetitorByRegion(rows);
    renderAll();
  } catch (e) {
    console.warn("Competitor CSV not loaded", e);
  }
}

function applyCompetitorByRegion(rows) {
  const regionMap = new Map();
  rows.forEach(r => {
    const region = r["지역"] || r.region;
    const total = Number(r["알콘"] || 0) + Number(r["쿠퍼"] || 0) + Number(r["바슈롬"] || 0);
    const prev = regionMap.get(region) || { alcon: 0, cooper: 0, bausch: 0 };
    prev.alcon += Number(r["알콘"] || 0);
    prev.cooper += Number(r["쿠퍼"] || 0);
    prev.bausch += Number(r["바슈롬"] || 0);
    regionMap.set(region, prev);
  });

  rawRows = rawRows.map(r => {
    const c = regionMap.get(r.region);
    if (!c) return r;
    return { ...r, alcon: c.alcon, cooper: c.cooper, bausch: c.bausch };
  });
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(x => x.replace(/^\ufeff/, "").trim());
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? "");
    return obj;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i+1] === '"' && q) { cur += '"'; i++; }
    else if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function downloadCsv(name, rows) {
  const headers = ["안경원코드","안경원명","지역","채널","연차","추천교육코드","추천교육명","추천사유","교육참여도","프로그램활용도","인식점수","기능성렌즈성과"];
  const lines = [headers.join(",")];
  rows.forEach(r => {
    const recs = recommendForRow(r);
    if (recs.length === 0) return;
    recs.forEach(rec => {
      lines.push([
        r.code, r.store, r.region, r.channel, r.years, rec.code, rec.name, rec.reason,
        pct(metricEducation(r)), pct(metricUsage(r)), score(avgPerceptionScore(r)), pct(functionalPerformance(r))
      ].map(v => `"${String(v).replaceAll('"','""')}"`).join(","));
    });
  });
  download(name, "\ufeff" + lines.join("\n"));
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type:"text/csv;charset=utf-8"}));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildFlatCsvTemplate() {
  const headers = ["안경원코드","안경원명","지역","채널","연차","온라인","온디맨드","오프라인","스마트피팅","AI프로그램","시뮬레이터","전체렌즈판매","난시판매","멀티포컬판매","맥스판매","전년동기전체","전년동기난시","전년동기멀티포컬","전년동기맥스","멀티포컬피팅자신감","피팅시간단축인식","난시ASD인식","블루라이트인식","아큐브추천의향"];
  const sample = rawRows.slice(0, 20);
  const lines = [headers.join(",")];
  sample.forEach(r => {
    lines.push([r.code,r.store,r.region,r.channel,r.years,r.online,r.ondemand,r.offline,r.smartFitting,r.aiProgram,r.simulator,r.totalSales,r.toricSales,r.mfSales,r.maxSales,r.lastTotalSales,r.lastToricSales,r.lastMfSales,r.lastMaxSales,r.mfConfidence,r.timeSaving,r.asdAwareness,r.blueAwareness,r.acuvueRecommend].join(","));
  });
  download("ACUVUE_Dashboard_V3_flat_template.csv", "\ufeff" + lines.join("\n"));
}

function initFilters() {
  const regionFilter = $("regionFilter");
  const channelFilter = $("channelFilter");
  REGIONS.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    regionFilter.appendChild(opt);
  });
  CHANNELS.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    channelFilter.appendChild(opt);
  });
}

function bindEvents() {
  ["searchBox", "regionFilter", "channelFilter", "yearFilter"].forEach(id => {
    $(id).addEventListener("input", renderAll);
  });
  $("clearBtn").addEventListener("click", () => {
    $("searchBox").value = "";
    $("regionFilter").value = "all";
    $("channelFilter").value = "all";
    $("yearFilter").value = "all";
    renderAll();
  });
  $("resetBtn").addEventListener("click", () => {
    seedSampleData();
    renderAll();
    loadCompetitorCsv();
  });
  $("fileInput").addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) parseUploadedWorkbook(file);
  });
  $("downloadTemplate").addEventListener("click", buildFlatCsvTemplate);
  $("downloadRecommended").addEventListener("click", () => downloadCsv("추천교육대상.csv", filteredRows()));
  $("exportFiltered").addEventListener("click", () => downloadCsv("현재필터_추천교육대상.csv", filteredRows()));
  document.querySelectorAll("#detailTabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#detailTabs .tab").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      activeDetail = btn.dataset.tab;
      renderDetail(filteredRows());
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  seedSampleData();
  bindEvents();
  renderAll();
  loadCompetitorCsv();
});
