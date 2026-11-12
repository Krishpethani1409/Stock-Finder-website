import { useState, useEffect, useRef } from "react";
import {
  ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from "recharts";
import Navbar from "../components/Navbar.jsx";
 
const watchlist = [
  { symbol: "HFCL",       name: "HFCL Ltd",             price: "209.61",  change: "+9.98",  pct: "+5.00%", up: true  },
  { symbol: "INDUSTOWER", name: "Indus Towers",          price: "411.85",  change: "-2.45",  pct: "-0.59%", up: false },
  { symbol: "ADANIPOWER", name: "Adani Power",           price: "231.25",  change: "+0.68",  pct: "+0.29%", up: true  },
  { symbol: "NIFTYBEES",  name: "Nifty BeES ETF",        price: "272.80",  change: "-1.17",  pct: "-0.43%", up: false },
  { symbol: "ADANIPORTS", name: "Adani Ports",           price: "1840.90", change: "-1.20",  pct: "-0.07%", up: false },
  { symbol: "CGPOWER",    name: "CG Power",              price: "959.30",  change: "+4.85",  pct: "+0.51%", up: true  },
  { symbol: "VEDL",       name: "Vedanta Ltd",           price: "300.90",  change: "-5.10",  pct: "-1.67%", up: false },
  { symbol: "JIOFIN",     name: "Jio Financial",         price: "243.77",  change: "-0.33",  pct: "-0.14%", up: false },
  { symbol: "SUZLON",     name: "Suzlon Energy",         price: "59.18",   change: "+0.74",  pct: "+1.27%", up: true  },
  { symbol: "NTPC",       name: "NTPC Ltd",              price: "365.30",  change: "+3.35",  pct: "+0.93%", up: true  },
  { symbol: "IRFC",       name: "IRFC Ltd",              price: "99.64",   change: "-0.49",  pct: "-0.49%", up: false },
  { symbol: "YESBANK",    name: "Yes Bank",              price: "25.51",   change: "+0.03",  pct: "+0.12%", up: true  },
  { symbol: "RELIANCE",   name: "Reliance Industries",   price: "2847.30", change: "+34.20", pct: "+1.22%", up: true  },
  { symbol: "TCS",        name: "Tata Consultancy",      price: "3921.15", change: "+33.80", pct: "+0.87%", up: true  },
  { symbol: "INFY",       name: "Infosys Ltd",           price: "1456.80", change: "-6.30",  pct: "-0.43%", up: false },
  { symbol: "HDFC",       name: "HDFC Bank",             price: "1623.55", change: "+33.40", pct: "+2.10%", up: true  },
  { symbol: "WIPRO",      name: "Wipro Ltd",             price: "478.90",  change: "-4.92",  pct: "-1.02%", up: false },
];
 
/* ---- GENERATE 60 CANDLES (more candles = scrollable/zoomable chart) ---- */
function generateChartData(basePrice, up) {
  const base = parseFloat(basePrice.replace(/,/g, ""));
  const data = [];
  let price = base * (up ? 0.94 : 1.06);
  let h = 9, m = 15;
 
  for (let i = 0; i < 60; i++) {
    const open  = price;
    const move  = (Math.random() - (up ? 0.46 : 0.54)) * base * 0.006;
    const close = Math.max(open + move, 1);
    const high  = Math.max(open, close) + Math.random() * base * 0.003;
    const low   = Math.min(open, close) - Math.random() * base * 0.003;
    const vol   = Math.floor(Math.random() * 800 + 200);
    price = close;
 
    const time = `${h}:${m.toString().padStart(2, "0")}`;
    m += 5;
    if (m >= 60) { m = 0; h++; }
 
    data.push({
      time,
      open:  +open.toFixed(2),
      high:  +high.toFixed(2),
      low:   +low.toFixed(2),
      close: +close.toFixed(2),
      vol,
      color: close >= open ? "#22c55e" : "#ef4444",
    });
  }
  return data;
}
 
/* ---- CUSTOM CANDLE SHAPE ---- */
const CustomCandle = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const color   = close >= open ? "#22c55e" : "#ef4444";
  const bodyTop = Math.min(open, close);
  const bodyH   = Math.abs(close - open) || (high - low) * 0.02;
  const scale   = height / (high - low || 1);
  const bTop    = (bodyTop - low) * scale;
  const bH      = Math.max(bodyH * scale, 1.5);
  const midX    = x + width / 2;
  const cw      = Math.max(width * 0.6, 3);
  return (
    <g>
      <line x1={midX} y1={y} x2={midX} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={midX - cw / 2} y={y + height - bTop - bH} width={cw} height={bH} fill={color} rx={1} />
    </g>
  );
};
 
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tt.box}>
      <p style={tt.time}>{label}</p>
      <div style={tt.row}><span style={tt.lbl}>Open</span><span style={tt.val}>₹{d.open}</span></div>
      <div style={tt.row}><span style={tt.lbl}>High</span><span style={{ ...tt.val, color: "#22c55e" }}>₹{d.high}</span></div>
      <div style={tt.row}><span style={tt.lbl}>Low</span><span style={{ ...tt.val, color: "#ef4444" }}>₹{d.low}</span></div>
      <div style={tt.row}><span style={tt.lbl}>Close</span><span style={tt.val}>₹{d.close}</span></div>
      <div style={tt.row}><span style={tt.lbl}>Volume</span><span style={{ ...tt.val, color: "#60a5fa" }}>{d.vol}K</span></div>
    </div>
  );
};
const tt = {
  box: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" },
  time:{ color: "#64748b", marginBottom: "6px", fontWeight: 600 },
  row: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "1px 0" },
  lbl: { color: "#64748b" },
  val: { color: "#f1f5f9", fontWeight: 600 },
};
 
export default function ChartPage() {
  const [selected,    setSelected]    = useState(watchlist[0]);
  const [chartData,   setChartData]   = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTime,  setActiveTime]  = useState("5m");
  const [livePrice,   setLivePrice]   = useState(selected.price);
  const tickRef = useRef(null);
 
  useEffect(() => {
    setChartData(generateChartData(selected.price, selected.up));
    setLivePrice(selected.price);
  }, [selected]);
 
  /* ---- LIVE TICKER ----
     What is this?  Makes the price flicker slightly every 2s
     How to use it? Purely visual — runs automatically
     Why we need it? Makes the page feel like a real live terminal */
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const base = parseFloat(selected.price.replace(/,/g, ""));
        const move = (Math.random() - 0.5) * base * 0.0015;
        const newClose = Math.max(last.close + move, 1);
        setLivePrice(newClose.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          close: +newClose.toFixed(2),
          high: Math.max(last.high, newClose),
          low: Math.min(last.low, newClose),
          color: newClose >= last.open ? "#22c55e" : "#ef4444",
        };
        return updated;
      });
    }, 2000);
    return () => clearInterval(tickRef.current);
  }, [selected]);
 
  const filtered = watchlist.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
 
  const base = parseFloat(selected.price.replace(/,/g, ""));
  const liveUp = parseFloat(String(livePrice).replace(/,/g, "")) >= base;
 
  return (
    <div style={s.root}>
      <Navbar />
 
      <div style={s.main}>
 
        {/* LEFT WATCHLIST */}
        <div style={s.sidebar}>
          <div style={s.sideHeader}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.03em" }}>📋 WATCHLIST</span>
            <span style={s.countBadge}>{watchlist.length}</span>
          </div>
          <div style={s.sideSearch}>
            <span style={{ fontSize: "13px" }}>🔍</span>
            <input
              style={s.sideInput}
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={s.stockList}>
            {filtered.map(stock => (
              <div
                key={stock.symbol}
                style={{ ...s.stockRow, ...(selected.symbol === stock.symbol ? s.activeRow : {}) }}
                onClick={() => setSelected(stock)}
              >
                <div>
                  <div style={s.stockSym}>{stock.symbol}</div>
                  <div style={s.stockName}>{stock.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={s.stockPrice}>₹{stock.price}</div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: stock.up ? "#22c55e" : "#ef4444" }}>
                    {stock.up ? "▲" : "▼"} {stock.pct}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* RIGHT CHART */}
        <div style={s.chartArea}>
 
          {/* Stock header */}
          <div style={s.chartTopBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "17px", fontWeight: 800, color: "#f1f5f9" }}>{selected.symbol}</span>
              <span style={s.exchangeBadge}>NSE</span>
              <span style={{ fontSize: "11px", color: liveUp ? "#22c55e" : "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={s.liveDot(liveUp)} /> LIVE
              </span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>₹{livePrice}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: selected.up ? "#22c55e" : "#ef4444" }}>
                {selected.up ? "▲" : "▼"} {selected.change} ({selected.pct})
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={s.buyBtn}>BUY @ ₹{selected.price}</button>
              <button style={s.sellBtn}>SELL @ ₹{selected.price}</button>
            </div>
          </div>
 
          {/* Timeframe row */}
          <div style={s.tfRow}>
            {["1m","5m","15m","1h","1D","1W","1M","1Y"].map(tf => (
              <button
                key={tf}
                style={{ ...s.tfBtn, ...(activeTime === tf ? s.tfActive : {}) }}
                onClick={() => setActiveTime(tf)}
              >
                {tf}
              </button>
            ))}
            <span style={{ color: "#1e293b", margin: "0 8px" }}>|</span>
            <span style={s.hint}>🖱️ Drag the bottom bar to zoom / scroll the chart</span>
          </div>
 
          {/* OHLC bar */}
          <div style={s.ohlcBar}>
            <span style={s.ohlcItem}>O <b style={{ color: "#f1f5f9" }}>₹{selected.price}</b></span>
            <span style={s.ohlcItem}>H <b style={{ color: "#22c55e" }}>₹{(base * 1.012).toFixed(2)}</b></span>
            <span style={s.ohlcItem}>L <b style={{ color: "#ef4444" }}>₹{(base * 0.988).toFixed(2)}</b></span>
            <span style={s.ohlcItem}>C <b style={{ color: "#f1f5f9" }}>₹{livePrice}</b></span>
            <span style={s.ohlcItem}>Vol <b style={{ color: "#60a5fa" }}>52.7K</b></span>
          </div>
 
          {/* CANDLESTICK CHART — zoomable via Brush */}
          <div style={{ flex: 1, padding: "10px 12px 4px", minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="68%">
              <ComposedChart data={chartData} margin={{ top: 6, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} minTickGap={30} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v.toLocaleString("en-IN")}`} width={72} domain={["auto","auto"]} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155", strokeDasharray: "3 3" }} />
                <Bar dataKey="high" shape={<CustomCandle />} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
 
            <ResponsiveContainer width="100%" height="20%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Bar dataKey="vol" radius={[2,2,0,0]}>
                  {chartData.map((entry, i) => (
                    <rect key={i} fill={entry.color + "55"} />
                  ))}
                </Bar>
                {/* ---- BRUSH ----
                    What is this?  A draggable mini-chart for zoom/scroll
                    How to use it? Drag the handles below to zoom into a range
                    Why we need it? This is what makes the chart "movable" */}
                <Brush
                  dataKey="time"
                  height={28}
                  stroke="#3b82f6"
                  fill="#0f172a"
                  travellerWidth={8}
                  startIndex={Math.max(0, chartData.length - 30)}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
 
const s = {
  root:         { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter',-apple-system,sans-serif", overflow: "hidden" },
  main:         { display: "flex", flex: 1, overflow: "hidden" },
  sidebar:      { width: "250px", flexShrink: 0, backgroundColor: "#0a0f1e", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden" },
  sideHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px" },
  countBadge:   { fontSize: "11px", color: "#475569", backgroundColor: "#1e293b", padding: "2px 9px", borderRadius: "999px", fontWeight: 600 },
  sideSearch:   { display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", margin: "0 10px 8px", backgroundColor: "#111c33", borderRadius: "8px" },
  sideInput:    { flex: 1, background: "none", border: "none", outline: "none", color: "#f1f5f9", fontSize: "13px" },
  stockList:    { flex: 1, overflowY: "auto" },
  stockRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderLeft: "2px solid transparent" },
  activeRow:    { backgroundColor: "#15233f", borderLeft: "2px solid #3b82f6" },
  stockSym:     { fontSize: "13px", fontWeight: 700, color: "#f1f5f9" },
  stockName:    { fontSize: "11px", color: "#475569", marginTop: "2px" },
  stockPrice:   { fontSize: "13px", fontWeight: 600, color: "#f1f5f9" },
  chartArea:    { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  chartTopBar:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", backgroundColor: "#0a0f1e", borderBottom: "1px solid #1e293b", flexWrap: "wrap", gap: "10px", flexShrink: 0 },
  exchangeBadge:{ fontSize: "11px", color: "#64748b", backgroundColor: "#1e293b", padding: "2px 8px", borderRadius: "5px", fontWeight: 600 },
  liveDot: (up) => ({ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: up ? "#22c55e" : "#ef4444", display: "inline-block" }),
  buyBtn:       { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
  sellBtn:      { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
  tfRow:        { display: "flex", alignItems: "center", gap: "2px", padding: "8px 18px", borderBottom: "1px solid #1e293b", flexShrink: 0 },
  tfBtn:        { background: "none", border: "none", color: "#64748b", fontSize: "12px", padding: "5px 11px", borderRadius: "6px", cursor: "pointer", fontWeight: 500 },
  tfActive:     { backgroundColor: "#1e293b", color: "#f1f5f9" },
  hint:         { fontSize: "11px", color: "#3b5277" },
  ohlcBar:      { display: "flex", gap: "1.5rem", padding: "8px 18px", borderBottom: "1px solid #1e293b", flexShrink: 0 },
  ohlcItem:     { fontSize: "12px", color: "#64748b", display: "flex", gap: "4px" },
};
 