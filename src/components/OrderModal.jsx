import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder, loadPortfolio, marginFor, chargesFor, marketStatus } from "../store/portfolioStore.js";

/* Order window (broker style). Opens when you click B or S.
   Orders go to the same trading engine as the Portfolio page. */
const API = "http://localhost:8000";
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const css = `
.om-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:12px}
.om{width:420px;max-width:100%;background:#131927;border:1px solid #1e293b;border-radius:10px;overflow:hidden;color:#d1d4dc;font-family:'Inter',system-ui,sans-serif;font-size:12px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.om-h{padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start}
.om-h.buy{background:linear-gradient(90deg,#0a6b52,#00b386)}.om-h.sell{background:linear-gradient(90deg,#a3182f,#e5314a)}
.om-h b{font-size:15px;color:#fff;display:block}.om-h small{color:#ffffffcc;font-size:11px}
.om-x{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}
.om-ltp{text-align:right;color:#fff}.om-ltp b{font-size:16px;font-family:ui-monospace,Menlo,monospace}
.om-sw{display:flex;background:#0E1320;margin:14px 16px 0;border-radius:6px;padding:3px}
.om-sw button{flex:1;border:0;background:none;color:#787b86;padding:7px;border-radius:4px;font-weight:700;cursor:pointer;font-size:12px}
.om-sw .b.on{background:#00b386;color:#fff}.om-sw .s.on{background:#e5314a;color:#fff}
.om-body{padding:14px 16px;display:flex;flex-direction:column;gap:12px}
.om-l{font-size:10px;color:#787b86;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;display:block}
.om-seg{display:flex;gap:6px}
.om-seg button{flex:1;background:#0E1320;border:1px solid #1e293b;color:#d1d4dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600}
.om-seg button.on{border-color:#2962ff;color:#2962ff;background:#16233d}
.om-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.om-in{width:100%;background:#0E1320;border:1px solid #1e293b;color:#fff;border-radius:5px;padding:9px 10px;font-size:13px;font-family:ui-monospace,Menlo,monospace;outline:none}
.om-in:focus{border-color:#2962ff}.om-in:disabled{opacity:.45}
.om-info{background:#0E1320;border:1px solid #1e293b;border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:5px;font-size:11px}
.om-info div{display:flex;justify-content:space-between}.om-info span:last-child{font-family:ui-monospace,Menlo,monospace;color:#fff}
.om-go{margin:0 16px 16px;border:0;border-radius:6px;padding:12px;font-size:13px;font-weight:800;color:#fff;cursor:pointer}
.om-go.buy{background:#00b386}.om-go.sell{background:#e5314a}.om-go:disabled{opacity:.5;cursor:not-allowed}
.om-msg{margin:0 16px 14px;padding:8px 10px;border-radius:6px;font-size:11px;line-height:1.4}
.om-msg.ok{background:#00b38622;color:#00b386}.om-msg.err{background:#e5314a22;color:#e5314a}
.om-mk{font-size:10px;padding:2px 8px;border-radius:99px;background:#ffffff22;color:#fff;margin-left:6px}
`;

export default function OrderModal({ open, sym, name, side: side0, ltp: ltp0, onClose }) {
  const navigate = useNavigate();
  const [side, setSide] = useState("BUY");
  const [product, setProduct] = useState("DELIVERY");
  const [type, setType] = useState("MARKET");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [trigger, setTrigger] = useState("");
  const [ltp, setLtp] = useState(ltp0 || 0);
  const [chg, setChg] = useState(null);
  const [msg, setMsg] = useState(null);
  const [cash, setCash] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSide(side0 === "SELL" ? "SELL" : "BUY"); setProduct("DELIVERY"); setType("MARKET");
    setQty(1); setPrice(""); setTrigger(""); setMsg(null); setLtp(ltp0 || 0); setChg(null);
    setCash(loadPortfolio().cashBalance);
  }, [open, sym, side0, ltp0]);

  // keep the price live while the window is open
  useEffect(() => {
    if (!open || !sym) return;
    let alive = true;
    const go = async () => {
      try {
        const r = await fetch(`${API}/quotes?symbols=${sym}`, { signal: AbortSignal.timeout(15000) });
        const q = (await r.json()).quotes?.[sym];
        if (alive && q && q.price > 0) { setLtp(q.price); setChg(q); }
      } catch { /* keep last price */ }
    };
    go();
    const id = setInterval(go, 10000);
    return () => { alive = false; clearInterval(id); };
  }, [open, sym]);

  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  const q = Math.max(0, Math.floor(Number(qty) || 0));
  const px = type === "LIMIT" ? Number(price) || 0 : ltp;
  const calc = useMemo(() => {
    if (!q || !px) return { margin: 0, ch: 0, value: 0 };
    return { margin: marginFor(product, q, px), ch: chargesFor(side, product, q, px).total, value: q * px };
  }, [q, px, product, side]);

  if (!open) return null;
  const ms = marketStatus();

  const submit = () => {
    const res = placeOrder({ sym, name, side, type, product, qty: q, ltp, price: Number(price), trigger: Number(trigger) });
    setMsg({ ok: res.success, text: res.message });
    if (res.success) { setCash(loadPortfolio().cashBalance); if (!res.pending) setTimeout(onClose, 1600); }
  };

  return (
    <div className="om-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <style>{css}</style>
      <div className="om">
        <div className={"om-h " + (side === "BUY" ? "buy" : "sell")}>
          <div><b>{sym}<span className="om-mk">{ms.open ? "OPEN" : "CLOSED"}</span></b><small>{name} · NSE</small></div>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div className="om-ltp"><b>{ltp ? inr(ltp) : "—"}</b>
              {chg && <small style={{ display: "block" }}>{chg.change >= 0 ? "▲" : "▼"} {Math.abs(chg.change).toFixed(2)} ({Math.abs(chg.change_pct).toFixed(2)}%)</small>}</div>
            <button className="om-x" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="om-sw">
          <button className={"b" + (side === "BUY" ? " on" : "")} onClick={() => setSide("BUY")}>BUY</button>
          <button className={"s" + (side === "SELL" ? " on" : "")} onClick={() => setSide("SELL")}>SELL</button>
        </div>
        <div className="om-body">
          <div><label className="om-l">Product</label>
            <div className="om-seg">
              <button className={product === "DELIVERY" ? "on" : ""} onClick={() => setProduct("DELIVERY")}>Delivery (CNC)</button>
              <button className={product === "INTRADAY" ? "on" : ""} onClick={() => setProduct("INTRADAY")}>Intraday (5x)</button>
            </div></div>
          <div className="om-row">
            <div><label className="om-l">Quantity</label>
              <input className="om-in" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div><label className="om-l">Price</label>
              <input className="om-in" type="number" step="0.05" disabled={type !== "LIMIT"} placeholder={type === "LIMIT" ? "Limit price" : "At market"} value={type === "LIMIT" ? price : ""} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
          <div><label className="om-l">Order type</label>
            <div className="om-seg">
              {[["MARKET", "Market"], ["LIMIT", "Limit"], ["SL", "Stop-loss"]].map(([k, l]) => (
                <button key={k} className={type === k ? "on" : ""} onClick={() => setType(k)}>{l}</button>))}
            </div></div>
          {type === "SL" && (
            <div><label className="om-l">Trigger price</label>
              <input className="om-in" type="number" step="0.05" placeholder={side === "BUY" ? "Above current price" : "Below current price"} value={trigger} onChange={(e) => setTrigger(e.target.value)} /></div>)}
          <div className="om-info">
            <div><span>Order value</span><span>{inr(calc.value)}</span></div>
            <div><span>Margin required</span><span>{inr(calc.margin)}</span></div>
            <div><span>Est. charges</span><span>{inr(calc.ch)}</span></div>
            <div><span>Available funds</span><span>{inr(cash)}</span></div>
          </div>
        </div>
        {msg && <div className={"om-msg " + (msg.ok ? "ok" : "err")}>{msg.text}{msg.ok && <> · <a style={{ color: "inherit", textDecoration: "underline", cursor: "pointer" }} onClick={() => navigate("/portfolio")}>View Portfolio</a></>}</div>}
        <button className={"om-go " + (side === "BUY" ? "buy" : "sell")} disabled={!ltp || !q} onClick={submit}>
          {side === "BUY" ? "BUY" : "SELL"} {q || ""} {sym}
        </button>
      </div>
    </div>
  );
}
