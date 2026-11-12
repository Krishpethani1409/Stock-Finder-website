// ============================================================
//  ScreenerResult.jsx  →  src/Pages/ScreenerResult.jsx
//  screener.in-style company page, Stock Finder colours + fonts,
//  100% live data from your backend (screener_api.py):
//     GET /screener/{symbol}            full page
//     GET /screener/{symbol}/quote      price (polled every 30s)
//     GET /screener/{symbol}/chart?range=
//  Route: /screener/:symbol
// ============================================================
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Navbar from "../components/Navbar.jsx";

const API = "http://localhost:8000";
const C = {
  bg: "#0b1220", card: "#111c31", card2: "#16233d", border: "#22304d",
  text: "#e8eefc", dim: "#8fa3c7", mute: "#5d7096",
  blue: "#3b82f6", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", purple: "#a855f7",
};
const SECTIONS = [
  ["overview", "Overview"], ["chart", "Chart"], ["peers", "Peers"], ["quarters", "Quarters"],
  ["profit-loss", "Profit & Loss"], ["balance-sheet", "Balance Sheet"], ["cash-flow", "Cash Flow"],
  ["ratios", "Ratios"], ["shareholding", "Shareholding"],
];
const RANGES = [["1m", "1M"], ["6m", "6M"], ["1y", "1Yr"], ["3y", "3Yr"], ["5y", "5Yr"], ["10y", "10Yr"], ["max", "Max"]];

const f2 = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const f0 = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 }));
const fx = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }));
const col = (n) => (n > 0 ? C.green : n < 0 ? C.red : C.dim);
const sign = (n) => (n > 0 ? "+" : n < 0 ? "-" : "");

async function getJson(path) {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(45000) });
  if (!r.ok) {
    let msg = "HTTP " + r.status;
    try { msg = (await r.json()).detail || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r.json();
}

export default function ScreenerResult() {
  const { symbol } = useParams();
  const sym = (symbol || "").toUpperCase();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [range, setRange] = useState("1y");
  const [chart, setChart] = useState(null);
  const [chartErr, setChartErr] = useState("");
  const [showVol, setShowVol] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [active, setActive] = useState("overview");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  /* full page data */
  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(""); setData(null); setQuote(null); setChart(null); setAboutOpen(false);
    getJson(`/screener/${sym}`)
      .then((d) => { if (alive) { setData(d); setQuote(d.quote); } })
      .catch((e) => alive && setErr(e.name === "TimeoutError" ? "The API took too long. Is the backend running?" : e.message === "Failed to fetch" ? "Cannot reach the backend. Run: uvicorn main:app --reload" : e.message))
      .finally(() => alive && setLoading(false));
    window.scrollTo(0, 0);
    return () => { alive = false; };
  }, [sym]);

  /* live price polling */
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => {
      getJson(`/screener/${sym}/quote`).then(setQuote).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [data, sym]);

  /* chart */
  useEffect(() => {
    if (!data) return;
    let alive = true;
    setChartErr("");
    getJson(`/screener/${sym}/chart?range=${range}`)
      .then((d) => alive && setChart(d.points))
      .catch((e) => { if (alive) { setChart([]); setChartErr(e.message); } });
    return () => { alive = false; };
  }, [data, sym, range]);

  /* scroll spy */
  useEffect(() => {
    const onScroll = () => {
      let cur = "overview";
      SECTIONS.forEach(([id]) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 170) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: "smooth" });
  };

  const search = () => { const v = q.trim().toUpperCase(); if (v) navigate(`/screener/${v}`); };

  const exportExcel = useCallback(async () => {
    if (!data) return;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const add = (name, t) => {
        if (!t || !t.rows.length) return;
        const aoa = [["₹ Crores", ...t.cols], ...t.rows.map((r) => [r.label, ...r.values])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
      };
      const r = data.ratios;
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        [data.name], ["Symbol", data.symbol], ["Price", quote?.price], ["Market Cap (Cr)", r.market_cap], ["P/E", r.pe],
        ["Book value", r.book_value], ["Dividend yield %", r.div_yield], ["ROE %", r.roe], ["ROCE %", r.roce], ["Debt/Equity", r.debt_to_equity],
      ]), "Summary");
      add("Quarterly", data.quarterly); add("Profit & Loss", data.yearly); add("Balance Sheet", data.balance);
      add("Cash Flow", data.cashflow); add("Ratios", data.ratios_year);
      XLSX.writeFile(wb, `${data.symbol}-StockFinder.xlsx`);
    } catch (e) {
      console.error(e); setToast("Excel failed. Run: npm install xlsx"); setTimeout(() => setToast(""), 3000);
    }
  }, [data, quote]);

  /* ------------------------------------------------------- */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        .sr-wrap{max-width:1180px;margin:0 auto;padding:0 20px}
        .sr-grid2{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px}
        .sr-ratios{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 20px}
        .sr-pc{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .sr-cagr{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .sr-scroll{overflow-x:auto}
        .sr-row:hover td{background:${C.card2}}
        .sr-pill{cursor:pointer;border:none;font-family:inherit;font-weight:600}
        .sr-pill:hover{filter:brightness(1.15)}
        .sr-nav::-webkit-scrollbar{display:none}
        @media(max-width:900px){.sr-grid2{grid-template-columns:1fr}.sr-ratios{grid-template-columns:repeat(2,1fr)}.sr-pc,.sr-cagr{grid-template-columns:1fr}}
        @keyframes srPulse{0%,100%{opacity:.5}50%{opacity:1}}
        .sr-skel{background:${C.card};border:1px solid ${C.border};border-radius:14px;animation:srPulse 1.4s infinite}
      `}</style>
      <Navbar />

      {/* ---------- sticky section nav ---------- */}
      <div style={{ position: "sticky", top: 93, zIndex: 60, background: C.bg + "f2", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="sr-wrap" style={{ display: "flex", alignItems: "center", gap: 14, height: 48 }}>
          <div className="sr-nav" style={{ display: "flex", gap: 2, overflowX: "auto", flex: 1 }}>
            {SECTIONS.map(([id, label]) => (
              <button key={id} className="sr-pill" onClick={() => go(id)} style={{
                background: active === id ? C.blue + "22" : "none", color: active === id ? C.blue : C.dim,
                padding: "8px 14px", borderRadius: 8, fontSize: 13, whiteSpace: "nowrap",
                borderBottom: active === id ? `2px solid ${C.blue}` : "2px solid transparent",
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search a company, e.g. TCS" style={{ width: 190, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button className="sr-pill" onClick={search} style={{ background: C.blue, color: "#fff", borderRadius: 8, padding: "0 14px", fontSize: 13 }}>Go</button>
          </div>
        </div>
      </div>

      <div className="sr-wrap" style={{ padding: "22px 20px 70px" }}>
        {loading && <Skeleton sym={sym} />}

        {!loading && err && (
          <div style={{ ...card, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <h2 style={{ margin: "10px 0 6px", fontFamily: "'Sora',sans-serif" }}>Couldn't load {sym}</h2>
            <p style={{ color: C.dim, margin: "0 auto 18px", maxWidth: 520 }}>{err}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["RELIANCE", "TCS", "INFY", "HDFCBANK", "SBIN", "TATASTEEL"].map((s) => (
                <button key={s} className="sr-pill" onClick={() => navigate(`/screener/${s}`)} style={{ background: C.card2, color: C.text, padding: "8px 14px", borderRadius: 8, fontSize: 13, border: `1px solid ${C.border}` }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ---------- HEADER ---------- */}
            <section id="overview" style={{ ...card, padding: 22, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Sora',sans-serif", letterSpacing: "-0.5px" }}>{data.name}</h1>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center", fontSize: 13 }}>
                    {data.website && <a href={data.website} target="_blank" rel="noreferrer" style={{ color: C.blue, textDecoration: "none" }}>{data.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗</a>}
                    <Chip>NSE: {data.symbol}</Chip>
                    {data.sector && <Chip>{data.sector}</Chip>}
                    {data.industry && <Chip>{data.industry}</Chip>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "'Sora',sans-serif" }}>₹{f2(quote.price)}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: col(quote.change), background: col(quote.change) + "18", padding: "3px 10px", borderRadius: 999 }}>
                      {sign(quote.change)}{f2(Math.abs(quote.change))} ({sign(quote.change_pct)}{f2(Math.abs(quote.change_pct))}%)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.mute, marginTop: 4 }}>
                    <span style={{ color: C.green }}>● LIVE</span> · updated {new Date(quote.updated_at).toLocaleTimeString("en-IN")}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button className="sr-pill" onClick={exportExcel} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, padding: "9px 14px", borderRadius: 8, fontSize: 12 }}>⬇ EXPORT TO EXCEL</button>
                    <button className="sr-pill" onClick={() => navigate("/tradeone")} style={{ background: C.blue, color: "#fff", padding: "9px 18px", borderRadius: 8, fontSize: 12 }}>TRADE</button>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------- RATIOS + ABOUT ---------- */}
            <div className="sr-grid2" style={{ marginBottom: 16 }}>
              <div style={{ ...card, padding: 22 }}>
                <div className="sr-ratios">
                  <Ratio label="Market Cap" value={data.ratios.market_cap != null ? `₹ ${f0(data.ratios.market_cap)} Cr.` : "—"} />
                  <Ratio label="Current Price" value={`₹ ${f2(quote.price)}`} />
                  <Ratio label="High / Low (52w)" value={`₹ ${f0(quote.year_high)} / ${f0(quote.year_low)}`} />
                  <Ratio label="Stock P/E" value={fx(data.ratios.pe)} />
                  <Ratio label="Book Value" value={data.ratios.book_value != null ? `₹ ${f2(data.ratios.book_value)}` : "—"} />
                  <Ratio label="Dividend Yield" value={data.ratios.div_yield != null ? `${f2(data.ratios.div_yield)} %` : "—"} />
                  <Ratio label="ROCE" value={data.ratios.roce != null ? `${fx(data.ratios.roce)} %` : "—"} />
                  <Ratio label="ROE" value={data.ratios.roe != null ? `${fx(data.ratios.roe)} %` : "—"} />
                  <Ratio label="Debt / Equity" value={fx(data.ratios.debt_to_equity, 2)} />
                  <Ratio label="EPS (TTM)" value={data.ratios.eps != null ? `₹ ${f2(data.ratios.eps)}` : "—"} />
                  <Ratio label="Price to Book" value={fx(data.ratios.price_to_book, 2)} />
                  <Ratio label="Day High / Low" value={`₹ ${f0(quote.day_high)} / ${f0(quote.day_low)}`} />
                </div>
              </div>
              <div style={{ ...card, padding: 22 }}>
                <div style={label}>About</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.dim, margin: "8px 0 0" }}>
                  {data.about
                    ? aboutOpen || data.about.length < 330 ? data.about : data.about.slice(0, 330) + "…"
                    : "No company description available."}
                </p>
                {data.about && data.about.length >= 330 && (
                  <button className="sr-pill" onClick={() => setAboutOpen(!aboutOpen)} style={{ background: "none", color: C.blue, padding: "8px 0 0", fontSize: 12 }}>{aboutOpen ? "SHOW LESS" : "READ MORE"}</button>
                )}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 24, fontSize: 12.5, color: C.dim, flexWrap: "wrap" }}>
                  <span>Volume <b style={{ color: C.text }}>{f0(quote.volume)}</b></span>
                  {data.employees && <span>Employees <b style={{ color: C.text }}>{f0(data.employees)}</b></span>}
                </div>
              </div>
            </div>

            {/* ---------- CHART ---------- */}
            <section id="chart" style={{ ...card, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {RANGES.map(([k, l]) => (
                    <button key={k} className="sr-pill" onClick={() => setRange(k)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, background: range === k ? C.blue : C.card2, color: range === k ? "#fff" : C.dim }}>{l}</button>
                  ))}
                </div>
                <label style={{ fontSize: 12, color: C.dim, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={showVol} onChange={(e) => setShowVol(e.target.checked)} /> Volume
                </label>
              </div>
              <PriceChart points={chart} showVol={showVol} err={chartErr} range={range} />
            </section>

            {/* ---------- PROS / CONS ---------- */}
            <div className="sr-pc" style={{ marginBottom: 16 }}>
              <div style={{ ...card, padding: 20, borderColor: C.green + "55" }}>
                <div style={{ ...label, color: C.green }}>PROS</div>
                <List items={data.pros} empty="No standout strengths found in the available data." color={C.green} />
              </div>
              <div style={{ ...card, padding: 20, borderColor: C.red + "55" }}>
                <div style={{ ...label, color: C.red }}>CONS</div>
                <List items={data.cons} empty="No major weaknesses found in the available data." color={C.red} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: C.mute, margin: "-6px 0 16px" }}>ⓘ Pros and cons are generated automatically from the ratios above. Not investment advice.</p>

            {/* ---------- PEERS ---------- */}
            <section id="peers" style={{ ...card, padding: 20, marginBottom: 16 }}>
              <Title>Peer comparison</Title>
              <div style={{ fontSize: 12, color: C.dim, margin: "-4px 0 12px" }}>Sector: <b style={{ color: C.text }}>{data.sector || "—"}</b> · live prices of Stock Finder stocks in the same sector</div>
              <div className="sr-scroll">
                <table style={table}>
                  <thead><tr>{["S.No.", "Name", "CMP ₹", "Day %", "P/E", "Mar Cap Cr.", "Div Yld %", "ROE %"].map((h, i) => <th key={h} style={{ ...th, textAlign: i < 2 ? "left" : "right" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[{ symbol: data.symbol, name: data.name, price: quote.price, change_pct: quote.change_pct, pe: data.ratios.pe, market_cap: data.ratios.market_cap, div_yield: data.ratios.div_yield, roe: data.ratios.roe, self: true }, ...data.peers].map((p, i) => (
                      <tr key={p.symbol} className="sr-row" style={{ borderTop: `1px solid ${C.border}`, cursor: p.self ? "default" : "pointer" }} onClick={() => !p.self && navigate(`/screener/${p.symbol}`)}>
                        <td style={td}>{i + 1}.</td>
                        <td style={{ ...td, color: p.self ? C.text : C.blue, fontWeight: 600 }}>{p.name}</td>
                        <td style={{ ...td, textAlign: "right" }}>{f2(p.price)}</td>
                        <td style={{ ...td, textAlign: "right", color: col(p.change_pct) }}>{sign(p.change_pct)}{f2(Math.abs(p.change_pct))}%</td>
                        <td style={{ ...td, textAlign: "right" }}>{fx(p.pe, 2)}</td>
                        <td style={{ ...td, textAlign: "right" }}>{f0(p.market_cap)}</td>
                        <td style={{ ...td, textAlign: "right" }}>{fx(p.div_yield, 2)}</td>
                        <td style={{ ...td, textAlign: "right" }}>{fx(p.roe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.peers.length === 0 && <div style={{ color: C.mute, fontSize: 12, marginTop: 10 }}>No other stocks from this sector in the live list.</div>}
            </section>

            <Fin id="quarters" title="Quarterly Results" sub="Consolidated figures in ₹ Crores" t={data.quarterly} bold={["Sales", "Operating Profit", "Net Profit"]} pct={["OPM %", "Net Margin %"]} />
            <Fin id="profit-loss" title="Profit & Loss" sub="Figures in ₹ Crores · yearly" t={data.yearly} bold={["Sales", "Operating Profit", "Net Profit"]} pct={["OPM %", "Net Margin %"]}>
              <div className="sr-cagr" style={{ marginTop: 18 }}>
                <Cagr title="Compounded Sales Growth" v={data.growth.sales} sub={data.growth.years ? `Over ${data.growth.years} yrs` : ""} />
                <Cagr title="Compounded Profit Growth" v={data.growth.profit} sub={data.growth.years ? `Over ${data.growth.years} yrs` : ""} />
                <Cagr title="Return on Equity" v={data.ratios.roe} sub="Latest" />
              </div>
            </Fin>
            <Fin id="balance-sheet" title="Balance Sheet" sub="Figures in ₹ Crores" t={data.balance} bold={["Total Assets", "Total Equity"]} />
            <Fin id="cash-flow" title="Cash Flows" sub="Figures in ₹ Crores" t={data.cashflow} bold={["Free Cash Flow"]} signed />
            <Fin id="ratios" title="Ratios" sub="Computed from the statements above" t={data.ratios_year} bold={["ROCE %"]} plain />

            {/* ---------- SHAREHOLDING ---------- */}
            <section id="shareholding" style={{ ...card, padding: 20, marginBottom: 16 }}>
              <Title>Shareholding Pattern</Title>
              <div style={{ fontSize: 12, color: C.dim, margin: "-4px 0 14px" }}>Latest available split, in percentages</div>
              {data.shareholding.length === 0 ? (
                <div style={{ color: C.mute, fontSize: 13 }}>Shareholding data is not available for this company.</div>
              ) : (
                <>
                  <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", background: C.card2 }}>
                    {data.shareholding.map((s, i) => <div key={s.label} style={{ width: s.value + "%", background: [C.blue, C.green, C.amber][i] }} title={`${s.label} ${s.value}%`} />)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginTop: 16 }}>
                    {data.shareholding.map((s, i) => (
                      <div key={s.label}>
                        <div style={{ fontSize: 12, color: C.dim }}><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: [C.blue, C.green, C.amber][i], marginRight: 6 }} />{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Sora',sans-serif", marginTop: 2 }}>{f2(s.value)}%</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <div style={{ textAlign: "center", margin: "30px 0 10px" }}>
              <button className="sr-pill" onClick={() => navigate("/screener")} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: "11px 24px", borderRadius: 10, fontSize: 13 }}>← Search another company</button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: C.mute, maxWidth: 680, margin: "16px auto 0" }}>
              Data: Yahoo Finance via the Stock Finder API, refreshed live. Prices may be delayed by ~15 minutes. Financial statements show only the periods Yahoo reports (latest quarters and years). Not investment advice.
            </p>
          </>
        )}
      </div>

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#7f1d1d", border: `1px solid ${C.red}`, padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 100 }}>{toast}</div>}
    </div>
  );
}

/* ---------------- pieces ---------------- */
function Chip({ children }) {
  return <span style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.dim, padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{children}</span>;
}
function Title({ children }) {
  return <h2 style={{ margin: "0 0 14px", fontSize: 19, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{children}</h2>;
}
function Ratio({ label: l, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.mute, textTransform: "uppercase", letterSpacing: ".4px" }}>{l}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
function List({ items, empty, color }) {
  if (!items || !items.length) return <div style={{ color: C.mute, fontSize: 13, marginTop: 10 }}>{empty}</div>;
  return (
    <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((t, i) => <li key={i} style={{ fontSize: 13.5, color: C.dim, display: "flex", gap: 9 }}><span style={{ color }}>•</span>{t}</li>)}
    </ul>
  );
}
function Cagr({ title, v, sub }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.mute, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sora',sans-serif", color: v == null ? C.mute : col(v), margin: "6px 0 2px" }}>{v == null ? "—" : `${fx(v)}%`}</div>
      <div style={{ fontSize: 11, color: C.mute }}>{sub}</div>
    </div>
  );
}

function Fin({ id, title, sub, t, bold = [], pct = [], signed, plain, children }) {
  const has = t && t.rows && t.rows.length > 0;
  return (
    <section id={id} style={{ ...card, padding: 20, marginBottom: 16 }}>
      <Title>{title}</Title>
      <div style={{ fontSize: 12, color: C.dim, margin: "-4px 0 12px" }}>{sub}</div>
      {!has ? (
        <div style={{ color: C.mute, fontSize: 13 }}>Yahoo Finance has no {title.toLowerCase()} data for this company.</div>
      ) : (
        <div className="sr-scroll">
          <table style={table}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", minWidth: 170, position: "sticky", left: 0, background: C.card }}> </th>
                {t.cols.map((c) => <th key={c} style={{ ...th, textAlign: "right" }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r) => {
                const isPct = pct.includes(r.label);
                const isB = bold.includes(r.label);
                return (
                  <tr key={r.label} className="sr-row" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ ...td, fontWeight: isB ? 700 : 500, color: isB ? C.text : C.dim, position: "sticky", left: 0, background: C.card }}>{r.label}</td>
                    {r.values.map((v, i) => (
                      <td key={i} style={{ ...td, textAlign: "right", fontWeight: isB ? 700 : 400, color: signed || r.label.includes("Cash Flow") ? (v == null ? C.mute : col(v)) : isPct ? C.dim : C.text }}>
                        {v == null ? "—" : r.label === "EPS in Rs" || plain ? fx(v, 2) : isPct ? `${fx(v)}%` : f0(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {children}
    </section>
  );
}

function PriceChart({ points, showVol, err, range }) {
  const rising = useMemo(() => (points && points.length > 1 ? points[points.length - 1].c >= points[0].c : true), [points]);
  const line = rising ? C.green : C.red;
  if (points === null) return <div className="sr-skel" style={{ height: 340 }} />;
  if (!points.length) return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.mute, fontSize: 13 }}>{err || "No chart data for this range."}</div>;
  const maxV = Math.max(...points.map((p) => p.v || 0)) || 1;
  return (
    <div style={{ height: 340 }}>
      <ResponsiveContainer>
        <ComposedChart data={points} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="srg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={0.35} /><stop offset="100%" stopColor={line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="d" tick={{ fill: C.mute, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} minTickGap={50}
            tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", ["1m", "6m", "1y"].includes(range) ? { day: "numeric", month: "short" } : { month: "short", year: "2-digit" })} />
          <YAxis yAxisId="p" orientation="right" domain={["auto", "auto"]} tick={{ fill: C.mute, fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => f0(v)} />
          <YAxis yAxisId="v" hide domain={[0, maxV * 4]} />
          <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
            labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            formatter={(v, n) => (n === "c" ? [`₹${f2(v)}`, "Price"] : [f0(v), "Volume"])} />
          {showVol && <Bar yAxisId="v" dataKey="v" fill={C.blue} fillOpacity={0.35} />}
          <Area yAxisId="p" type="monotone" dataKey="c" stroke={line} strokeWidth={2} fill="url(#srg)" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Skeleton({ sym }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: C.dim, fontSize: 13 }}>Loading live data for <b style={{ color: C.text }}>{sym}</b>… the first load can take 10–20 seconds.</div>
      <div className="sr-skel" style={{ height: 120 }} />
      <div className="sr-skel" style={{ height: 200 }} />
      <div className="sr-skel" style={{ height: 340 }} />
    </div>
  );
}

/* ---------------- styles ---------------- */
const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 };
const label = { fontSize: 12, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: C.mute };
const table = { width: "100%", borderCollapse: "collapse", minWidth: 560 };
const th = { padding: "10px 12px", fontSize: 11.5, fontWeight: 600, color: C.mute, textTransform: "uppercase", letterSpacing: ".4px", whiteSpace: "nowrap" };
const td = { padding: "11px 12px", fontSize: 13.5, whiteSpace: "nowrap" };