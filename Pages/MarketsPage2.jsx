import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Navbar from "../components/Navbar.jsx";
import TVChart from "../components/TVChart.jsx";
import OrderModal from "../components/OrderModal.jsx";
import { useMarketsData, useIndexChart, useExtra, useAllIndexDays, inr } from "../components/useMarketsData.js";

/* Broker-style "Stock Discovery" Markets page.
   Layout follows the classic broker markets overview. Live data from our backend. */
const IDX_TV = { NIFTY: "BSE:NIFTYBEES", SENSEX: "BSE:SENSEX", BANKNIFTY: "BSE:BANKBEES" };
const RANGES = [["1d", "1D"], ["1w", "1W"], ["1m", "1M"], ["1y", "1Y"]];

const css = `
.ao{font-family:'Inter',system-ui,sans-serif;background:#0B0F19;color:#d1d4dc;min-height:100vh;font-size:13px}
.ao *{box-sizing:border-box}
.ao-w{max-width:1260px;margin:0 auto;padding:14px 16px 60px;display:flex;flex-direction:column;gap:18px}
.ao-sub{display:flex;gap:4px;background:#131927;border:1px solid #1e293b;border-radius:10px;padding:6px 10px;overflow-x:auto}
.ao-sub button{background:none;border:0;color:#787b86;font-size:13px;padding:8px 14px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
.ao-sub button.on{color:#2962ff;border-color:#2962ff}
.ao-card{background:#131927;border:1px solid #1e293b;border-radius:14px;padding:22px}
.ao-t{font-size:16px;font-weight:700;margin:0 0 16px;font-family:'Sora','Inter',sans-serif}
.ao-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.ao-va{color:#2962ff;font-size:12px;font-weight:700;cursor:pointer;background:none;border:0}
.ao-up{color:#00b386}.ao-dn{color:#e5314a}
.ao-itabs{display:grid;grid-template-columns:repeat(6,1fr) 110px;border:1px solid #1e293b;border-radius:8px;overflow:hidden;margin-bottom:18px}
.ao-it{background:none;border:0;border-bottom:2px solid transparent;color:inherit;font:inherit;text-align:left;padding:10px 14px;cursor:pointer}
.ao-it b{display:block;font-size:11px;color:#787b86;font-weight:600}
.ao-it.on{background:#182033;border-color:#2962ff}
.ao-it .v{font-variant-numeric:tabular-nums;font-weight:600;margin-top:3px;font-size:12px}
.ao-ov{display:grid;grid-template-columns:1fr 1.5fr;gap:24px;background:#0E1320;border:1px solid #1e293b;border-radius:10px;padding:20px}
.ao-gauge{height:6px;border-radius:9px;background:linear-gradient(90deg,#e5314a,#00b386);position:relative;margin:14px 0 10px}
.ao-gauge i{position:absolute;top:-6px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #d1d4dc;transform:translateX(-5px)}
.ao-4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:22px}
.ao-4 small{display:block;color:#787b86;font-size:11px;margin-bottom:3px}
.ao-pills{display:flex;gap:8px;margin-top:6px}
.ao-pill{border:1px solid #363b4d;background:none;color:#d1d4dc;border-radius:99px;padding:4px 12px;font-size:11px;cursor:pointer}
.ao-pill.on{border-color:#2962ff;color:#2962ff}
.ao-5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.ao-sc{background:#0E1320;border:1px solid #1e293b;border-radius:10px;padding:14px;cursor:pointer;min-width:0}
.ao-sc:hover{border-color:#2962ff}
.ao-sc b{display:block;font-size:12px}
.ao-sc span{display:block;font-size:10px;color:#787b86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:10px}
.ao-sc div{font-size:12px;font-variant-numeric:tabular-nums}
.ao-2{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.ao-tabs{display:flex;gap:8px;margin-bottom:12px}
.ao-tab{background:none;border:1px solid #1e293b;color:#d1d4dc;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer}
.ao-tab.on{border-color:#2962ff;color:#2962ff;background:#2962ff14}
.ao-tbl{width:100%;border-collapse:collapse}
.ao-tbl th{background:#182033;color:#787b86;font-weight:600;font-size:11px;text-align:right;padding:9px 10px}
.ao-tbl th:first-child,.ao-tbl td:first-child{text-align:left}
.ao-tbl td{padding:12px 10px;text-align:right;border-bottom:1px solid #1e293b;font-variant-numeric:tabular-nums}
.ao-tbl tr.r{cursor:pointer}.ao-tbl tr.r:hover td{background:#182033}
.ao-tbl small{display:block;color:#787b86;font-size:10px;margin-top:2px}
.ao-chip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.ao-chip.u{background:#00b38622;color:#00b386}.ao-chip.d{background:#e5314a22;color:#e5314a}
.ao-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.ao-sig{display:flex;gap:12px;background:#0E1320;border:1px solid #1e293b;border-radius:10px;padding:14px}
.ao-sig svg{flex:none}
.ao-rec{background:#0E1320;border:1px solid #1e293b;border-radius:10px;padding:16px}
.ao-rng{position:relative;height:3px;background:#1e293b;margin:22px 0 8px}
.ao-rng i{position:absolute;top:-4px;width:10px;height:10px;border-radius:50%;transform:translateX(-5px)}
.ao-buy{background:#00b386;color:#04130f;border:0;border-radius:6px;padding:6px 18px;font-weight:700;cursor:pointer}
.ao-news{border-bottom:1px solid #1e293b;padding:12px 0}
.ao-news small{color:#787b86}
.ao-tag{float:right;background:#00b38622;color:#00b386;font-size:10px;padding:2px 8px;border-radius:4px}
.ao-soc{display:flex;gap:10px}
.ao-soc span{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px}
.ao-empty{color:#787b86;padding:18px 0;text-align:center}

.ao-tbl td:not(:first-child),.ao-sc div,.ao-it .v,.ao-4 div,.ao-sig .ao-row span,.ao-rec b{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.ao-card{border-radius:10px;padding:18px}
.ao-t{font-size:15px}
.ao-tab{border-radius:999px;color:#787b86}
.ao-tab.on{background:#16233d}
.ao-tbl th{background:#182033}
.ao-sc{position:relative;border-radius:8px;padding:12px}
.ao-acts{display:none;gap:4px;align-items:center;justify-content:flex-end}
.ao-sc .ao-acts{position:absolute;top:10px;right:10px}
.ao-sc:hover .ao-acts{display:flex}
.ao-sig{position:relative}
.ao-sig .ao-acts{position:absolute;right:12px;bottom:10px}
.ao-sig:hover .ao-acts{display:flex}
.ao-tbl tr:hover .ao-val{display:none}
.ao-tbl tr:hover .ao-acts{display:inline-flex}
.ao-ab{width:24px;height:24px;border-radius:4px;border:0;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif}
.ao-ab.b{background:#00b386;color:#fff}.ao-ab.s{background:#e5314a;color:#fff}
.ao-ab.c{background:#1e293b;color:#d1d4dc}.ao-ab.c:hover{background:#2962ff;color:#fff}
.ao-ab:hover{filter:brightness(1.15)}

/* ── compact terminal look (matches the old Markets page) ── */
.ao{font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.ao-w{max-width:1600px;padding:10px 16px 40px;gap:12px}
.ao-sub{border-radius:8px;padding:2px 8px}
.ao-sub button{font-size:11px;padding:7px 12px;font-family:inherit}
.ao-card{border-radius:8px;padding:12px 14px}
.ao-t{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px;font-family:inherit}
.ao-va{font-size:10px;letter-spacing:.06em;font-family:inherit}
.ao-itabs{margin-bottom:12px}
.ao-it{padding:8px 12px}.ao-it b{font-size:10px;letter-spacing:.05em}.ao-it .v{font-size:11px}
.ao-ov{padding:14px;gap:18px;border-radius:8px}
.ao-4{margin-top:16px}.ao-4 small{font-size:10px}
.ao-pill,.ao-tab{font-size:10px;padding:4px 10px;font-family:inherit;border-radius:4px}
.ao-tabs{margin-bottom:8px;gap:6px}
.ao-5{gap:8px}.ao-3{gap:10px}.ao-2{gap:12px}
.ao-sc{padding:10px;border-radius:6px}.ao-sc b{font-size:11px}.ao-sc span{font-size:10px;margin-bottom:6px}.ao-sc div{font-size:11px}
.ao-tbl th{font-size:10px;padding:6px 8px;text-transform:uppercase;letter-spacing:.05em;font-family:inherit}
.ao-tbl td{padding:8px;font-size:11px}
.ao-tbl small{font-size:10px}
.ao-chip{font-size:10px;padding:2px 6px;border-radius:3px}
.ao-sig,.ao-rec{padding:10px;border-radius:6px}
.ao-buy{padding:4px 14px;font-size:11px;border-radius:4px;font-family:inherit}
.ao-news{padding:8px 0;font-size:11px}
.ao-ab{width:22px;height:22px;font-size:10px}
.ao-tbl td:first-child b{font-size:11px;font-weight:700}
@media(max-width:1000px){.ao-5{grid-template-columns:repeat(2,1fr)}.ao-2,.ao-3,.ao-ov{grid-template-columns:1fr}.ao-itabs{grid-template-columns:repeat(3,1fr)}}
`;

const STEP = { NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, MIDCPNIFTY: 25, SENSEX: 100 };
const timeAgo = (t) => {
  if (!t) return "";
  const ms = /^\d+$/.test(String(t)) ? Number(t) * 1000 : Date.parse(t);
  if (!ms) return "";
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} d ago`;
};
const pivot = (s) => {
  const P = (s.high + s.low + s.prev) / 3;
  return { P, R1: 2 * P - s.low, S1: 2 * P - s.high };
};

export default function MarketsAngelOne() {
  const navigate = useNavigate();
  const { indices, stocks, status } = useMarketsData();
  const [sub, setSub] = useState("Stock Discovery");
  const [ikey, setIkey] = useState("NIFTY");
  const [range, setRange] = useState("1d");
  const [tv, setTv] = useState("BSE:NIFTYBEES");
  const [mv, setMv] = useState("gain");
  const [sector, setSector] = useState(null);
  const [tech, setTech] = useState("pivot");
  const [sigTab, setSigTab] = useState("Candlesticks");
  const [pocket, setPocket] = useState(50);
  const [ca, setCa] = useState("Split");
  const { data: ch, err } = useIndexChart(ikey, range);
  const idxKeys = useMemo(() => indices.map((i) => i.key), [indices]);
  const days = useAllIndexDays(idxKeys, sub === "Index F&O" || sub === "All Indices");
  const com = useExtra("/market/commodities", sub === "Commodities");
  const newsX = useExtra("/market/news", sub === "News");

  const cur = indices.find((i) => i.key === ikey) || indices[0];
  const go = (sym) => navigate(`/screener/${sym}`);
  const buy = (e, sym) => { e.stopPropagation(); navigate("/tradeone", { state: { tv: `BSE:${sym}`, label: sym } }); };
  const [order, setOrder] = useState(null);
  const goChart = (key) => navigate("/tradeone", { state: { tv: IDX_TV[key] || "BSE:NIFTYBEES", label: key } });
  const trade = (e, sym, side) => {
    e.stopPropagation();
    if (!side) { navigate("/tradeone", { state: { tv: `BSE:${sym}`, label: sym } }); return; }   // chart icon
    const st = stocks.find((x) => x.symbol === sym);
    setOrder({ sym, name: st ? st.name : sym, side, ltp: st ? st.price : 0 });
  };
  const Acts = ({ sym }) => (
    <span className="ao-acts" onClick={(e) => e.stopPropagation()}>
      <button className="ao-ab b" title="Buy" onClick={(e) => trade(e, sym, "BUY")}>B</button>
      <button className="ao-ab s" title="Sell" onClick={(e) => trade(e, sym, "SELL")}>S</button>
      <button className="ao-ab c" title="Chart" onClick={(e) => trade(e, sym)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 20V10M10 20V4M16 20v-7M22 20V8" /></svg>
      </button>
    </span>
  );
  const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

  const sectors = useMemo(() => [...new Set(stocks.map((s) => s.sector))].sort(), [stocks]);
  const sec = sector || sectors[0];
  const mostBought = useMemo(() => [...stocks].sort((a, b) => b.volume * b.price - a.volume * a.price).slice(0, 5), [stocks]);
  const movers = useMemo(() => {
    const a = [...stocks].sort((x, y) => (mv === "gain" ? y.pct - x.pct : x.pct - y.pct));
    return a.slice(0, 5);
  }, [stocks, mv]);
  const secRows = useMemo(() => stocks.filter((s) => s.sector === sec).sort((a, b) => b.pct - a.pct).slice(0, 5), [stocks, sec]);

  const techList = useMemo(() => {
    const a = stocks.map((s) => ({ ...s, ...pivot(s) }));
    if (tech === "pivot") return a.filter((s) => s.price > s.P).sort((x, y) => y.price / y.P - x.price / x.P).slice(0, 5);
    if (tech === "high") return [...a].sort((x, y) => (y.price - y.low) / (y.high - y.low || 1) - (x.price - x.low) / (x.high - x.low || 1)).slice(0, 5);
    return [...a].sort((x, y) => (x.price - x.low) / (x.high - x.low || 1) - (y.price - y.low) / (y.high - y.low || 1)).slice(0, 5);
  }, [stocks, tech]);

  const signals = useMemo(() => stocks.slice(0, 3).map((s) => {
    const pos = (s.price - s.low) / (s.high - s.low || 1);
    const body = Math.abs(s.pct);
    const label = body < 0.3 ? "Doji (Neutral)" : s.pct > 0 ? (pos > 0.8 ? "Bullish Marubozu" : "Bullish") : (pos < 0.2 ? "Bearish Marubozu" : "Bearish");
    return { ...s, label, pos };
  }), [stocks]);

  const recs = useMemo(() => stocks.slice(3, 6).map((s) => ({
    ...s, entryLo: s.price * 0.995, entryHi: s.price * 1.005, sl: s.price * 0.97, tgt: s.price * 1.05,
  })), [stocks]);

  const pocketList = stocks.filter((s) => s.price < pocket).sort((a, b) => a.price - b.price).slice(0, 5);

  const gaugePos = ch && ch.high > ch.low ? ((ch.close - ch.low) / (ch.high - ch.low)) * 100 : 50;
  const up = cur ? cur.change >= 0 : true;
  const pts = ch?.points || [];
  const vals = pts.map((p) => p.v);
  const ymin = vals.length ? Math.min(...vals) : 0, ymax = vals.length ? Math.max(...vals) : 1;

  const StockCard = ({ s }) => (
    <div className="ao-sc" onClick={() => go(s.symbol)}>
      <Acts sym={s.symbol} /><b>{s.symbol}</b><span>{s.name}</span>
      <div>₹{inr(s.price)} <span style={{ display: "inline" }} className={s.pct >= 0 ? "ao-up" : "ao-dn"}>{s.pct >= 0 ? "▲" : "▼"} {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)} ({pct(s.pct)})</span></div>
    </div>
  );
  const MRow = ({ s }) => (
    <tr className="r" onClick={() => go(s.symbol)}>
      <td><b>{s.symbol}</b><small>{s.name}</small></td>
      <td className={s.pct >= 0 ? "ao-up" : "ao-dn"}><span className="ao-val">₹{inr(s.price)} {s.pct >= 0 ? "▲" : "▼"}</span><Acts sym={s.symbol} /></td>
      <td>{s.change >= 0 ? "" : "-"}{inr(Math.abs(s.change))}</td>
      <td><span className={"ao-chip " + (s.pct >= 0 ? "u" : "d")}>{pct(s.pct)}</span></td>
    </tr>
  );
  const MHead = () => <thead><tr><th>Stock</th><th>LTP</th><th>Chng</th><th>%Chng</th></tr></thead>;
  const Empty = ({ t }) => <div className="ao-empty">{status === "loading" ? "Loading…" : t}</div>;

  return (
    <div className="ao">
      <style>{css}</style>
      <Navbar />
      <OrderModal open={!!order} sym={order?.sym} name={order?.name} side={order?.side} ltp={order?.ltp} onClose={() => setOrder(null)} />
      <div className="ao-w">
        <div className="ao-sub">
          {["Stock Discovery", "Index F&O", "Stocks F&O", "Commodities", "All Indices", "News"].map((t) => (
            <button key={t} className={sub === t ? "on" : ""} onClick={() => setSub(t)}>{t}</button>
          ))}
        </div>

        {/* TradingView — unchanged */}
        <TVChart symbol={tv} onSymbol={setTv} />

        {sub === "Stock Discovery" && (
          <>
        {/* INDEX OVERVIEW */}
        <section className="ao-card">
          <h2 className="ao-t">Index Overview</h2>
          <div className="ao-itabs">
            {indices.slice(0, 6).map((x) => (
              <button key={x.key} className={"ao-it" + (ikey === x.key ? " on" : "")} onClick={() => { setIkey(x.key); if (IDX_TV[x.key]) setTv(IDX_TV[x.key]); }}>
                <b>{x.name}</b>
                <div className="v">{inr(x.value)} <span className={x.change >= 0 ? "ao-up" : "ao-dn"}>{x.change >= 0 ? "▲" : "▼"} {x.change >= 0 ? "+" : ""}{inr(x.change)} ({pct(x.pct)})</span></div>
              </button>
            ))}
            <button className="ao-va" onClick={() => navigate("/tradeone", { state: { tv: IDX_TV[ikey] || "BSE:NIFTYBEES", label: ikey } })}>VIEW ALL ›</button>
          </div>
          <div className="ao-ov">
            <div>
              <div style={{ fontWeight: 600 }}>Day's High/Low</div>
              <div className="ao-gauge"><i style={{ left: gaugePos + "%" }} /></div>
              <div className="ao-row" style={{ fontWeight: 600 }}><span>{ch ? inr(ch.low) : "—"}</span><span>{ch ? inr(ch.high) : "—"}</span></div>
              <div className="ao-row" style={{ color: "#787b86", fontSize: 11 }}><span>Low</span><span>High</span></div>
              <div className="ao-4">
                <div><small>Open</small>{ch ? inr(ch.open) : "—"}</div>
                <div><small>High</small><span className="ao-up">{ch ? inr(ch.high) : "—"}</span></div>
                <div><small>Low</small><span className="ao-dn">{ch ? inr(ch.low) : "—"}</span></div>
                <div><small>Close</small>{ch ? inr(ch.prev_close) : "—"}</div>
              </div>
            </div>
            <div>
              <div style={{ height: 190 }}>
                {pts.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pts} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="aog" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? "#00b386" : "#e5314a"} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={up ? "#00b386" : "#e5314a"} stopOpacity={0} />
                      </linearGradient></defs>
                      <XAxis dataKey="t" hide />
                      <YAxis orientation="right" domain={[ymin * 0.9995, ymax * 1.0005]} tick={{ fill: "#787b86", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(0)} width={52} />
                      {ch?.prev_close && range === "1d" && <ReferenceLine y={ch.prev_close} stroke="#555" strokeDasharray="3 3" />}
                      <Tooltip contentStyle={{ background: "#182033", border: "1px solid #1e293b", fontSize: 12 }} labelStyle={{ color: "#787b86" }} formatter={(v) => [inr(v), "Value"]} />
                      <Area type="monotone" dataKey="v" stroke={up ? "#00b386" : "#e5314a"} strokeWidth={1.6} fill="url(#aog)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="ao-empty" style={{ paddingTop: 70 }}>{err ? "Chart needs the updated backend (markets_api.py)" : "Loading chart…"}</div>
                )}
              </div>
              <div className="ao-pills">
                {RANGES.map(([k, l]) => <button key={k} className={"ao-pill" + (range === k ? " on" : "")} onClick={() => setRange(k)}>{l}</button>)}
              </div>
            </div>
          </div>
        </section>

        {/* MOST BOUGHT */}
        <section className="ao-card">
          <div className="ao-row"><h2 className="ao-t">Most Bought Stocks</h2><button className="ao-va" onClick={() => navigate("/screener")}>VIEW ALL ›</button></div>
          <div className="ao-5">{mostBought.map((s) => <StockCard key={s.symbol} s={s} />)}</div>
          {!mostBought.length && <Empty t="No data" />}
        </section>

        {/* TOP MOVERS + SECTORWISE */}
        <section className="ao-card">
          <h2 className="ao-t">Top Movers and Sectorwise Movements</h2>
          <div className="ao-2">
            <div>
              <div className="ao-tabs">
                <button className={"ao-tab" + (mv === "gain" ? " on" : "")} onClick={() => setMv("gain")}>Gainers</button>
                <button className={"ao-tab" + (mv === "lose" ? " on" : "")} onClick={() => setMv("lose")}>Losers</button>
              </div>
              <table className="ao-tbl"><MHead /><tbody>{movers.map((s) => <MRow key={s.symbol} s={s} />)}</tbody></table>
              {!movers.length && <Empty t="No data" />}
            </div>
            <div>
              <div className="ao-tabs" style={{ flexWrap: "wrap" }}>
                {sectors.slice(0, 5).map((n) => <button key={n} className={"ao-tab" + (sec === n ? " on" : "")} onClick={() => setSector(n)}>{n}</button>)}
              </div>
              <table className="ao-tbl"><MHead /><tbody>{secRows.map((s) => <MRow key={s.symbol} s={s} />)}</tbody></table>
              {!secRows.length && <Empty t="No data" />}
            </div>
          </div>
        </section>

        {/* TECHNICAL SCREENERS */}
        <section className="ao-card">
          <div className="ao-row" style={{ marginBottom: 14, flexWrap: "wrap" }}>
            <div className="ao-tabs" style={{ margin: 0 }}>
              {[["pivot", "Simple Pivot"], ["high", "Near Day High"], ["low", "Near Day Low"]].map(([k, l]) => (
                <button key={k} className={"ao-tab" + (tech === k ? " on" : "")} onClick={() => setTech(k)}>{l}</button>
              ))}
            </div>
            <span style={{ color: "#787b86", fontSize: 12 }}>Tracked stocks · {tech === "pivot" ? "Above pivot" : tech === "high" ? "Strength" : "Weakness"}</span>
          </div>
          <div className="ao-5">{techList.map((s) => <StockCard key={s.symbol} s={s} />)}</div>
          {!techList.length && <Empty t="No stocks match right now" />}
        </section>

        {/* TRADING SIGNALS */}
        <section className="ao-card">
          <div className="ao-row"><h2 className="ao-t">Trading Signals</h2><button className="ao-va" onClick={() => navigate("/screener")}>VIEW ALL ›</button></div>
          <div className="ao-tabs">
            {["Candlesticks", "Chart Patterns", "Price Action"].map((t) => <button key={t} className={"ao-tab" + (sigTab === t ? " on" : "")} onClick={() => setSigTab(t)}>{t}</button>)}
          </div>
          <div className="ao-3">
            {signals.map((s) => {
              const col = s.pct >= 0 ? "#00b386" : "#e5314a";
              const y = (p) => 4 + (1 - (p - s.low) / (s.high - s.low || 1)) * 46;
              return (
                <div className="ao-sig" key={s.symbol} onClick={() => go(s.symbol)} style={{ cursor: "pointer" }}>
                  <div style={{ textAlign: "center", width: 74 }}>
                    <svg width="30" height="56"><line x1="15" x2="15" y1={4} y2={52} stroke={col} /><rect x="9" width="12" y={Math.min(y(s.prev), y(s.price))} height={Math.max(3, Math.abs(y(s.prev) - y(s.price)))} fill={col} /></svg>
                    <div style={{ fontSize: 10, color: "#787b86" }}>{s.label}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ao-row"><b>{s.symbol}</b><span className={s.pct >= 0 ? "ao-up" : "ao-dn"}>₹{inr(s.price)}</span></div>
                    <div className="ao-row"><span style={{ color: "#787b86", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span><span className={s.pct >= 0 ? "ao-up" : "ao-dn"} style={{ fontSize: 11 }}>{s.change >= 0 ? "+" : ""}{inr(s.change)} ({pct(s.pct)})</span></div>
                    <div style={{ color: "#787b86", fontSize: 11, marginTop: 8 }}>Time Frame: 1D</div>
                  </div>
                  <Acts sym={s.symbol} />
                  <div style={{ display: "none" }}>
                  </div>
                </div>
              );
            })}
          </div>
          {!signals.length && <Empty t="No data" />}
        </section>

        {/* RESEARCH RECOMMENDATIONS */}
        <section className="ao-card">
          <div className="ao-row"><h2 className="ao-t">Research Recommendations</h2><button className="ao-va" onClick={() => navigate("/screener")}>VIEW ALL TRADING IDEAS ›</button></div>
          <div className="ao-3">
            {recs.map((r) => {
              const span = r.tgt - r.sl;
              const at = Math.min(100, Math.max(0, ((r.price - r.sl) / span) * 100));
              return (
                <div className="ao-rec" key={r.symbol}>
                  <div className="ao-row"><div><b>{r.symbol}</b><div style={{ color: "#787b86", fontSize: 11 }}>{r.name}</div></div>
                    <span style={{ fontSize: 11 }} className={r.pct >= 0 ? "ao-up" : "ao-dn"}>● LTP ₹{inr(r.price)}</span></div>
                  <div className="ao-rng"><i style={{ left: "0%", background: "#e5314a" }} /><i style={{ left: "50%", background: "#2962ff" }} /><i style={{ left: "100%", background: "#00b386" }} />
                    <i style={{ left: at + "%", background: "#fff", width: 6, height: 6, top: -1.5 }} /></div>
                  <div className="ao-row" style={{ fontSize: 11, color: "#787b86" }}><span>Stop Loss<br /><b style={{ color: "#d1d4dc" }}>{inr(r.sl)}</b></span><span style={{ textAlign: "center" }}>Entry<br /><b style={{ color: "#d1d4dc" }}>{inr(r.entryLo)} - {inr(r.entryHi)}</b></span><span style={{ textAlign: "right" }}>Target<br /><b style={{ color: "#d1d4dc" }}>{inr(r.tgt)}</b></span></div>
                  <div className="ao-row" style={{ marginTop: 14 }}><span style={{ fontSize: 10, color: "#5d616d" }}>Illustrative levels · not advice</span><button className="ao-buy" onClick={(e) => trade(e, r.symbol, "BUY")}>BUY</button></div>
                </div>
              );
            })}
          </div>
          {!recs.length && <Empty t="No data" />}
        </section>

        {/* POCKET FRIENDLY */}
        <section className="ao-card">
          <div className="ao-row"><h2 className="ao-t">Pocket Friendly Stocks</h2><button className="ao-va" onClick={() => navigate("/screener")}>VIEW ALL ›</button></div>
          <div className="ao-tabs">{[50, 100, 200].map((n) => <button key={n} className={"ao-tab" + (pocket === n ? " on" : "")} onClick={() => setPocket(n)}>{"<₹" + n}</button>)}</div>
          <div className="ao-5">{pocketList.map((s) => <StockCard key={s.symbol} s={s} />)}</div>
          {!pocketList.length && <Empty t={`No tracked stocks under ₹${pocket}`} />}
        </section>

        {/* CORPORATE ACTION + NEWS */}
        <div className="ao-2">
          <section className="ao-card">
            <h2 className="ao-t">Corporate Action</h2>
            <div className="ao-tabs" style={{ flexWrap: "wrap" }}>{["Split", "Board Meeting", "Bonus", "Dividend", "Rights"].map((t) => <button key={t} className={"ao-tab" + (ca === t ? " on" : "")} onClick={() => setCa(t)}>{t}</button>)}</div>
            <table className="ao-tbl"><thead><tr><th>Company</th><th>{ca === "Dividend" ? "Amount" : "Ratio / Detail"}</th><th>Ex-Date</th></tr></thead>
              <tbody>{(CORP[ca] || []).map((r, i) => <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table>
            <div style={{ fontSize: 10, color: "#5d616d", marginTop: 10 }}>Sample data — connect a corporate-actions API to make this live.</div>
          </section>
          <section className="ao-card">
            <div className="ao-row"><h2 className="ao-t">Stocks in News</h2><button className="ao-va">VIEW ALL ›</button></div>
            {NEWS.map((n, i) => (
              <div className="ao-news" key={i}>
                <small>{n.src}</small><span className="ao-tag">INSIGHTFUL</span>
                <div style={{ fontWeight: 600, margin: "6px 0" }}>{n.t}</div>
                <small>{n.sym} · {n.ago}</small>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#5d616d", marginTop: 10 }}>Sample headlines — connect a news API to make this live.</div>
          </section>
        </div>

          </>
        )}

        {sub === "All Indices" && (
          <section className="ao-card">
            <h2 className="ao-t">All Indices</h2>
            <table className="ao-tbl">
              <thead><tr><th>Index</th><th>Value</th><th>Chng</th><th>%Chng</th><th>Open</th><th>High</th><th>Low</th><th>Day range</th><th /></tr></thead>
              <tbody>
                {indices.map((x) => {
                  const d = days[x.key]; const pos = d && d.high > d.low ? ((x.value - d.low) / (d.high - d.low)) * 100 : 50;
                  return (
                    <tr key={x.key} className="r" onClick={() => goChart(x.key)}>
                      <td><b>{x.name}</b></td>
                      <td>{inr(x.value)}</td>
                      <td className={x.change >= 0 ? "ao-up" : "ao-dn"}>{x.change >= 0 ? "+" : ""}{inr(x.change)}</td>
                      <td><span className={"ao-chip " + (x.change >= 0 ? "u" : "d")}>{pct(x.pct)}</span></td>
                      <td>{d ? inr(d.open) : "—"}</td><td>{d ? inr(d.high) : "—"}</td><td>{d ? inr(d.low) : "—"}</td>
                      <td style={{ width: 130 }}><div className="ao-gauge" style={{ margin: "6px 0" }}><i style={{ left: pos + "%" }} /></div></td>
                      <td><button className="ao-ab c" onClick={(e) => { e.stopPropagation(); goChart(x.key); }} title="Chart">📈</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!indices.length && <Empty t="No data" />}
          </section>
        )}

        {sub === "Index F&O" && (
          <section className="ao-card">
            <h2 className="ao-t">Index F&amp;O — Key Levels</h2>
            <div className="ao-3">
              {indices.filter((x) => STEP[x.key]).map((x) => {
                const d = days[x.key]; const step = STEP[x.key];
                const atm = Math.round(x.value / step) * step;
                const lv = d ? pivot({ high: d.high, low: d.low, prev: d.prev_close }) : null;
                const bias = lv ? (x.value > lv.P ? "Bullish above pivot" : "Bearish below pivot") : "—";
                return (
                  <div className="ao-rec" key={x.key} style={{ cursor: "pointer" }} onClick={() => goChart(x.key)}>
                    <div className="ao-row"><b>{x.name}</b><span className={x.change >= 0 ? "ao-up" : "ao-dn"}>{inr(x.value)} ({pct(x.pct)})</span></div>
                    <div className="ao-4" style={{ gridTemplateColumns: "repeat(2,1fr)", marginTop: 14 }}>
                      <div><small>ATM Strike</small>{inr(atm)}</div>
                      <div><small>Bias</small><span className={lv && x.value > lv.P ? "ao-up" : "ao-dn"}>{bias}</span></div>
                      <div><small>Support (S1)</small><span className="ao-dn">{lv ? inr(lv.S1) : "—"}</span></div>
                      <div><small>Resistance (R1)</small><span className="ao-up">{lv ? inr(lv.R1) : "—"}</span></div>
                      <div><small>Pivot</small>{lv ? inr(lv.P) : "—"}</div>
                      <div><small>Day range</small>{d ? `${inr(d.low)} - ${inr(d.high)}` : "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: "#5d616d", marginTop: 12 }}>Levels are calculated from the day's high, low and previous close. Options data is not included.</div>
            {!indices.length && <Empty t="No data" />}
          </section>
        )}

        {sub === "Stocks F&O" && (
          <section className="ao-card">
            <h2 className="ao-t">Stocks F&amp;O — Tracked Stocks</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="ao-tbl">
                <thead><tr><th>Stock</th><th>LTP</th><th>%Chng</th><th>Support</th><th>Pivot</th><th>Resistance</th><th>Day range</th></tr></thead>
                <tbody>
                  {[...stocks].sort((a, b) => b.volume * b.price - a.volume * a.price).map((s) => {
                    const lv = pivot(s); const pos = s.high > s.low ? ((s.price - s.low) / (s.high - s.low)) * 100 : 50;
                    return (
                      <tr key={s.symbol} className="r" onClick={() => go(s.symbol)}>
                        <td><b>{s.symbol}</b><small>{s.sector}</small></td>
                        <td className={s.pct >= 0 ? "ao-up" : "ao-dn"}><span className="ao-val">₹{inr(s.price)} {s.pct >= 0 ? "▲" : "▼"}</span><Acts sym={s.symbol} /></td>
                        <td><span className={"ao-chip " + (s.pct >= 0 ? "u" : "d")}>{pct(s.pct)}</span></td>
                        <td className="ao-dn">{inr(lv.S1)}</td><td>{inr(lv.P)}</td><td className="ao-up">{inr(lv.R1)}</td>
                        <td style={{ width: 120 }}><div className="ao-gauge" style={{ margin: "6px 0" }}><i style={{ left: pos + "%" }} /></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!stocks.length && <Empty t="No data" />}
          </section>
        )}

        {sub === "Commodities" && (
          <section className="ao-card">
            <h2 className="ao-t">Commodities &amp; Currencies</h2>
            {com.err && !com.data && <Empty t="Needs the updated backend (markets_api.py)" />}
            {!com.data && !com.err && <Empty t="Loading…" />}
            {com.data && (
              <>
                <div className="ao-5" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                  {com.data.items.filter((c) => c.unit !== "Currency").map((c) => (
                    <div className="ao-sc" key={c.key}>
                      <b>{c.name}</b><span>{c.unit}</span>
                      <div>{inr(c.price)} <span style={{ display: "inline" }} className={c.change >= 0 ? "ao-up" : "ao-dn"}>{c.change >= 0 ? "▲" : "▼"} {c.change >= 0 ? "+" : ""}{inr(c.change)} ({pct(c.change_pct)})</span></div>
                      <div style={{ color: "#787b86", marginTop: 6 }}>L {inr(c.low)} · H {inr(c.high)}</div>
                    </div>
                  ))}
                </div>
                <table className="ao-tbl" style={{ marginTop: 18 }}>
                  <thead><tr><th>Currency</th><th>Rate</th><th>Chng</th><th>%Chng</th></tr></thead>
                  <tbody>{com.data.items.filter((c) => c.unit === "Currency").map((c) => (
                    <tr key={c.key}><td><b>{c.name}</b></td><td>{inr(c.price)}</td>
                      <td className={c.change >= 0 ? "ao-up" : "ao-dn"}>{c.change >= 0 ? "+" : ""}{c.change.toFixed(4)}</td>
                      <td><span className={"ao-chip " + (c.change >= 0 ? "u" : "d")}>{pct(c.change_pct)}</span></td></tr>))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: "#5d616d", marginTop: 12 }}>Global futures prices in US dollars (not MCX rupee prices). Delayed.</div>
              </>
            )}
          </section>
        )}

        {sub === "News" && (
          <section className="ao-card">
            <h2 className="ao-t">Market News</h2>
            {newsX.err && !newsX.data && <Empty t="Needs the updated backend (markets_api.py)" />}
            {!newsX.data && !newsX.err && <Empty t="Loading…" />}
            {newsX.data && !newsX.data.items.length && <Empty t="No headlines right now" />}
            {newsX.data && newsX.data.items.map((n, i) => (
              <div className="ao-news" key={i}>
                <small>{n.source}{timeAgo(n.time) ? " · " + timeAgo(n.time) : ""}</small>
                <div style={{ fontWeight: 600, margin: "6px 0" }}>
                  {n.url ? <a href={n.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{n.title} ↗</a> : n.title}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="ao-card ao-row">
          <h2 className="ao-t" style={{ margin: 0 }}>Join our Community</h2>
          <div className="ao-soc">
            {[["YT", "#e11d1d"], ["IG", "#c13584"], ["f", "#1877f2"], ["X", "#111"], ["in", "#0a66c2"]].map(([l, c]) => <span key={l} style={{ background: c, border: "1px solid #333" }}>{l}</span>)}
          </div>
        </section>
        <div style={{ textAlign: "center", fontSize: 11, color: "#5d616d" }}>Prices are delayed and for learning and analysis only. Not investment advice.</div>
      </div>
    </div>
  );
}

const CORP = {
  Split: [["INTERARCH BLDNG SOLTN LTD", "10:2", "2026-11-30"], ["BN AGROCHEM LTD.", "10:1", "2026-11-16"]],
  "Board Meeting": [["TATA STEEL LTD", "Q2 results", "2026-11-18"], ["WIPRO LTD", "Interim dividend", "2026-11-20"]],
  Bonus: [["SAMPLE INDUSTRIES LTD", "1:1", "2026-11-25"]],
  Dividend: [["INFOSYS LTD", "₹20 / share", "2026-11-22"], ["TCS LTD", "₹10 / share", "2026-11-28"]],
  Rights: [["SAMPLE FINANCE LTD", "1:4", "2026-12-02"]],
};
const NEWS = [
  { src: "Market Desk", t: "Board approves H1 FY27 results; no deviation in IPO proceeds use", sym: "SAMPLE", ago: "2 mins ago" },
  { src: "Market Desk", t: "Results quick look: revenue up year-on-year, margins stable", sym: "SAMPLE", ago: "5 mins ago" },
  { src: "Market Desk", t: "Board recommends appointment of auditors for FY 2026-27", sym: "SAMPLE", ago: "9 mins ago" },
];