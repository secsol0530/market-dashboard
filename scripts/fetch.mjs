// scripts/fetch.mjs
// Node 18+ (전역 fetch 사용). GitHub Actions에서 주기적으로 실행되어
// data/briefing.json 을 갱신합니다. 해석 없이 수치만 수집하는 규칙기반 스크립트입니다.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const config = JSON.parse(await readFile(path.join(ROOT, "config.json"), "utf-8"));

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { "User-Agent": "Mozilla/5.0", ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchIndices() {
  const url = "https://polling.finance.naver.com/api/realtime/domestic/index/KOSPI,KOSDAQ";
  try {
    const json = await fetchJson(url);
    const datas = json?.result?.areas?.[0]?.datas ?? [];
    return datas.map((d) => ({
      code: d.cd,
      name: d.nm ?? d.cd,
      value: Number(d.nv) / 100 || Number(d.nv),
      change: Number(d.cv) / 100 || Number(d.cv),
      changeRate: Number(d.cr),
      direction: d.rf === "5" ? "flat" : d.rf === "2" ? "up" : "down",
    }));
  } catch (e) {
    return [{ error: String(e) }];
  }
}

async function fetchStock(code) {
  const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`;
  try {
    const json = await fetchJson(url);
    const d = json?.result?.areas?.[0]?.datas?.[0];
    if (!d) return { code, error: "no-data" };
    return {
      code,
      name: config.stockNames[code] ?? code,
      price: Number(d.nv),
      change: Number(d.cv),
      changeRate: Number(d.cr),
    };
  } catch (e) {
    return { code, name: config.stockNames[code] ?? code, error: String(e) };
  }
}

async function fetchSectors() {
  const out = {};
  for (const [sector, codes] of Object.entries(config.sectors)) {
    out[sector] = await Promise.all(codes.map(fetchStock));
  }
  return out;
}

async function fetchFx() {
  try {
    const json = await fetchJson("https://open.er-api.com/v6/latest/USD");
    const r = json.rates;
    const usdKrw = r.KRW;
    const usdVnd = r.VND;
    const usdJpy = r.JPY;
    return {
      usdKrw,
      usdVnd,
      usdJpy,
      jpyKrwPer100: (usdKrw / usdJpy) * 100,
      vndKrwPer1000: (usdKrw / usdVnd) * 1000,
      source: "open.er-api.com",
      note: "은행 매매기준율과 소폭 차이 있을 수 있음(중간환율 기준)",
    };
  } catch (e) {
    return { error: String(e) };
  }
}

function classify(list) {
  const up = list.filter((s) => s.changeRate > 0);
  const down = list.filter((s) => s.changeRate < 0);
  return { up, down };
}

async function main() {
  const [indices, sectors, fx] = await Promise.all([fetchIndices(), fetchSectors(), fetchFx()]);

  const sectorSummary = {};
  for (const [name, list] of Object.entries(sectors)) {
    const valid = list.filter((s) => !s.error);
    const { up, down } = classify(valid);
    sectorSummary[name] = {
      constituents: list,
      upCount: up.length,
      downCount: down.length,
      avgChangeRate: valid.length ? valid.reduce((a, s) => a + s.changeRate, 0) / valid.length : null,
    };
  }

  const briefing = {
    generatedAtUtc: new Date().toISOString(),
    disclaimer: "규칙기반 자동 수집 데이터입니다. 원인 분석·전략 해석은 포함하지 않습니다. 투자 조언 아님.",
    indices,
    fx,
    sectors: sectorSummary,
  };

  await mkdir(path.join(ROOT, "data"), { recursive: true });
  await writeFile(path.join(ROOT, "data", "briefing.json"), JSON.stringify(briefing, null, 2), "utf-8");
  console.log("briefing.json 갱신 완료:", briefing.generatedAtUtc);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
