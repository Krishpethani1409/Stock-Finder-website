// ============================================================
//  ScreenerSearch.jsx  →  src/Pages/ScreenerSearch.jsx
//  Search landing page for the screener. Live suggestions come
//  from your backend GET /stocks (all 29 stocks with live prices).
//  Any NSE symbol still works: type it and press Enter.
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const API = "http://localhost:8000";
const C = {
  bg: "#0b1220", card: "#111c31", card2: "#16233d", border: "#22304d",
  text: "#e8eefc", dim: "#8fa3c7", mute: "#5d7096", blue: "#3b82f6", green: "#22c55e", red: "#ef4444",
};
const POPULAR = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "SBIN", "TATASTEEL", "ITC", "WIPRO"];
const clean = (s) => String(s || "").toUpperCase().replace(/\.(NS|BO)$/, "");
const f2 = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ScreenerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [stocks, setStocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_screener_list")) || []; } catch { return []; }
  });
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API}/stocks`, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const d = await r.json();
        const list = (Array.isArray(d) ? d : d.stocks || []).map((s) => ({
          symbol: clean(s.symbol), name: s.name || clean(s.symbol), price: Number(s.price), pct: Number(s.change_pct) || 0,
        }));
        if (alive && list.length) {
          setStocks(list); setLive(true);
          try { localStorage.setItem("sf_screener_list", JSON.stringify(list)); } catch { /* ignore */ }
        }
      } catch { if (alive) setLive(false); }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stocks.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 7);
  }, [query, stocks]);

  const go = (sym) => { const v = clean(sym.trim()); if (v) navigate(`/screener/${v}`); };
  const submit = () => (matches[hi] ? go(matches[hi].symbol) : go(query));

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") submit();
    else if (e.key === "Escape") setOpen(false);
  };

  const quick = POPULAR.map((s) => stocks.find((x) => x.symbol === s) || { symbol: s, name: s });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 20px 60px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 800, fontFamily: "'Sora',sans-serif", letterSpacing: "-1px" }}>
          Stock <span style={{ color: C.blue }}>Screener</span>
        </h1>
        <p style={{ color: C.dim, margin: "12px 0 30px", fontSize: 15 }}>
          Live fundamentals, charts, peers and financials for Indian stocks.
        </p>

        <div style={{ position: "relative", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${open && matches.length ? C.blue : C.border}`, borderRadius: 14, padding: "8px 8px 8px 18px" }}>
            <span style={{ fontSize: 18, opacity: 0.7 }}>🔍</span>
            <input
              autoFocus value={query} placeholder="Search a company, e.g. RELIANCE or Tata Steel"
              onChange={(e) => { setQuery(e.target.value); setHi(0); setOpen(true); }}
              onKeyDown={onKey} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 15, padding: "10px 0", fontFamily: "inherit" }}
            />
            <button onClick={submit} style={{ background: C.blue, color: "#fff", border: "none", padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
          </div>

          {open && matches.length > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", zIndex: 20, boxShadow: "0 16px 40px rgba(0,0,0,.5)" }}>
              {matches.map((m, i) => (
                <div key={m.symbol} onMouseDown={() => go(m.symbol)} onMouseEnter={() => setHi(i)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", cursor: "pointer", background: i === hi ? C.card2 : "transparent" }}>
                  <div><b>{m.symbol}</b> <span style={{ color: C.mute, fontSize: 13, marginLeft: 8 }}>{m.name}</span></div>
                  {Number.isFinite(m.price) && (
                    <div style={{ fontSize: 13 }}>₹{f2(m.price)} <span style={{ color: m.pct >= 0 ? C.green : C.red, marginLeft: 6 }}>{m.pct >= 0 ? "▲" : "▼"} {f2(Math.abs(m.pct))}%</span></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 34, color: C.mute, fontSize: 13 }}>
          Popular right now {live ? <span style={{ color: C.green }}>● live prices</span> : <span style={{ color: "#f59e0b" }}>● backend offline</span>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 14 }}>
          {quick.map((s) => (
            <button key={s.symbol} onClick={() => go(s.symbol)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: "10px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ fontWeight: 700 }}>{s.symbol}</div>
              {Number.isFinite(s.price) && <div style={{ fontSize: 12, color: s.pct >= 0 ? C.green : C.red }}>₹{f2(s.price)} · {s.pct >= 0 ? "+" : "-"}{f2(Math.abs(s.pct))}%</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}