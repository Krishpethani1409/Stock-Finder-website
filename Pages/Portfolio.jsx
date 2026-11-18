// ============================================================
//  Portfolio.jsx  →  src/Pages/Portfolio.jsx
//  Full trading account: Holdings · Positions · Orders · Trades ·
//  Funds · P&L report, with a broker-style order ticket.
//  Live prices for ANY symbol come from GET /quotes (screener_api.py)
//  and GET /stocks (main.py).
// ============================================================
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Navbar from "../components/Navbar.jsx";
import {
  loadPortfolio, placeOrder, cancelOrder, squareOff, addCash, withdrawCash,
  resetPortfolio, chargesFor, marginFor, marketStatus, todayKey, LEVERAGE,
} from "../store/portfolioStore.js";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");
const PRICE_CACHE = "sf_live_prices";
const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

const C = {
  bg: "#0b1220", card: "#111c31", card2: "#16233d", border: "#22304d",
  text: "#e8eefc", dim: "#8fa3c7", mute: "#5d7096",
  blue: "#3b82f6", green: "#22c55e", red: "#ef4444", amber: "#f59e0b",
};
const PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ef4444", "#ec4899", "#84cc16", "#f97316", "#64748b"];
const SECTORS = {
  Energy: ["RELIANCE", "ONGC", "COALINDIA", "POWERGRID", "NTPC", "RPOWER"], IT: ["TCS", "INFY", "WIPRO", "HCLTECH"],
  Banking: ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BAJFINANCE", "YESBANK"],
  FMCG: ["HINDUNILVR", "NESTLEIND", "ASIANPAINT", "TITAN"], Auto: ["MARUTI", "TATAMOTORS"], Pharma: ["SUNPHARMA"],
  Metals: ["JSWSTEEL", "TATASTEEL", "HINDALCO"], Infra: ["LT"], Telecom: ["IDEA"], Conglomerate: ["ADANIENT"],
};
const sectorOf = (sym) => { for (const [k, v] of Object.entries(SECTORS)) if (v.includes(sym)) return k; return "Others"; };

const clean = (s) => String(s || "").toUpperCase().replace(/\.(NS|BO)$/, "").trim();
const fmt = (n, d = 2) => (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const inr = (n, d = 2) => "₹" + fmt(n, d);
const sign = (n) => (n > 0 ? "+" : n < 0 ? "-" : "");
const sInr = (n) => sign(n) + inr(Math.abs(n));
const col = (n) => (n > 0 ? C.green : n < 0 ? C.red : C.dim);

/* ---------------- live prices ---------------- */
function usePrices(symbols) {
  const [prices, setPrices] = useState(() => { try { return JSON.parse(localStorage.getItem(PRICE_CACHE)) || {}; } catch { return {}; } });
  const [universe, setUniverse] = useState([]);
  const [status, setStatus] = useState("loading");
  const [updated, setUpdated] = useState(null);
  const key = [...symbols].sort().join(",");

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.allSettled([
        fetch(`${API}/stocks`, { signal: AbortSignal.timeout(25000) }).then((r) => r.json()),
        key ? fetch(`${API}/quotes?symbols=${key}`, { signal: AbortSignal.timeout(25000) }).then((r) => r.json()) : Promise.resolve({ quotes: {} }),
      ]);
      const map = {};
      if (b.status === "fulfilled") Object.values(b.value.quotes || {}).forEach((q) => { map[q.symbol] = { price: q.price, change: q.change, pct: q.change_pct }; });
      if (a.status === "fulfilled") {
        const list = Array.isArray(a.value) ? a.value : a.value.stocks || [];
        setUniverse(list.map((s) => ({ sym: clean(s.symbol), name: s.name })));
        list.forEach((s) => { if (Number(s.price) > 0) map[clean(s.symbol)] = { price: Number(s.price), change: Number(s.change) || 0, pct: Number(s.change_pct) || 0, name: s.name }; });
      }
      if (!Object.keys(map).length) throw new Error("no data");
      setPrices((prev) => { const next = { ...prev, ...map }; try { localStorage.setItem(PRICE_CACHE, JSON.stringify(next)); } catch { /* ignore */ } return next; });
      setStatus("live"); setUpdated(new Date());
    } catch { setStatus("offline"); }
  }, [key]);

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  return { prices, universe, status, updated, reload: load };
}

/* ---------------- page ---------------- */
export default function Portfolio() {
  const [pf, setPf] = useState(loadPortfolio);
  const [tab, setTab] = useState("holdings");
  const [hide, setHide] = useState(false);
  const [toast, setToast] = useState(null);
  const [expOpen, setExpOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [fundAmt, setFundAmt] = useState("");
  const ticketRef = useRef(null);
  const [tk, setTk] = useState({ sym: "RELIANCE", side: "BUY", product: "DELIVERY", type: "MARKET", qty: 1, price: "", trigger: "" });

  useEffect(() => {
    const sync = () => setPf(loadPortfolio());
    window.addEventListener("portfolio-updated", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("portfolio-updated", sync); window.removeEventListener("storage", sync); };
  }, []);

  const need = useMemo(() => {
    const s = new Set([clean(tk.sym)].filter(Boolean));
    pf.holdings.forEach((h) => s.add(h.sym));
    pf.positions.forEach((p) => s.add(p.sym));
    pf.orders.filter((o) => o.status === "OPEN").forEach((o) => s.add(o.sym));
    return [...s];
  }, [pf, tk.sym]);
  const { prices, universe, status, updated, reload } = usePrices(need);
  const mkt = marketStatus();

  const say = (message, ok = true) => { setToast({ message, ok }); setTimeout(() => setToast(null), 3600); };
  const mask = (s) => (hide ? "••••••" : s);
  const ltpOf = (sym) => prices[sym]?.price;

  /* ---- enriched data ---- */
  const holdings = useMemo(() => pf.holdings.map((h) => {
    const q = prices[h.sym]; const live = !!q; const ltp = live ? q.price : h.avgPrice;
    const invested = h.qty * h.avgPrice, current = h.qty * ltp, pl = live ? current - invested : 0;
    const tq0 = h.todayDay === todayKey() ? h.todayQty || 0 : 0, tc0 = tq0 ? h.todayCost || 0 : 0; // bought today
    return { ...h, live, ltp, invested, current, pl, plPct: invested ? (pl / invested) * 100 : 0, dayPL: live ? (h.qty - tq0) * q.change + (tq0 * q.price - tc0) : 0, dayPct: live ? q.pct : 0, sector: sectorOf(h.sym) };
  }), [pf.holdings, prices]);

  const positions = useMemo(() => pf.positions.map((p) => {
    const q = prices[p.sym]; const live = !!q && p.qty !== 0;
    const m2m = live ? (q.price - p.avgPrice) * p.qty : 0;
    return { ...p, live, ltp: q?.price, m2m, total: m2m + (p.realized || 0) };
  }), [pf.positions, prices]);
  const openPos = positions.filter((p) => p.qty !== 0);

  const tot = useMemo(() => {
    const invested = holdings.reduce((a, r) => a + r.invested, 0);
    const current = holdings.reduce((a, r) => a + r.current, 0);
    const hpl = holdings.reduce((a, r) => a + r.pl, 0);
    const hday = holdings.reduce((a, r) => a + r.dayPL, 0);
    const posTotal = positions.reduce((a, r) => a + r.total, 0);
    const margin = pf.positions.reduce((a, p) => a + (p.margin || 0), 0);
    return { invested, current, hpl, hday, posTotal, margin, pl: hpl + positions.reduce((a, r) => a + r.m2m, 0),
      day: hday + posTotal, netRealized: (pf.realizedPL || 0) - (pf.chargesPaid || 0),
      account: pf.cashBalance + current + margin + positions.reduce((a, r) => a + r.m2m, 0) };
  }, [holdings, positions, pf]);

  const alloc = holdings.filter((h) => h.current > 0).map((h) => ({ name: h.sym, value: +h.current.toFixed(2) }));

  /* ---- order ticket ---- */
  const tsym = clean(tk.sym);
  const tq = prices[tsym];
  const tltp = tq?.price;
  const estPrice = tk.type === "LIMIT" ? Number(tk.price) : tk.type === "SL" ? Number(tk.trigger) : tltp;
  const qtyN = Number(tk.qty) || 0;
  const estValue = estPrice > 0 ? estPrice * qtyN : 0;
  const estCh = estPrice > 0 && qtyN > 0 ? chargesFor(tk.side, tk.product, qtyN, estPrice).total : 0;
  const estMargin = estPrice > 0 && qtyN > 0 ? marginFor(tk.product, qtyN, estPrice) : 0;
  const isSellDel = tk.side === "SELL" && tk.product === "DELIVERY";
  const accent = tk.side === "BUY" ? C.green : C.red;
  const setT = (patch) => setTk((p) => ({ ...p, ...patch }));

  const openReview = () => {
    if (!tsym) return say("Select a stock.", false);
    if (!(tltp > 0)) return say(`Live price for ${tsym} is not available. Check the symbol and make sure the backend is running.`, false);
    setReview({ ...tk, sym: tsym, ltp: tltp });
  };
  const confirmOrder = () => {
    const r = review;
    const name = universe.find((u) => u.sym === r.sym)?.name || prices[r.sym]?.name || r.sym;
    const res = placeOrder({ sym: r.sym, name, side: r.side, type: r.type, product: r.product, qty: r.qty, price: r.price, trigger: r.trigger, ltp: r.ltp, sector: sectorOf(r.sym) });
    say(res.message, res.success);
    if (res.success) { setReview(null); setTab(res.pending ? "orders" : r.product === "INTRADAY" ? "positions" : "holdings"); }
  };
  const quick = (sym, side, product = "DELIVERY") => {
    setTk((p) => ({ ...p, sym, side, product, type: "MARKET", qty: 1 }));
    ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ---- exports ---- */
  const sheets = () => ({
    summary: [["Account value", +tot.account.toFixed(2)], ["Available funds", pf.cashBalance], ["Margin used", +tot.margin.toFixed(2)], ["Invested (holdings)", +tot.invested.toFixed(2)],
      ["Current value (holdings)", +tot.current.toFixed(2)], ["Unrealised P&L", +tot.pl.toFixed(2)], ["Realised P&L (gross)", pf.realizedPL], ["Charges paid", pf.chargesPaid], ["Net realised P&L", +tot.netRealized.toFixed(2)]],
    list: [
      { name: "Holdings", head: ["Symbol", "Qty", "Avg", "LTP", "Invested", "Current", "P&L", "P&L %"], rows: holdings.map((h) => [h.sym, h.qty, h.avgPrice, +h.ltp.toFixed(2), +h.invested.toFixed(2), +h.current.toFixed(2), +h.pl.toFixed(2), +h.plPct.toFixed(2)]) },
      { name: "Positions", head: ["Symbol", "Qty", "Avg", "LTP", "Realised", "M2M", "Total"], rows: positions.map((p) => [p.sym, p.qty, p.avgPrice, p.ltp ?? "", +(p.realized || 0).toFixed(2), +p.m2m.toFixed(2), +p.total.toFixed(2)]) },
      { name: "Orders", head: ["Time", "Symbol", "Side", "Type", "Product", "Qty", "Price", "Status"], rows: pf.orders.map((o) => [o.placedAt, o.sym, o.side, o.type, o.product, o.qty, o.avgPrice ?? o.price ?? o.trigger ?? "", o.status]) },
      { name: "Trades", head: ["Time", "Symbol", "Side", "Product", "Qty", "Price", "Value", "Charges", "P&L"], rows: pf.trades.map((t) => [t.date, t.sym, t.side, t.product, t.qty, t.price, t.value, t.charges.total, t.pnl]) },
      { name: "Funds", head: ["Time", "Type", "Note", "Amount", "Balance"], rows: pf.ledger.map((l) => [l.date, l.type, l.note, l.amount, l.balance]) },
    ],
  });
  const stampD = new Date().toISOString().slice(0, 10);
  const save = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const exportCsv = () => {
    const { summary, list } = sheets();
    const line = (a) => a.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    const out = ["STOCK FINDER - ACCOUNT REPORT", ...summary.map(line), ...list.flatMap((s) => ["", s.name.toUpperCase(), line(s.head), ...s.rows.map(line)])].join("\n");
    save(new Blob(["﻿" + out], { type: "text/csv;charset=utf-8" }), `StockFinder-Account-${stampD}.csv`); say("CSV downloaded");
  };
  const exportXlsx = async () => {
    try {
      const XLSX = await import("xlsx"); const { summary, list } = sheets(); const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Stock Finder - Account Report"], [], ...summary]), "Summary");
      list.forEach((s) => { const ws = XLSX.utils.aoa_to_sheet([s.head, ...s.rows]); ws["!cols"] = s.head.map(() => ({ wch: 16 })); XLSX.utils.book_append_sheet(wb, ws, s.name); });
      XLSX.writeFile(wb, `StockFinder-Account-${stampD}.xlsx`); say("Excel downloaded");
    } catch (e) { console.error(e); say("Excel failed. Run: npm install xlsx", false); }
  };
  const exportPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
      const { summary, list } = sheets(); const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth(); const n = (v) => (typeof v === "number" ? fmt(v) : v);
      doc.setFillColor(11, 18, 32); doc.rect(0, 0, W, 64, "F"); doc.setTextColor(255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("Stock Finder - Account Report", 40, 38); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(170, 190, 225);
      doc.text("Generated " + new Date().toLocaleString("en-IN"), W - 220, 38);
      autoTable(doc, { startY: 80, head: [["Summary", "Rs."]], body: summary.map(([k, v]) => [k, n(v)]), theme: "grid", styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] }, tableWidth: 320 });
      list.forEach((s) => {
        if (!s.rows.length) return;
        autoTable(doc, { startY: doc.lastAutoTable.finalY + 22, head: [s.head], body: s.rows.slice(0, 60).map((r) => r.map(n)), theme: "striped", styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [30, 41, 59] }, didDrawPage: () => {} });
      });
      doc.save(`StockFinder-Account-${stampD}.pdf`); say("PDF downloaded");
    } catch (e) { console.error(e); say("PDF failed. Run: npm install jspdf jspdf-autotable", false); }
  };
  const exportDoc = () => {
    const { summary, list } = sheets();
    const tbl = (head, body) => `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;font-size:10pt;border-color:#cbd5e1"><tr style="background:#1e293b;color:#fff">${head.map((h) => `<th>${h}</th>`).join("")}</tr>${body.length ? body.map((r) => `<tr>${r.map((c) => `<td>${typeof c === "number" ? fmt(c) : c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${head.length}">No data</td></tr>`}</table>`;
    const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial"><h1 style="color:#3b82f6">Stock Finder - Account Report</h1><p>Generated ${new Date().toLocaleString("en-IN")}</p><h2>Summary</h2>${tbl(["Metric", "₹"], summary)}${list.map((s) => `<h2>${s.name}</h2>${tbl(s.head, s.rows.slice(0, 80))}`).join("")}</body></html>`;
    save(new Blob(["﻿", html], { type: "application/msword" }), `StockFinder-Account-${stampD}.doc`); say("Word document downloaded");
  };

  /* ---- pill ---- */
  const pill = status === "live" ? { c: C.green, t: `LIVE · ${updated ? updated.toLocaleTimeString("en-IN") : ""}` }
    : status === "loading" ? { c: C.amber, t: "CONNECTING…" }
    : { c: C.red, t: "BACKEND OFFLINE · run: uvicorn main:app --reload" };

  const openOrders = pf.orders.filter((o) => o.status === "OPEN").length;
  const TABS = [["holdings", `Holdings (${holdings.length})`], ["positions", `Positions (${openPos.length})`], ["orders", `Orders${openOrders ? ` (${openOrders})` : ""}`], ["trades", "Trades"], ["funds", "Funds"], ["pnl", "P&L Report"]];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT, fontVariantNumeric: "tabular-nums" }}>
      <style>{`
        .pf-wrap{max-width:1320px;margin:0 auto;padding:24px 20px 60px}
        .pf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
        .pf-main{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:18px;align-items:start}
        .pf-row:hover td{background:${C.card2}}
        .pf-btn{cursor:pointer;border:none;font-weight:600;border-radius:8px;font-family:inherit}
        .pf-btn:hover:not(:disabled){filter:brightness(1.12)}
        .pf-btn:disabled{opacity:.5;cursor:not-allowed}
        .pf-scroll{overflow-x:auto}
        .pf-in{background:${C.bg};border:1px solid ${C.border};border-radius:8px;padding:10px 12px;color:${C.text};font-size:14px;outline:none;font-family:inherit;width:100%;box-sizing:border-box}
        .pf-in:focus{border-color:${C.blue}}
        @media(max-width:1050px){.pf-main{grid-template-columns:1fr}.pf-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:520px){.pf-stats{grid-template-columns:1fr}}
      `}</style>
      <Navbar />

      <div className="pf-wrap">
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>Portfolio</h1>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Pill c={pill.c}>{pill.t}</Pill>
              <Pill c={mkt.open ? C.green : C.amber}>{mkt.label} · {mkt.time} IST</Pill>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
            <button className="pf-btn" style={hdrBtn} onClick={reload}>⟳ Refresh</button>
            <button className="pf-btn" style={hdrBtn} onClick={() => setHide(!hide)}>{hide ? "Show figures" : "Hide figures"}</button>
            <button className="pf-btn" style={{ ...hdrBtn, background: C.blue, borderColor: C.blue, color: "#fff" }} onClick={() => setExpOpen(!expOpen)}>⬇ Export ▾</button>
            {expOpen && (
              <div onMouseLeave={() => setExpOpen(false)} style={{ position: "absolute", right: 90, top: "110%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, minWidth: 210, zIndex: 50, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,.45)" }}>
                {[["📄", "PDF report", exportPdf], ["📊", "Excel (.xlsx)", exportXlsx], ["📝", "Word document (.doc)", exportDoc], ["🧾", "CSV (.csv)", exportCsv]].map(([ic, l, fn]) => (
                  <div key={l} style={{ padding: "11px 16px", fontSize: 13.5, cursor: "pointer", display: "flex", gap: 10 }} onClick={() => { setExpOpen(false); fn(); }}>{ic} {l}</div>
                ))}
              </div>
            )}
            <button className="pf-btn" style={{ ...hdrBtn, color: C.red, borderColor: C.red + "55" }} onClick={() => { if (window.confirm("Reset your account? All holdings, orders and history will be cleared and funds set back to ₹10,00,000.")) { resetPortfolio(); say("Account reset"); } }}>Reset</button>
          </div>
        </div>

        {/* stats */}
        <div className="pf-stats">
          <Stat label="Current Value" value={mask(inr(tot.current))} sub={mask(`Invested ${inr(tot.invested)}`)} />
          <Stat label="Total P&L" value={mask(sInr(tot.pl))} sub={mask(`${sign(tot.invested ? tot.hpl / tot.invested * 100 : 0)}${fmt(Math.abs(tot.invested ? tot.hpl / tot.invested * 100 : 0))}% on holdings`)} color={col(tot.pl)} />
          <Stat label="Today's P&L" value={mask(sInr(tot.day))} sub={mask(`Net realised ${sInr(tot.netRealized)}`)} color={col(tot.day)} />
          <Stat label="Available Funds" value={mask(inr(pf.cashBalance))} sub={mask(`Margin used ${inr(tot.margin)}`)} />
        </div>

        <div className="pf-main">
          {/* ---------- left: tabs ---------- */}
          <div style={card}>
            <div style={{ display: "flex", gap: 2, padding: "0 10px", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
              {TABS.map(([k, l]) => (
                <button key={k} className="pf-btn" onClick={() => setTab(k)} style={{ background: "none", color: tab === k ? C.blue : C.dim, padding: "14px 14px", fontSize: 13.5, whiteSpace: "nowrap", borderRadius: 0, borderBottom: `2px solid ${tab === k ? C.blue : "transparent"}` }}>{l}</button>
              ))}
            </div>

            {/* HOLDINGS */}
            {tab === "holdings" && (holdings.length === 0
              ? <Empty icon="📭" title="No holdings yet" text="Place a Delivery order from the ticket on the right. Your shares will appear here with live prices." />
              : <Table head={["Stock", "Qty", "Avg", "LTP", "Invested", "Current", "P&L", ""]} right={[1, 2, 3, 4, 5, 6, 7]}>
                {holdings.map((r) => (
                  <tr key={r.sym} className="pf-row" style={tr}>
                    <td style={td}><b>{r.sym}</b><div style={sub}>{r.sector}</div></td>
                    <td style={tdR}>{r.qty}</td>
                    <td style={tdR}>{mask(inr(r.avgPrice))}</td>
                    <td style={tdR}>{r.live ? <><div style={{ fontWeight: 600 }}>{inr(r.ltp)}</div><div style={{ ...sub, color: col(r.dayPct) }}>{sign(r.dayPct)}{fmt(Math.abs(r.dayPct))}%</div></> : <span style={{ color: C.mute }}>n/a</span>}</td>
                    <td style={tdR}>{mask(inr(r.invested))}</td>
                    <td style={tdR}>{r.live ? mask(inr(r.current)) : "—"}</td>
                    <td style={{ ...tdR, color: col(r.pl), fontWeight: 600 }}>{r.live ? <><div>{mask(sInr(r.pl))}</div><div style={sub}>{mask(`${sign(r.plPct)}${fmt(Math.abs(r.plPct))}%`)}</div></> : "—"}</td>
                    <td style={{ ...tdR, whiteSpace: "nowrap" }}>
                      <button className="pf-btn" style={{ ...mini, background: C.green + "22", color: C.green }} onClick={() => quick(r.sym, "BUY")}>Buy</button>{" "}
                      <button className="pf-btn" style={{ ...mini, background: C.red + "22", color: C.red }} onClick={() => quick(r.sym, "SELL")}>Sell</button>
                    </td>
                  </tr>))}
              </Table>)}

            {/* POSITIONS */}
            {tab === "positions" && (positions.length === 0
              ? <Empty icon="⚡" title="No positions today" text="Intraday orders create positions. They are squared off automatically at 3:20 PM IST." />
              : <>
                <Table head={["Stock", "Product", "Qty", "Avg", "LTP", "Day P&L", ""]} right={[2, 3, 4, 5, 6]}>
                  {positions.map((p) => (
                    <tr key={p.sym + p.day} className="pf-row" style={{ ...tr, opacity: p.qty === 0 ? 0.6 : 1 }}>
                      <td style={td}><b>{p.sym}</b><div style={sub}>{p.qty === 0 ? "Closed" : p.qty > 0 ? "Long" : "Short"}</div></td>
                      <td style={td}><span style={chip(C.blue)}>INTRADAY</span></td>
                      <td style={{ ...tdR, color: p.qty < 0 ? C.red : C.text }}>{p.qty}</td>
                      <td style={tdR}>{mask(inr(p.avgPrice))}</td>
                      <td style={tdR}>{p.qty !== 0 ? (p.live ? inr(p.ltp) : "n/a") : "—"}</td>
                      <td style={{ ...tdR, color: col(p.total), fontWeight: 600 }}>{mask(sInr(p.total))}<div style={sub}>{p.qty !== 0 && `M2M ${mask(sInr(p.m2m))}`}</div></td>
                      <td style={tdR}>{p.qty !== 0 && <button className="pf-btn" style={{ ...mini, background: C.amber + "22", color: C.amber }} onClick={() => { const r = squareOff(p.sym, p.ltp); say(r.message, r.success); }}>Exit</button>}</td>
                    </tr>))}
                </Table>
                {openPos.length > 0 && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <button className="pf-btn" style={{ ...mini, background: C.amber + "22", color: C.amber, padding: "9px 16px" }} onClick={() => openPos.forEach((p) => { const r = squareOff(p.sym, p.ltp); say(r.message, r.success); })}>Exit all positions</button>
                  </div>)}
              </>)}

            {/* ORDERS */}
            {tab === "orders" && (pf.orders.length === 0
              ? <Empty icon="🧾" title="No orders yet" text="Every order you place appears here with its status." />
              : <Table head={["Time", "Stock", "Type", "Qty", "Price", "Status", ""]} right={[3, 4]}>
                {pf.orders.slice(0, 100).map((o) => (
                  <tr key={o.id} className="pf-row" style={tr}>
                    <td style={{ ...td, color: C.dim, fontSize: 12 }}>{o.placedAt}</td>
                    <td style={td}><b>{o.sym}</b> <span style={{ color: o.side === "BUY" ? C.green : C.red, fontWeight: 700, fontSize: 12 }}>{o.side}</span><div style={sub}>{o.product === "DELIVERY" ? "Delivery" : "Intraday"}</div></td>
                    <td style={td}>{o.type === "SL" ? "SL-M" : o.type}</td>
                    <td style={tdR}>{o.qty}</td>
                    <td style={tdR}>{o.avgPrice ? inr(o.avgPrice) : o.type === "LIMIT" ? inr(o.price) : o.type === "SL" ? `Trig ${inr(o.trigger)}` : "Market"}</td>
                    <td style={td}><span style={chip(o.status === "COMPLETE" ? C.green : o.status === "OPEN" ? C.blue : o.status === "REJECTED" ? C.red : C.mute)}>{o.status}</span>{o.reason && <div style={{ ...sub, maxWidth: 220, whiteSpace: "normal" }}>{o.reason}</div>}</td>
                    <td style={tdR}>{o.status === "OPEN" && <button className="pf-btn" style={{ ...mini, background: C.red + "22", color: C.red }} onClick={() => { const r = cancelOrder(o.id); say(r.message, r.success); }}>Cancel</button>}</td>
                  </tr>))}
              </Table>)}

            {/* TRADES */}
            {tab === "trades" && (pf.trades.length === 0
              ? <Empty icon="📒" title="No trades yet" text="Executed trades with charges appear here." />
              : <Table head={["Time", "Stock", "Qty", "Price", "Value", "Charges", "P&L"]} right={[2, 3, 4, 5, 6]}>
                {pf.trades.slice(0, 100).map((t) => (
                  <tr key={t.id} className="pf-row" style={tr}>
                    <td style={{ ...td, color: C.dim, fontSize: 12 }}>{t.date}</td>
                    <td style={td}><b>{t.sym}</b> <span style={{ color: t.side === "BUY" ? C.green : C.red, fontWeight: 700, fontSize: 12 }}>{t.side}</span><div style={sub}>{t.product === "DELIVERY" ? "Delivery" : "Intraday"}</div></td>
                    <td style={tdR}>{t.qty}</td><td style={tdR}>{inr(t.price)}</td><td style={tdR}>{mask(inr(t.value))}</td>
                    <td style={{ ...tdR, color: C.dim }} title={`Brokerage ${t.charges.brokerage} · STT ${t.charges.stt} · Txn ${t.charges.txn} · GST ${t.charges.gst} · Stamp ${t.charges.stamp} · SEBI ${t.charges.sebi}`}>{inr(t.charges.total)}</td>
                    <td style={{ ...tdR, color: col(t.pnl), fontWeight: 600 }}>{t.pnl ? mask(sInr(t.pnl)) : "—"}</td>
                  </tr>))}
              </Table>)}

            {/* FUNDS */}
            {tab === "funds" && (
              <div style={{ padding: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
                  <Mini label="Available funds" v={mask(inr(pf.cashBalance))} />
                  <Mini label="Margin used" v={mask(inr(tot.margin))} />
                  <Mini label="Opening balance" v={mask(inr(pf.openingBalance))} />
                  <Mini label="Charges paid" v={mask(inr(pf.chargesPaid))} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <input className="pf-in" style={{ maxWidth: 200 }} type="number" min="1" placeholder="Amount ₹" value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} />
                  <button className="pf-btn" style={{ background: C.green, color: "#fff", padding: "0 20px" }} onClick={() => { const r = addCash(fundAmt); say(r.message, r.success); if (r.success) setFundAmt(""); }}>Add funds</button>
                  <button className="pf-btn" style={{ background: C.card2, color: C.text, border: `1px solid ${C.border}`, padding: "0 20px" }} onClick={() => { const r = withdrawCash(fundAmt); say(r.message, r.success); if (r.success) setFundAmt(""); }}>Withdraw</button>
                  {[10000, 50000, 100000].map((v) => <button key={v} className="pf-btn" style={{ ...mini, background: C.card2, color: C.dim }} onClick={() => setFundAmt(String(v))}>+{fmt(v, 0)}</button>)}
                </div>
                <h3 style={{ margin: "22px 0 8px", fontSize: 15 }}>Ledger</h3>
                {pf.ledger.length === 0 ? <div style={{ color: C.mute, fontSize: 13 }}>No transactions yet.</div> : (
                  <Table head={["Time", "Details", "Amount", "Balance"]} right={[2, 3]}>
                    {pf.ledger.slice(0, 60).map((l) => (
                      <tr key={l.id} className="pf-row" style={tr}>
                        <td style={{ ...td, color: C.dim, fontSize: 12 }}>{l.date}</td><td style={td}>{l.note}</td>
                        <td style={{ ...tdR, color: col(l.amount) }}>{mask(sInr(l.amount))}</td><td style={tdR}>{mask(inr(l.balance))}</td>
                      </tr>))}
                  </Table>)}
              </div>)}

            {/* P&L REPORT */}
            {tab === "pnl" && <PnlReport pf={pf} tot={tot} mask={mask} />}
          </div>

          {/* ---------- right: order ticket + allocation ---------- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div ref={ticketRef} style={{ ...card, borderColor: accent + "66" }}>
              <div style={{ display: "flex" }}>
                {["BUY", "SELL"].map((s) => (
                  <button key={s} className="pf-btn" onClick={() => setT({ side: s })} style={{ flex: 1, padding: "14px", borderRadius: 0, fontSize: 14, background: tk.side === s ? (s === "BUY" ? C.green : C.red) : C.card2, color: tk.side === s ? "#fff" : C.dim }}>{s}</button>
                ))}
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={lbl}>Stock
                  <input className="pf-in" list="pf-universe" value={tk.sym} onChange={(e) => setT({ sym: e.target.value.toUpperCase() })} placeholder="e.g. RELIANCE" />
                  <datalist id="pf-universe">{universe.map((u) => <option key={u.sym} value={u.sym}>{u.name}</option>)}</datalist>
                </label>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", background: C.card2, borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, color: C.dim }}>Market price</span>
                  {tltp ? <span><b style={{ fontSize: 16 }}>{inr(tltp)}</b> <span style={{ fontSize: 12, color: col(tq.pct) }}>{sign(tq.pct)}{fmt(Math.abs(tq.pct))}%</span></span> : <span style={{ color: C.mute, fontSize: 13 }}>{status === "loading" ? "loading…" : "not available"}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Seg opts={[["DELIVERY", "Delivery"], ["INTRADAY", `Intraday ${LEVERAGE}x`]]} v={tk.product} on={(v) => setT({ product: v })} small />
                  <Seg opts={[["MARKET", "Market"], ["LIMIT", "Limit"], ["SL", "SL-M"]]} v={tk.type} on={(v) => setT({ type: v })} small />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: tk.type === "MARKET" ? "1fr" : "1fr 1fr", gap: 8 }}>
                  <label style={lbl}>Quantity<input className="pf-in" type="number" min="1" step="1" value={tk.qty} onChange={(e) => setT({ qty: e.target.value })} /></label>
                  {tk.type === "LIMIT" && <label style={lbl}>Limit price<input className="pf-in" type="number" min="0" step="0.05" value={tk.price} onChange={(e) => setT({ price: e.target.value })} placeholder={tltp ? String(tltp) : ""} /></label>}
                  {tk.type === "SL" && <label style={lbl}>Trigger price<input className="pf-in" type="number" min="0" step="0.05" value={tk.trigger} onChange={(e) => setT({ trigger: e.target.value })} placeholder={tltp ? String(tltp) : ""} /></label>}
                </div>
                <div style={{ fontSize: 13, color: C.dim, display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <Line k="Order value" v={inr(estValue)} />
                  <Line k="Approx. charges" v={inr(estCh)} />
                  <Line k={tk.product === "INTRADAY" ? "Margin required" : isSellDel ? "You receive" : "Funds required"} v={inr(isSellDel ? estValue - estCh : estMargin + (tk.side === "BUY" || tk.product === "INTRADAY" ? estCh : 0))} />
                  <Line k="Available funds" v={inr(pf.cashBalance)} />
                </div>
                <button className="pf-btn" disabled={!tltp || qtyN < 1} onClick={openReview} style={{ background: accent, color: "#fff", padding: 14, fontSize: 15 }}>{tk.side === "BUY" ? "Buy" : "Sell"} {tsym || ""}</button>
              </div>
            </div>

            <div style={card}>
              <div style={cardHead}>Asset Allocation</div>
              {alloc.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: C.mute, fontSize: 13 }}>No holdings yet</div> : (
                <div style={{ padding: 12 }}>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer><PieChart>
                      <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none">{alloc.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Pie>
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
                    </PieChart></ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", fontSize: 12, color: C.dim }}>
                    {alloc.map((a, i) => <span key={a.name}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length], marginRight: 5 }} />{a.name}</span>)}
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.mute, marginTop: 28 }}>
          Orders are executed at live market prices. Stock Finder is for learning and analysis. Not investment advice.
        </p>
      </div>

      {/* review modal */}
      {review && (() => {
        const px = review.type === "LIMIT" ? Number(review.price) : review.type === "SL" ? Number(review.trigger) : review.ltp;
        const q = Number(review.qty); const ch = px > 0 ? chargesFor(review.side, review.product, q, px) : { total: 0 };
        const a = review.side === "BUY" ? C.green : C.red;
        return (
          <div onClick={() => setReview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: 400, maxWidth: "100%", padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: a }}>{review.side}</span> {review.sym}</div>
                <button className="pf-btn" style={{ background: "none", color: C.dim, fontSize: 22 }} onClick={() => setReview(null)}>×</button>
              </div>
              <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
                <Line k="Order type" v={`${review.type === "SL" ? "Stop-loss market" : review.type[0] + review.type.slice(1).toLowerCase()} · ${review.product === "DELIVERY" ? "Delivery" : "Intraday"}`} />
                <Line k="Quantity" v={q} />
                <Line k="Market price" v={inr(review.ltp)} />
                {review.type === "LIMIT" && <Line k="Limit price" v={inr(Number(review.price))} />}
                {review.type === "SL" && <Line k="Trigger price" v={inr(Number(review.trigger))} />}
                <Line k="Order value" v={inr(px * q)} />
                <Line k="Approx. charges" v={inr(ch.total)} />
                <Line k="Available funds" v={inr(pf.cashBalance)} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="pf-btn" style={{ flex: 1, background: C.card2, color: C.text, padding: 12, border: `1px solid ${C.border}` }} onClick={() => setReview(null)}>Cancel</button>
                <button className="pf-btn" style={{ flex: 2, background: a, color: "#fff", padding: 12, fontSize: 15 }} onClick={confirmOrder}>Place {review.side} order</button>
              </div>
            </div>
          </div>);
      })()}

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#14532d" : "#7f1d1d", border: `1px solid ${toast.ok ? C.green : C.red}`, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 100, maxWidth: "92vw" }}>{toast.ok ? "✓ " : "✕ "}{toast.message}</div>}
    </div>
  );
}

/* ---------------- P&L report ---------------- */
function PnlReport({ pf, tot, mask }) {
  const sums = pf.trades.reduce((a, t) => { Object.keys(t.charges).forEach((k) => { a[k] = (a[k] || 0) + t.charges[k]; }); return a; }, {});
  const bySym = {};
  pf.trades.forEach((t) => { if (t.pnl) { bySym[t.sym] = (bySym[t.sym] || 0) + t.pnl; } });
  const rows = Object.entries(bySym).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
        <Mini label="Realised P&L (gross)" v={mask(sInr(pf.realizedPL || 0))} c={col(pf.realizedPL)} />
        <Mini label="Total charges" v={mask(inr(pf.chargesPaid || 0))} />
        <Mini label="Net realised P&L" v={mask(sInr(tot.netRealized))} c={col(tot.netRealized)} />
        <Mini label="Unrealised P&L" v={mask(sInr(tot.pl))} c={col(tot.pl)} />
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Charges breakdown</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 22 }}>
        {[["Brokerage", "brokerage"], ["STT", "stt"], ["Exchange txn", "txn"], ["GST", "gst"], ["Stamp duty", "stamp"], ["SEBI fees", "sebi"]].map(([l, k]) => <Mini key={k} label={l} v={mask(inr(sums[k] || 0))} />)}
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Realised P&L by stock</h3>
      {rows.length === 0 ? <div style={{ color: C.mute, fontSize: 13 }}>No closed trades yet. Sell or square off to see realised profit and loss.</div> : (
        <Table head={["Stock", "Realised P&L"]} right={[1]}>
          {rows.map(([s, v]) => <tr key={s} className="pf-row" style={tr}><td style={td}><b>{s}</b></td><td style={{ ...tdR, color: col(v), fontWeight: 600 }}>{mask(sInr(v))}</td></tr>)}
        </Table>)}
    </div>
  );
}

/* ---------------- small pieces ---------------- */
function Pill({ c, children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: c, background: c + "18", border: `1px solid ${c}44`, padding: "4px 12px", borderRadius: 999 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />{children}</span>;
}
function Stat({ label: l, value, sub: s, color }) {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
      <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px", color: color || C.text, letterSpacing: "-0.3px" }}>{value}</div>
      <div style={{ fontSize: 12.5, color: color || C.mute }}>{s}</div>
    </div>
  );
}
function Mini({ label: l, v, c }) {
  return <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}><div style={{ fontSize: 11.5, color: C.dim }}>{l}</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: c || C.text }}>{v}</div></div>;
}
function Line({ k, v }) { return <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.dim }}>{k}</span><b style={{ color: C.text, fontWeight: 600 }}>{v}</b></div>; }
function Seg({ opts, v, on, small }) {
  return (
    <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gridColumn: small ? "1 / -1" : "auto" }}>
      {opts.map(([k, l]) => <button key={k} className="pf-btn" onClick={() => on(k)} style={{ flex: 1, padding: "8px 4px", fontSize: 12, background: v === k ? C.blue : "transparent", color: v === k ? "#fff" : C.dim, borderRadius: 6 }}>{l}</button>)}
    </div>
  );
}
function Empty({ icon, title, text }) {
  return <div style={{ textAlign: "center", padding: "56px 20px" }}><div style={{ fontSize: 42, marginBottom: 8 }}>{icon}</div><div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div><p style={{ color: C.dim, fontSize: 14, margin: "8px auto 0", maxWidth: 420 }}>{text}</p></div>;
}
function Table({ head, right = [], children }) {
  return (
    <div className="pf-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ ...th, textAlign: right.includes(i) ? "right" : "left" }}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ---------------- styles ---------------- */
const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" };
const cardHead = { padding: "14px 16px", fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}` };
const th = { padding: "11px 14px", fontSize: 11, fontWeight: 600, color: C.mute, textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" };
const tr = { borderTop: `1px solid ${C.border}` };
const td = { padding: "13px 14px", fontSize: 13.5 };
const tdR = { ...td, textAlign: "right" };
const sub = { fontSize: 11.5, color: C.mute, marginTop: 2 };
const hdrBtn = { background: C.card, color: C.text, border: `1px solid ${C.border}`, padding: "9px 14px", fontSize: 13 };
const mini = { padding: "6px 12px", fontSize: 12 };
const lbl = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.dim, fontWeight: 600 };
const chip = (c) => ({ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: c, background: c + "22", padding: "3px 8px", borderRadius: 6, letterSpacing: ".3px" });