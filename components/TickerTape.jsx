import { useState, useEffect, useRef } from "react";
 
const C = {
  bg:"#0a0d14", border:"#2a2e3d",
  green:"#00b386", red:"#e5314a",
  white:"#ffffff", sec:"#787b86",
};
 
/* ── LIVE DATA FROM YOUR BACKEND ──
   GET /indices → NIFTY, SENSEX, BANKNIFTY
   GET /stocks  → all 29 stocks
   Refreshes every 30s. Keeps the last prices if the API is offline. */
const API = "http://localhost:8000";
const CACHE = "sf_ticker_cache";

function useLiveStocks() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE)) || []; } catch { return []; }
  });
  const [status, setStatus] = useState("loading"); /* live | offline | loading */

  useEffect(() => {
    let alive = true;
    const get = async (path) => {
      const r = await fetch(API + path, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(path + " HTTP " + r.status);
      return r.json();
    };
    const load = async () => {
      const [ix, st] = await Promise.allSettled([get("/indices"), get("/stocks")]);
      const out = [];
      if (ix.status === "fulfilled") {
        (ix.value.indices || []).forEach(x => {
          if (Number.isFinite(Number(x.value)))
            out.push({ sym: String(x.name).toUpperCase(), price: Number(x.value), chg: Number(x.change) || 0, pct: Number(x.change_pct) || 0 });
        });
      }
      if (st.status === "fulfilled") {
        const list = Array.isArray(st.value) ? st.value : st.value.stocks || [];
        list.forEach(x => {
          if (Number(x.price) > 0)
            out.push({ sym: String(x.symbol).replace(/\.(NS|BO)$/, ""), price: Number(x.price), chg: Number(x.change) || 0, pct: Number(x.change_pct) || 0 });
        });
      }
      if (!alive) return;
      if (out.length) {
        setItems(out);
        setStatus("live");
        try { localStorage.setItem(CACHE, JSON.stringify(out)); } catch { /* ignore */ }
      } else {
        setStatus("offline");
        console.warn("[TickerTape] API not reachable");
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return { items, status };
}
 
export default function TickerTape() {
  const { items: STOCKS, status } = useLiveStocks();
  const trackRef  = useRef(null);
  const [speed,   setSpeed]   = useState(120);   /* seconds for one loop */
  const [paused,  setPaused]  = useState(false);
  const [isDrag,  setIsDrag]  = useState(false);
  const dragStartX = useRef(0);
  const dragScrollX = useRef(0);
 
  /* ── DRAG TO SCROLL ── */
  const onMouseDown = (e) => {
    setIsDrag(true);
    setPaused(true);
    dragStartX.current = e.clientX;
    dragScrollX.current = trackRef.current?.scrollLeft || 0;
  };
 
  const onMouseMove = (e) => {
    if (!isDrag || !trackRef.current) return;
    const dx = e.clientX - dragStartX.current;
    trackRef.current.scrollLeft = dragScrollX.current - dx;
  };
 
  const onMouseUp = () => {
    setIsDrag(false);
    setTimeout(() => setPaused(false), 800);
  };
 
  return (
    <div style={s.wrap}>
      {/* LIVE badge */}
      <div style={s.liveBadge}>
        <span style={{ ...s.liveDot, backgroundColor: status === "live" ? C.green : "#f59e0b" }} />
        <span style={{ color: status === "live" ? C.green : "#f59e0b" }}>{status === "live" ? "LIVE" : status === "offline" ? "OFFLINE" : "LOADING"}</span>
      </div>
 
      {/* Scrolling track */}
      <div
        ref={trackRef}
        style={{ ...s.track, cursor: isDrag ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseEnter={() => setSpeed(180)}   /* slow down on hover */
        onMouseOut={() => setSpeed(120)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "max-content",
            animation: paused ? "none" : `tickerRun ${speed}s linear infinite`,
          }}
        >
          {STOCKS.length === 0 && (
            <span style={{ color: C.sec, fontSize: 12, paddingLeft: 16 }}>
              {status === "loading" ? "Fetching live prices…" : "Backend offline — run: uvicorn main:app --reload"}
            </span>
          )}
          {/* Render twice for seamless loop */}
          {[...STOCKS, ...STOCKS].map((st, i) => {
            const live = st;
            const up   = live.chg >= 0;
            return (
              <span key={i} style={s.item}>
                {/* Symbol */}
                <span style={s.sym}>{st.sym}</span>
 
                {/* Price */}
                <span style={s.price}>
                  {live.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
 
                {/* Change */}
                <span style={{ ...s.chg, color: up ? C.green : C.red }}>
                  {up ? "▲" : "▼"}{" "}
                  {Math.abs(live.chg).toFixed(2)}{" "}
                  <span style={s.pct}>({Math.abs(live.pct).toFixed(2)}%)</span>
                </span>
 
                {/* Separator */}
                <span style={s.sep}>|</span>
              </span>
            );
          })}
        </div>
      </div>
 
      {/* Speed controls */}
      {/* <div style={s.controls}>
        <button style={s.ctrlBtn} title="Slower" onClick={() => setSpeed(s => Math.min(s + 10, 80))}>‹‹</button>
        <button style={s.ctrlBtn} title={paused ? "Play" : "Pause"} onClick={() => setPaused(p => !p)}>
          {paused ? "▶" : "⏸"}
        </button>
        <button style={s.ctrlBtn} title="Faster" onClick={() => setSpeed(s => Math.max(s - 10, 15))}>››</button>
      </div> */}
 
      <style>{`
        @keyframes sfPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        @keyframes tickerRun {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
 
const s = {
  wrap:     {
    display: "flex",
    alignItems: "center",
    backgroundColor: C.bg,
    borderBottom: `1px solid ${C.border}`,
    height: 36,
    overflow: "hidden",
    userSelect: "none",
    position: "relative",
  },
  liveBadge:{
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0 12px",
    borderRight: `1px solid ${C.border}`,
    fontSize: 10,
    fontWeight: 700,
    color: C.green,
    letterSpacing: "0.08em",
    flexShrink: 0,
    height: "100%",
  },
  liveDot:  {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: C.green,
    animation: "sfPulse 1.5s infinite",
    display: "inline-block",
  },
  track:    {
    flex: 1,
    overflow: "hidden",
    height: "100%",
    display: "flex",
    alignItems: "center",
  },
  item:     {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    paddingRight: 20,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  sym:      { color: C.sec,   fontWeight: 600, fontFamily: "monospace", fontSize: 11 },
  price:    { color: C.white, fontWeight: 700, fontFamily: "monospace" },
  chg:      { fontWeight: 600, fontFamily: "monospace", fontSize: 11 },
  pct:      { fontSize: 10, opacity: 0.85 },
  sep:      { color: C.border, margin: "0 4px" },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "0 8px",
    borderLeft: `1px solid ${C.border}`,
    flexShrink: 0,
    height: "100%",
  },
  ctrlBtn:  {
    background: "none",
    border: "none",
    color: C.sec,
    fontSize: 11,
    cursor: "pointer",
    padding: "2px 5px",
    borderRadius: 4,
    lineHeight: 1,
  },
};