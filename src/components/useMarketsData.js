import { useState, useEffect } from "react";

export const API = "http://localhost:8000";

export const SECTOR = {
  RELIANCE: "Energy", ONGC: "Energy", COALINDIA: "Energy", POWERGRID: "Power", NTPC: "Power", RPOWER: "Power",
  TCS: "IT", INFY: "IT", WIPRO: "IT", HCLTECH: "IT",
  HDFCBANK: "Banking", ICICIBANK: "Banking", SBIN: "Banking", KOTAKBANK: "Banking", AXISBANK: "Banking", YESBANK: "Banking",
  BAJFINANCE: "Finance", HINDUNILVR: "FMCG", NESTLEIND: "FMCG", ASIANPAINT: "Consumer", TITAN: "Consumer",
  MARUTI: "Auto", TATAMOTORS: "Auto", SUNPHARMA: "Pharma", LT: "Infra", ADANIENT: "Infra",
  JSWSTEEL: "Metals", TATASTEEL: "Metals", HINDALCO: "Metals", IDEA: "Telecom",
};

export const inr = (n, d = 2) =>
  Number(n).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

const get = async (path) => {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
};

/* Live indices + 29 stocks. Refreshes every 30s, keeps last data if API drops. */
export function useMarketsData() {
  const [indices, setIndices] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      let ix = await Promise.allSettled([get("/market/indices")]);
      if (ix[0].status !== "fulfilled" || !(ix[0].value.indices || []).length)
        ix = await Promise.allSettled([get("/indices")]);
      const st = await Promise.allSettled([get("/stocks")]);
      if (!alive) return;
      let ok = false;
      if (ix[0].status === "fulfilled" && (ix[0].value.indices || []).length) {
        setIndices(ix[0].value.indices.map((x) => ({
          key: x.key || String(x.name).replace(/\s+50$/, "").replace(/\s/g, "").toUpperCase(),
          name: x.name, value: Number(x.value), change: Number(x.change), pct: Number(x.change_pct),
        })));
        ok = true;
      }
      if (st[0].status === "fulfilled") {
        const list = (st[0].value.stocks || []).filter((s) => Number(s.price) > 0).map((s) => ({
          symbol: s.symbol, name: s.name, price: Number(s.price), change: Number(s.change),
          pct: Number(s.change_pct), high: Number(s.high), low: Number(s.low),
          prev: Number(s.prev_close), volume: Number(s.volume), sector: SECTOR[s.symbol] || "Other",
        }));
        if (list.length) { setStocks(list); ok = true; }
      }
      setStatus(ok ? "live" : "offline");
      if (ok) setUpdated(new Date());
    };
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return { indices, stocks, status, updated };
}

/* Index chart: open/high/low/close + points for a range */
export function useIndexChart(key, range) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    setData(null); setErr(false);
    get(`/market/index/${key}?range=${range}`)
      .then((d) => alive && setData(d))
      .catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [key, range]);
  return { data, err };
}

/* Generic loader for the extra tabs (commodities, news) */
export function useExtra(path, enabled = true) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const go = () => get(path).then((d) => alive && (setData(d), setErr(false))).catch(() => alive && setErr(true));
    go();
    const id = setInterval(go, 60000);
    return () => { alive = false; clearInterval(id); };
  }, [path, enabled]);
  return { data, err };
}

/* Day open/high/low for every index (used by Index F&O and All Indices) */
export function useAllIndexDays(keys, enabled) {
  const [days, setDays] = useState({});
  useEffect(() => {
    if (!enabled || !keys.length) return;
    let alive = true;
    keys.forEach((k) => get(`/market/index/${k}?range=1d`).then((d) => alive && setDays((p) => ({ ...p, [k]: d }))).catch(() => {}));
    return () => { alive = false; };
  }, [enabled, keys.join(",")]); // eslint-disable-line
  return days;
}