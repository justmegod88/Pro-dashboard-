const regions = [
  { id: "gangwon", label: "강원", territory: "Gangwon", x: 66, y: 15 },
  { id: "seoul", label: "서울", territory: "Capital", x: 50, y: 29 },
  { id: "gyeonggi", label: "경기", territory: "Capital", x: 69, y: 28 },
  { id: "incheon", label: "인천", territory: "Capital", x: 37, y: 28 },
  { id: "chungnam", label: "충남", territory: "Chungcheong", x: 40, y: 45 },
  { id: "sejong", label: "세종", territory: "Chungcheong", x: 50, y: 44 },
  { id: "daejeon", label: "대전", territory: "Chungcheong", x: 53, y: 50 },
  { id: "chungbuk", label: "충북", territory: "Chungcheong", x: 58, y: 42 },
  { id: "jeonbuk", label: "전북", territory: "Honam", x: 45, y: 59 },
  { id: "gwangju", label: "광주", territory: "Honam", x: 45, y: 76 },
  { id: "jeonnam", label: "전남", territory: "Honam", x: 38, y: 70 },
  { id: "gyeongbuk", label: "경북", territory: "Southeast", x: 72, y: 53 },
  { id: "daegu", label: "대구", territory: "Southeast", x: 70, y: 59 },
  { id: "gyeongnam", label: "경남", territory: "Southeast", x: 66, y: 70 },
  { id: "ulsan", label: "울산", territory: "Southeast", x: 83, y: 65 },
  { id: "busan", label: "부산", territory: "Southeast", x: 79, y: 74 },
  { id: "jeju", label: "제주", territory: "Jeju", x: 18, y: 90 },
];

const aliases = {
  "서울":"seoul","서울특별시":"seoul","부산":"busan","부산광역시":"busan","대구":"daegu","대구광역시":"daegu","인천":"incheon","인천광역시":"incheon","광주":"gwangju","광주광역시":"gwangju","대전":"daejeon","대전광역시":"daejeon","울산":"ulsan","울산광역시":"ulsan","세종":"sejong","세종특별자치시":"sejong","경기":"gyeonggi","경기도":"gyeonggi","강원":"gangwon","강원도":"gangwon","강원특별자치도":"gangwon","충북":"chungbuk","충청북도":"chungbuk","충남":"chungnam","충청남도":"chungnam","전북":"jeonbuk","전라북도":"jeonbuk","전남":"jeonnam","전라남도":"jeonnam","경북":"gyeongbuk","경상북도":"gyeongbuk","경남":"gyeongnam","경상남도":"gyeongnam","제주":"jeju","제주도":"jeju","제주특별자치도":"jeju"
};

const sampleAccounts = [
  ["서울","오렌즈 강남점",1,1,0,1,1,1,12,8,0,0],
  ["서울","밝은눈 안경원",1,0,0,0,0,0,3,9,1,2],
  ["서울","프리미엄 렌즈샵",0,1,1,1,1,0,10,6,1,1],
  ["경기","수원 스마트안경",1,1,1,1,1,1,8,11,0,0],
  ["경기","분당 렌즈센터",1,0,0,0,0,0,2,7,1,3],
  ["경기","일산 안경원",0,0,0,0,0,0,1,3,1,1],
  ["인천","인천 렌즈존",1,0,0,0,1,0,4,5,1,4],
  ["부산","부산 센텀안경",1,1,0,1,1,0,7,4,1,1],
  ["부산","해운대 렌즈",0,1,0,0,0,0,2,3,1,5],
  ["대구","대구 중앙안경",0,0,0,0,0,0,0,2,1,5],
  ["대전","대전 스마트렌즈",1,1,1,1,1,1,6,8,0,0],
  ["광주","광주 렌즈클리닉",1,0,1,0,1,0,3,6,1,3],
  ["강원","춘천 안경원",0,1,0,0,0,0,0,2,1,1],
  ["충북","청주 안경원",1,1,0,1,1,0,5,4,0,1],
  ["충남","천안 안경원",1,0,0,0,0,0,2,3,1,2],
  ["전북","전주 렌즈샵",1,0,1,0,1,0,3,5,1,2],
  ["전남","목포 안경원",0,0,0,0,0,0,0,2,1,2],
  ["경북","포항 안경원",0,1,0,0,0,0,1,4,1,4],
  ["경남","창원 렌즈샵",1,1,0,1,1,0,7,5,0,1],
  ["울산","울산 안경원",1,0,0,0,0,0,2,2,1,2],
  ["제주","제주 렌즈",1,1,1,1,1,1,4,3,0,0]
];

let rows = [];
let selectedId = "seoul";
let metric = "educationCompletionRate";

function toNumber(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pct(v) {
  return `${Math.round((Number(v) || 0) * 100)}%`;
}

function truth(v) {
  return String(v ?? "").match(/1|Y|YES|TRUE|완료|참석|수료|사용|구매|주문|예|O/i) != null;
}

function normalizeRegion(v) {
  const key = String(v || "").replace(/\s+/g, "");
  return aliases[key] || aliases[key.slice(0, 2)] || "unknown";
}

function loadSample() {
  rows = sampleAccounts.map(([region, account, online, ondemand, offline, use, sample, buy, mf, toric, follow, comp]) => ({
    region,
    regionId: normalizeRegion(region),
    account,
    online: !!online,
    ondemand: !!ondemand,
    offline: !!offline,
    edu: !!(online || ondemand || offline),
    use: !!use,
    sample: !!sample,
    buy: !!buy,
    mf: toNumber(mf),
    toric: toNumber(toric),
    follow: !!follow,
    competitorEvents: toNumber(comp)
  }));

  const fileNameEl = document.getElementById("fileName");
  if (fileNameEl) fileNameEl.textContent = "샘플 데이터";
  render();
}

function aggregate() {
  const map = new Map(regions.map(r => [r.id, {
    ...r,
    accounts: 0,
    online: 0,
    ondemand: 0,
    offline: 0,
    edu: 0,
    use: 0,
    sample: 0,
    buy: 0,
    mf: 0,
    toric: 0,
    follow: 0,
    competitorEvents: 0,
    targetRows: []
  }]));

  rows.forEach(row => {
    const r = map.get(row.regionId);
    if (!r) return;

    r.accounts++;
    r.online += row.online ? 1 : 0;
    r.ondemand += row.ondemand ? 1 : 0;
    r.offline += row.offline ? 1 : 0;
    r.edu += row.edu ? 1 : 0;
    r.use += row.use ? 1 : 0;
    r.sample += row.sample ? 1 : 0;
    r.buy += row.buy ? 1 : 0;
    r.mf += row.mf;
    r.toric += row.toric;
    r.follow += row.follow ? 1 : 0;
    r.competitorEvents += row.competitorEvents || 0;

    if (!row.edu || (row.edu && !row.use) || (row.use && !row.sample) || (row.sample && !row.buy) || row.follow || row.competitorEvents >= 3) {
      r.targetRows.push(row);
    }
  });

  [...map.values()].forEach(r => {
    r.educationCompletionRate = r.accounts ? r.edu / r.accounts : 0;
    r.onlineCompletionRate = r.accounts ? r.online / r.accounts : 0;
    r.ondemandCompletionRate = r.accounts ? r.ondemand / r.accounts : 0;
    r.offlineCompletionRate = r.accounts ? r.offline / r.accounts : 0;
    r.activationRate = r.edu ? r.use / r.edu : 0;
    r.sampleRate = r.use ? r.sample / r.use : 0;
    r.conversionRate = r.sample ? r.buy / r.sample : 0;
    r.mfShare = r.mf / Math.max(1, r.mf + r.toric);
    r.toricShare = r.toric / Math.max(1, r.mf + r.toric);
    r.priorityScore = (1 - r.educationCompletionRate) * 0.22 + (1 - r.activationRate) * 0.28 + (1 - r.sampleRate) * 0.18 + (1 - r.conversionRate) * 0.17 + Math.min(r.competitorEvents / 5, 1) * 0.15;
    r.priority = r.priorityScore >= 0.58 ? "A" : r.priorityScore >= 0.34 ? "B" : "C";
  });

  return map;
}

function tier(value, values) {
  const max = Math.max(...values, 0.01);
  const ratio = value / max;
  if (ratio >= 0.67) return "high";
  if (ratio >= 0.34) return "mid";
  return "low";
}

function renderMap(summary) {
  const el = document.getElementById("koreaMap");
  if (!el) return;

  el.innerHTML = `<div class="map-canvas"><img class="reference-map-image" src="./assets/korea-region-reference.jpeg" alt="대한민국 광역시별 지도"></div>`;
  const canvas = el.querySelector(".map-canvas");
  const vals = [...summary.values()].map(r => r[metric] || 0);

  regions.forEach(base => {
    const r = summary.get(base.id);
    const value = r?.[metric] || 0;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `map-marker ${tier(value, vals)} ${selectedId === base.id ? "active" : ""}`;
    btn.style.left = `${base.x}%`;
    btn.style.top = `${base.y}%`;
    btn.innerHTML = `<strong>${base.label}</strong><span>${metric === "competitorEvents" ? Math.round(value) + "건" : pct(value)}</span>`;
    btn.onclick = () => {
      selectedId = base.id;
      render();
    };
    canvas.appendChild(btn);
  });
}

function recommendation(r) {
  if (!r.accounts) return "업로드 데이터에 해당 지역 계정이 없습니다. 우선 지역/안경원 매핑부터 보강하세요.";
  if (r.educationCompletionRate < 0.45) return "교육 접점 자체가 부족합니다. 온라인 라이브 초대와 온디맨드 발송을 먼저 늘리고, 핵심 안경원은 오프라인 교육으로 보강하세요.";
  if (r.activationRate < 0.45 && r.educationCompletionRate >= 0.65) return "교육은 되었지만 스마트피팅 사용으로 이어지지 않았습니다. 사용법 리마인드와 샘플 주문 동선을 우선 점검하세요.";
  if (r.sampleRate < 0.50 && r.activationRate >= 0.55) return "스마트피팅 사용 후 샘플 주문 전환이 낮습니다. 바코드 주문/샘플 신청 프로세스를 짧게 안내하세요.";
  if (r.conversionRate < 0.45 && r.sampleRate >= 0.55) return "샘플은 나갔지만 구매 전환이 낮습니다. 상담 스크립트, 소비자 프로모션, 후기 이벤트를 묶어 Follow-up 하세요.";
  if (r.competitorEvents >= 4) return "경쟁사 활동이 많은 지역입니다. 행사 유형을 확인하고 ACUVUE 차별점 콘텐츠를 빠르게 배포하세요.";
  return "현재 흐름은 양호합니다. 성공 안경원의 교육→사용→샘플→구매 패턴을 다른 지역에 복제하세요.";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderDetail(summary) {
  const r = summary.get(selectedId) || [...summary.values()][0];

  setText("selectedTerritory", r.territory);
  setText("selectedRegion", r.label);
  setText("selectedRead", `${r.accounts}개 계정 · Priority ${r.priority}`);
  setText("educationRate", pct(r.educationCompletionRate));
  setText("detailOnlineRate", pct(r.onlineCompletionRate));
  setText("detailOndemandRate", pct(r.ondemandCompletionRate));
  setText("detailOfflineRate", pct(r.offlineCompletionRate));
  setText("activationRate", pct(r.activationRate));
  setText("sampleRate", pct(r.sampleRate));
  setText("conversionRate", pct(r.conversionRate));
  setText("competitorEvents", `${r.competitorEvents}건`);

  const max = Math.max(r.edu, r.use, r.sample, r.buy, 1);
  [["barEdu", r.edu], ["barUse", r.use], ["barSample", r.sample], ["barBuy", r.buy]].forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.max(4, v / max * 100)}%`;
  });

  setText("barEduLabel", r.edu);
  setText("barUseLabel", r.use);
  setText("barSampleLabel", r.sample);
  setText("barBuyLabel", r.buy);
  setText("recommendation", recommendation(r));
  setText("targetMeta", `${r.targetRows.length}개`);

  const targetList = document.getElementById("targetList");
  if (targetList) {
    targetList.innerHTML = r.targetRows.slice(0, 8).map(a => `
      <div class="target-item">
        <strong>${a.account}</strong>
        <small>${a.region} · ${a.online ? "온라인" : "온라인X"} · ${a.ondemand ? "온디맨드" : "온디맨드X"} · ${a.offline ? "오프라인" : "오프라인X"} · ${a.use ? "사용" : "미사용"} · ${a.sample ? "샘플" : "샘플X"} · ${a.buy ? "구매" : "미구매"}</small>
        <div class="target-tags">
          ${!a.edu ? "<span>교육 필요</span>" : ""}
          ${a.edu && !a.use ? "<span>사용 유도</span>" : ""}
          ${a.use && !a.sample ? "<span>샘플 유도</span>" : ""}
          ${a.sample && !a.buy ? "<span>전환 관리</span>" : ""}
          ${a.competitorEvents >= 3 ? "<span>경쟁사 대응</span>" : ""}
        </div>
      </div>
    `).join("") || `<div class="target-item"><strong>우선 관리 계정 없음</strong><small>현재 기준 특이 리스크가 낮습니다.</small></div>`;
  }
}

function renderSummary(summary) {
  const vals = [...summary.values()];
  const accounts = vals.reduce((s, r) => s + r.accounts, 0);
  const edu = vals.reduce((s, r) => s + r.edu, 0);
  const online = vals.reduce((s, r) => s + r.online, 0);
  const ondemand = vals.reduce((s, r) => s + r.ondemand, 0);
  const offline = vals.reduce((s, r) => s + r.offline, 0);
  const use = vals.reduce((s, r) => s + r.use, 0);
  const sample = vals.reduce((s, r) => s + r.sample, 0);
  const buy = vals.reduce((s, r) => s + r.buy, 0);
  const follow = vals.reduce((s, r) => s + r.follow, 0);

  setText("totalEducationRate", pct(edu / Math.max(1, accounts)));
  setText("totalActivationRate", pct(use / Math.max(1, edu)));
  setText("nationalConversion", pct(buy / Math.max(1, sample)));
  setText("totalFollowup", follow.toLocaleString("ko-KR"));
  setText("onlineRate", pct(online / Math.max(1, accounts)));
  setText("ondemandRate", pct(ondemand / Math.max(1, accounts)));
  setText("offlineRate", pct(offline / Math.max(1, accounts)));
  setText("notEducatedCount", Math.max(0, accounts - edu).toLocaleString("ko-KR"));

  const worst = vals.filter(r => r.accounts).sort((a, b) => b.priorityScore - a.priorityScore)[0];
  setText("autoInsight", worst ? `${worst.label} 지역은 Priority ${worst.priority}입니다. ${recommendation(worst)}` : "데이터를 업로드하면 지역별 인사이트가 자동 생성됩니다.");
}

function renderTable(summary) {
  const body = document.getElementById("regionTable");
  if (!body) return;

  body.innerHTML = [...summary.values()].sort((a, b) => b.priorityScore - a.priorityScore).map(r => `
    <tr data-id="${r.id}">
      <td>${r.label}</td>
      <td>${r.accounts}</td>
      <td>${pct(r.educationCompletionRate)}</td>
      <td>${pct(r.onlineCompletionRate)}</td>
      <td>${pct(r.ondemandCompletionRate)}</td>
      <td>${pct(r.offlineCompletionRate)}</td>
      <td>${pct(r.activationRate)}</td>
      <td>${pct(r.sampleRate)}</td>
      <td>${pct(r.conversionRate)}</td>
      <td>${r.competitorEvents}건</td>
      <td><span class="priority ${r.priority.toLowerCase()}">${r.priority}</span></td>
    </tr>
  `).join("");

  body.querySelectorAll("tr").forEach(tr => {
    tr.onclick = () => {
      selectedId = tr.dataset.id;
      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    };
  });
}

function render() {
  const summary = aggregate();
  renderSummary(summary);
  renderMap(summary);
  renderDetail(summary);
  renderTable(summary);
}

function parseWorkbook(file) {
  const reader = new FileReader();

  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

    rows = json.map(o => {
      const region = o["지역"] ?? o["Region"] ?? o["시도"] ?? "";
      const online = truth(o["온라인라이브완료"] ?? o["온라인교육완료"] ?? o["OnlineLiveCompleted"] ?? o["Online"]);
      const ondemand = truth(o["온디맨드완료"] ?? o["온디맨드교육완료"] ?? o["OnDemandCompleted"] ?? o["OnDemand"]);
      const offline = truth(o["오프라인완료"] ?? o["오프라인교육완료"] ?? o["OfflineCompleted"] ?? o["Offline"]);
      const edu = online || ondemand || offline || truth(o["교육완료"] ?? o["EducationCompleted"]);

      return {
        region,
        regionId: normalizeRegion(region),
        account: o["안경원명"] ?? o["Account"] ?? o["거래처"] ?? "미입력",
        online,
        ondemand,
        offline,
        edu,
        use: truth(o["스마트피팅사용"] ?? o["SmartFittingUsed"]),
        sample: truth(o["샘플주문"] ?? o["SampleOrdered"] ?? o["Sample"]),
        buy: truth(o["구매전환"] ?? o["Purchased"]),
        mf: toNumber(o["멀티포컬"] ?? o["MF"]),
        toric: toNumber(o["난시"] ?? o["Toric"]),
        follow: truth(o["FollowUp필요"] ?? o["FollowUp"]),
        competitorEvents: toNumber(o["경쟁사활동"] ?? o["CompetitorEvents"])
      };
    });

    const fileNameEl = document.getElementById("fileName");
    if (fileNameEl) fileNameEl.textContent = file.name;

    selectedId = rows[0]?.regionId && rows[0].regionId !== "unknown" ? rows[0].regionId : "seoul";
    render();
    loadCompetitorActivityFromGitHub();
  };

  reader.readAsArrayBuffer(file);
}

async function loadCompetitorActivityFromGitHub() {
  try {
    const res = await fetch("./output/Competitor_Activity.csv?ts=" + Date.now());
    if (!res.ok) throw new Error("Competitor_Activity.csv not found");

    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("Competitor_Activity.csv has no data rows");

    const headers = splitCsvLine(lines[0]).map(h => h.trim().replace(/^\ufeff/, ""));
    const activityRows = lines.slice(1).map(line => {
      const cols = splitCsvLine(line).map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = cols[i] ?? "");
      return obj;
    });

    const byRegion = new Map();

    activityRows.forEach(a => {
      const regionId = normalizeRegion(a["지역"]);
      if (!regionId || regionId === "unknown") return;

      const total = toNumber(a["알콘"]) + toNumber(a["쿠퍼"]) + toNumber(a["바슈롬"]);
      byRegion.set(regionId, (byRegion.get(regionId) || 0) + total);
    });

    rows = rows.map(r => ({
      ...r,
      competitorEvents: byRegion.has(r.regionId) ? byRegion.get(r.regionId) : r.competitorEvents
    }));

    render();
    console.log("Competitor activity loaded", activityRows);
  } catch (err) {
    console.warn("Competitor activity auto-load failed:", err);
  }
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

function downloadTemplate() {
  const header = ["지역", "안경원명", "온라인라이브완료", "온디맨드완료", "오프라인완료", "스마트피팅사용", "샘플주문", "구매전환", "멀티포컬", "난시", "FollowUp필요", "경쟁사활동"];
  const lines = [header.join(","), ...sampleAccounts.map(r => r.join(","))];
  download("acuvue_education_activation_template.csv", "\ufeff" + lines.join("\n"));
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadResult() {
  const summary = aggregate();
  const header = ["지역", "계정수", "통합교육완료율", "온라인라이브완료율", "온디맨드완료율", "오프라인완료율", "스마트피팅사용률", "샘플주문률", "샘플구매전환율", "멀티포컬비중", "난시비중", "경쟁사활동", "Priority"];
  const lines = [header.join(","), ...[...summary.values()].map(r => [
    r.label,
    r.accounts,
    pct(r.educationCompletionRate),
    pct(r.onlineCompletionRate),
    pct(r.ondemandCompletionRate),
    pct(r.offlineCompletionRate),
    pct(r.activationRate),
    pct(r.sampleRate),
    pct(r.conversionRate),
    pct(r.mfShare),
    pct(r.toricShare),
    r.competitorEvents,
    r.priority
  ].join(","))];

  download("acuvue_education_activation_result.csv", "\ufeff" + lines.join("\n"));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("excelFile")?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) parseWorkbook(file);
  });

  document.getElementById("loadSample")?.addEventListener("click", () => {
    loadSample();
    loadCompetitorActivityFromGitHub();
  });

  document.getElementById("downloadTemplate")?.addEventListener("click", downloadTemplate);
  document.getElementById("downloadCsv")?.addEventListener("click", downloadResult);

  document.getElementById("metricSelect")?.addEventListener("change", e => {
    metric = e.target.value;
    render();
  });

  loadSample();
  loadCompetitorActivityFromGitHub();
});
