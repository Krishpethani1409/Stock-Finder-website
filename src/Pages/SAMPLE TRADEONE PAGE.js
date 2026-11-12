 
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from "recharts";
import Navbar from "../components/Navbar.jsx";
 
/* ---- WATCHLIST — with real prices ---- */
const watchlist = [
  { symbol: "RAILTEL",    name: "Railtel Corp",          price: "307.15", change: "-6.90",  pct: "-2.20%", up: false },
  { symbol: "HFCL",       name: "HFCL Ltd",              price: "206.75", change: "-8.25",  pct: "-3.84%", up: false },
  { symbol: "INDUSTOWER", name: "Indus Towers",           price: "393.15", change: "-0.40",  pct: "-0.10%", up: false },
  { symbol: "ADANIPOWER", name: "Adani Power",            price: "226.00", change: "-3.27",  pct: "-1.43%", up: false },
  { symbol: "NIFTYBEES",  name: "Nifty BeES ETF",         price: "272.13", change: "-1.30",  pct: "-0.48%", up: false },
  { symbol: "ADANIPORTS", name: "Adani Ports",            price: "1783.20",change: "-12.80", pct: "-0.71%", up: false },
  { symbol: "CGPOWER",    name: "CG Power",               price: "946.25", change: "+4.15",  pct: "+0.44%", up: true  },
  { symbol: "BHARATCOAL", name: "Bharat Coking Coal",     price: "39.50",  change: "-0.97",  pct: "-2.40%", up: false },
  { symbol: "VEDL",       name: "Vedanta Ltd",            price: "278.20", change: "+4.75",  pct: "+1.74%", up: true  },
  { symbol: "JIOFIN",     name: "Jio Financial",          price: "236.55", change: "-2.88",  pct: "-1.20%", up: false },
  { symbol: "SUZLON",     name: "Suzlon Energy",          price: "57.03",  change: "-0.11",  pct: "-0.19%", up: false },
  { symbol: "NTPC",       name: "NTPC Ltd",               price: "355.80", change: "+3.75",  pct: "+1.07%", up: true  },
  { symbol: "IRFC",       name: "IRFC Ltd",               price: "90.42",  change: "-1.35",  pct: "-1.47%", up: false },
  { symbol: "YESBANK",    name: "Yes Bank",               price: "25.19",  change: "+0.32",  pct: "+1.29%", up: true  },
  { symbol: "TMPV",       name: "Tata Motors PV",         price: "346.10", change: "-7.10",  pct: "-2.01%", up: false },
  { symbol: "RELIANCE",   name: "Reliance Industries",    price: "2847.30",change: "+34.20", pct: "+1.22%", up: true  },
  { symbol: "TCS",        name: "Tata Consultancy",       price: "3921.15",change: "+33.80", pct: "+0.87%", up: true  },
  { symbol: "INFY",       name: "Infosys Ltd",            price: "1456.80",change: "-6.30",  pct: "-0.43%", up: false },
  { symbol: "HDFC",       name: "HDFC Bank",              price: "1623.55",change: "+33.40", pct: "+2.10%", up: true  },
  { symbol: "WIPRO",      name: "Wipro Ltd",              price: "478.90", change: "-4.92",  pct: "-1.02%", up: false },
  { symbol: "TATASTEEL",  name: "Tata Steel",             price: "162.45", change: "+2.30",  pct: "+1.43%", up: true  },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",          price: "7245.60",change: "+82.40", pct: "+1.15%", up: true  },
  { symbol: "SBIN",       name: "State Bank of India",    price: "812.30", change: "-9.40",  pct: "-1.14%", up: false },
  { symbol: "ITC",        name: "ITC Ltd",                price: "418.75", change: "+3.20",  pct: "+0.77%", up: true  },
  { symbol: "MARUTI",     name: "Maruti Suzuki",          price: "12840.00",change: "+145.00",pct: "+1.14%", up: true  },
  { symbol: "ASIANPAINT", name: "Asian Paints",           price: "2234.50",change: "-18.30", pct: "-0.81%", up: false },
  { symbol: "SUNPHARMA",  name: "Sun Pharma",             price: "1678.90",change: "+12.50", pct: "+0.75%", up: true  },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement",       price: "10456.00",change: "-87.00",pct: "-0.82%", up: false },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement",       price: "10456.00",change: "-87.00",pct: "-0.82%", up: false },
  { symbol: "RVNL",       name: "Rail Vikas Nigaman LTD", price: "237.00",change: "-7.00",   pct: "-0.82%", up: true  },
];
 
/* ---- GENERATE CANDLE DATA ---- */
function generateCandles(basePrice, up, count = 120) {
  const base = parseFloat(String(basePrice).replace(/,/g, ""));
  const data = [];
  let price = base * (up ? 0.88 : 1.12);
  const months = ["Sep","Oct","Nov","Dec","2026","Feb","Mar","Apr","May","Jun","Jul"];
  let mIdx = 0, dayInMonth = 0;
 
  for (let i = 0; i < count; i++) {
    const open  = price;
    const move  = (Math.random() - (up ? 0.46 : 0.54)) * base * 0.007;
    const close = Math.max(open + move, 1);
    const high  = Math.max(open, close) + Math.random() * base * 0.004;
    const low   = Math.min(open, close) - Math.random() * base * 0.004;
    const vol   = Math.floor(Math.random() * 2000000 + 200000);
 
    dayInMonth++;
    if (dayInMonth > 10) { dayInMonth = 0; mIdx = Math.min(mIdx + 1, months.length - 1); }
 
    /* Simple MACD simulation */
    const macd  = +((close - open) / base * 8).toFixed(2);
    const signal= +((close - open) / base * 5).toFixed(2);
    const hist  = +(macd - signal).toFixed(2);
 
    price = close;
    data.push({
      label: i % 12 === 0 ? months[mIdx] : "",
      open: +open.toFixed(2), high: +high.toFixed(2),
      low:  +low.toFixed(2),  close: +close.toFixed(2),
      vol, macd, signal, hist,
      color: close >= open ? "#26a69a" : "#ef5350",
    });
  }
  return data;
}
 
/* ---- CUSTOM CANDLE SHAPE ---- */
const CandleBar = ({ x, y, width, height, payload }) => {
  if (!payload) return null;
  const { open, close, high, low } = payload;
  if (isNaN(open) || isNaN(close)) return null;
  const isUp  = close >= open;
  const color = isUp ? "#26a69a" : "#ef5350";
  const scale = height / (high - low || 0.01);
  const bodyH = Math.max(Math.abs(close - open) * scale, 1.5);
  const bodyY = y + height - (Math.max(open, close) - low) * scale;
  const midX  = x + width / 2;
  const cw    = Math.max(width - 3, 2);
  return (
    <g>
      <line x1={midX} y1={y} x2={midX} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={midX - cw / 2} y={bodyY} width={cw} height={bodyH} fill={color} />
    </g>
  );
};
 
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tt.box}>
      <div style={tt.row}><span style={tt.l}>O</span><span style={tt.v}>{d.open}</span></div>
      <div style={tt.row}><span style={tt.l}>H</span><span style={{ ...tt.v, color: "#26a69a" }}>{d.high}</span></div>
      <div style={tt.row}><span style={tt.l}>L</span><span style={{ ...tt.v, color: "#ef5350" }}>{d.low}</span></div>
      <div style={tt.row}><span style={tt.l}>C</span><span style={tt.v}>{d.close}</span></div>
      <div style={tt.row}><span style={tt.l}>Vol</span><span style={{ ...tt.v, color: "#29b6f6" }}>{(d.vol / 1000000).toFixed(2)}M</span></div>
    </div>
  );
};
const tt = {
  box: { backgroundColor: "#1e2130", border: "1px solid #2a2e39", borderRadius: "6px", padding: "8px 10px", fontSize: "11px" },
  row: { display: "flex", gap: "10px", marginBottom: "2px" },
  l:   { color: "#787b86", width: "24px" },
  v:   { color: "#d1d4dc", fontWeight: 600, fontFamily: "monospace" },
};
 
const MACDTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ ...tt.box, fontSize: "10px" }}>
      <div style={tt.row}><span style={tt.l}>MACD</span><span style={{ ...tt.v, color: "#2962ff" }}>{d.macd}</span></div>
      <div style={tt.row}><span style={tt.l}>Signal</span><span style={{ ...tt.v, color: "#ff6d00" }}>{d.signal}</span></div>
      <div style={tt.row}><span style={tt.l}>Hist</span><span style={{ ...tt.v, color: d.hist >= 0 ? "#26a69a" : "#ef5350" }}>{d.hist}</span></div>
    </div>
  );
};
 
const LEFT_TOOLS = ["☀️","✏️","📐","🔀","✒️","🗂️","🔲","➕","🔍","🔒","😊","🗑️"];
 
export default function TradePage() {
  const navigate            = useNavigate();
  const [selected, setSelected] = useState(watchlist[0]);
  const [chartData, setChartData] = useState([]);
  const [searchQ,   setSearchQ]   = useState("");
  const [activeTab, setActiveTab] = useState("mywatchlist");
  const [timeframe, setTimeframe] = useState("1D");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [livePrice, setLivePrice] = useState("");
  /* ---- INDICATORS TOGGLE ----
     What is this?  Controls whether SuperTrend line + MACD panel show
     How to use it? Click the "Indicators" button to flip this true/false
     Why we need it? Real traders want a clean candle-only view sometimes —
     this lets them remove extra overlays without leaving the page */
  const [indicatorsOn, setIndicatorsOn] = useState(true);
  const tickRef = useRef(null);
 
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
 
  useEffect(() => {
    setChartData(generateCandles(selected.price, selected.up));
    setLivePrice(selected.price);
  }, [selected]);
 
  /* Live price tick */
  useEffect(() => {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setLivePrice(prev => {
        const base = parseFloat(String(prev).replace(/,/g, "")) || parseFloat(String(selected.price).replace(/,/g, ""));
        const move = (Math.random() - 0.5) * base * 0.001;
        const next = Math.max(base + move, 0.01);
        return next.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      });
    }, 1500);
    return () => clearInterval(tickRef.current);
  }, [selected]);
 
  const filtered = watchlist.filter(s =>
    s.symbol.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQ.toLowerCase())
  );
 
  const base    = parseFloat(String(selected.price).replace(/,/g, ""));
  const livePriceNum = parseFloat(String(livePrice).replace(/,/g, ""));
  const liveUp  = livePriceNum >= base;
  const timeStr = currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
 
  return (
    <div style={s.root}>
 
      {/* ======== SHARED NAVBAR — site navigation ======== */}
      <Navbar />
 
      
 
      {/* ======== MAIN BODY ======== */}
      <div style={s.body}>
 
        {/* ---- LEFT ICON TOOLBAR ---- */}
        <div style={s.leftToolbar}>
          {LEFT_TOOLS.map((icon, i) => (
            <button key={i} style={s.toolBtn} title={icon}>{icon}</button>
          ))}
        </div>
 
        {/* ---- WATCHLIST SIDEBAR ---- */}
        <div style={s.watchlistPanel}>
          <div style={s.wlHeader}>
            <span style={s.wlTitle}>Watchlist</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={s.wlIconBtn}>⚙️</button>
              <button style={s.wlIconBtn}>✕</button>
            </div>
          </div>
 
          {/* Tabs */}
          <div style={s.wlTabs}>
            {["mywatchlist","Watchlist 1","PSU"].map(tab => (
              <button key={tab} style={{ ...s.wlTab, ...(activeTab === tab ? s.wlTabActive : {}) }}
                onClick={() => setActiveTab(tab)}>
                {tab === "mywatchlist" ? "mywatchlist" : tab}
              </button>
            ))}
            <button style={s.wlAddBtn}>＋</button>
          </div>
 
          {/* Search */}
          <div style={s.wlSearch}>
            <span style={{ color: "#787b86", fontSize: "12px" }}>🔍</span>
            <input style={s.wlSearchInput} placeholder="Search" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searchQ.length > 0 && <span style={s.wlFilterBtn}>⊞</span>}
          </div>
 
          {/* Stock List */}
          <div style={s.wlList}>
            {filtered.map(stock => (
              <div
                key={stock.symbol}
                style={{ ...s.wlRow, ...(selected.symbol === stock.symbol ? s.wlRowActive : {}) }}
                onClick={() => setSelected(stock)}
              >
                <div style={s.wlLeft}>
                  <div style={s.wlSymbol}>{stock.symbol} <span style={s.wlExchange}>NSE</span></div>
                  <div style={s.wlName}>{stock.name}</div>
                </div>
                <div style={s.wlRight}>
                  <div style={s.wlPrice}>₹{stock.price}</div>
                  <div style={{ fontSize: "11px", color: stock.up ? "#26a69a" : "#ef5350", fontWeight: 500 }}>
                    {stock.up ? "▲" : "▼"} {stock.change} ({stock.pct})
                  </div>
                </div>
              </div>
            ))}
          </div>
 
          {/* Options Quick List */}
          <div style={s.optionsBar}>OPTIONS QUICK LIST</div>
        </div>
 
        {/* ---- CHART AREA ---- */}
        <div style={s.chartPanel}>
 
          {/* Chart sub-navbar */}
          <div style={s.chartNav}>
            <div style={s.chartNavLeft}>
              <button style={{ ...s.chartNavTab, ...s.chartNavTabActive }}>Chart</button>
              <button style={s.chartNavTab}>Overview</button>
            </div>
            <div style={s.chartNavRight}>
              <span style={s.scalperMode}>⚡ SCALPER MODE ↗</span>
              <button style={s.chartIconBtn}>⛶</button>
            </div>
          </div>
 
          {/* Chart toolbar row */}
          <div style={s.chartToolbar}>
            <div style={s.chartToolLeft}>
              {/* Timeframe */}
              {["5m","15m","D"].map(tf => (
                <button key={tf} style={{ ...s.tfBtn, ...(timeframe === tf || (tf === "D" && timeframe === "1D") ? s.tfActive : {}) }}
                  onClick={() => setTimeframe(tf)}>
                  {tf}
                </button>
              ))}
              <div style={s.tfDropdown}>▾</div>
              <div style={s.divider} />
              <button style={s.chartToolBtn}>⊞</button>
              <button
                style={{ ...s.chartToolBtn, ...(indicatorsOn ? s.chartToolBtnActive : {}) }}
                onClick={() => setIndicatorsOn(!indicatorsOn)}
              >
                📈 Indicators {indicatorsOn ? "✓" : ""}
              </button>
              <button style={s.chartToolBtn}>⊡</button>
              <button style={s.chartToolBtn}>Instant Orders 🔵</button>
              <div style={s.divider} />
              <button style={s.chartToolBtn}>✦</button>
              <button style={s.chartToolBtn}>↩</button>
              <button style={s.chartToolBtn}>↪</button>
              <button style={s.chartToolBtn}>❓</button>
            </div>
            <div style={s.chartToolRight}>
              <button style={s.saveBtn}>💾 Save</button>
              <button style={s.chartIconBtn}>⚙️</button>
              <button style={s.chartIconBtn}>📷</button>
            </div>
          </div>
 
          {/* OHLC info bar */}
          <div style={s.ohlcBar}>
            <span style={s.ohlcSymbol}>{selected.symbol}</span>
            <span style={s.ohlcExchange}>· 1D · NSE</span>
            <span style={s.ohlcDot}>●</span>
            <span style={s.ohlcItem}>O <b>{selected.price}</b></span>
            <span style={s.ohlcItem}>H <b style={{ color: "#26a69a" }}>{(base * 1.012).toFixed(2)}</b></span>
            <span style={s.ohlcItem}>L <b style={{ color: "#ef5350" }}>{(base * 0.988).toFixed(2)}</b></span>
            <span style={s.ohlcItem}>C <b>{livePrice}</b></span>
            <span style={{ ...s.ohlcItem, color: liveUp ? "#26a69a" : "#ef5350" }}>
              {selected.change} ({selected.pct})
            </span>
          </div>
 
          {/* BUY / SELL + price */}
          <div style={s.buySellBar}>
            <button style={s.buyBtn}>BUY @ ₹{livePrice}</button>
            <span style={s.bsQty}>1</span>
            <button style={s.sellBtn}>SELL @ ₹{livePrice}</button>
            <div style={{ flex: 1 }} />
            <span style={s.liveTime}>{timeStr} (UTC+5:30)</span>
            <div style={s.chartModeBtns}>
              {["1D","5D","1M","3M","6M","1Y","5Y"].map(t => (
                <button key={t} style={{ ...s.rangBtn, ...(timeframe === t ? s.rangActive : {}) }}
                  onClick={() => setTimeframe(t)}>{t}</button>
              ))}
            </div>
          </div>
 
          {/* MAIN CANDLESTICK CHART */}
          <div style={{ ...s.chartBox, flex: indicatorsOn ? 4 : 6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#787b86", fontSize: 10 }} tickLine={false}
                  axisLine={{ stroke: "#2a2e39" }} interval={11} />
                <YAxis orientation="right" tick={{ fill: "#787b86", fontSize: 10 }} tickLine={false}
                  axisLine={false} tickFormatter={v => v.toLocaleString("en-IN")} width={60} domain={["auto","auto"]} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#434651", strokeDasharray: "2 2" }} />
                <Bar dataKey="high" shape={<CandleBar />} isAnimationActive={false} />
                {/* SuperTrend line — only renders when Indicators is ON */}
                {indicatorsOn && (
                  <Line type="monotone" dataKey="close" stroke="#ef5350" strokeWidth={1.2}
                    dot={false} isAnimationActive={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
 
          {/* VOLUME BAR */}
          <div style={s.volBox}>
            <span style={s.volLabel}>Volume</span>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" hide />
                <YAxis orientation="right" tick={{ fill: "#787b86", fontSize: 9 }} tickLine={false}
                  axisLine={false} width={60} tickFormatter={v => (v/1000000).toFixed(1)+"M"} />
                <Bar dataKey="vol" isAnimationActive={false}>
                  {chartData.map((d, i) => (
                    <rect key={i} fill={d.color + "99"} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
 
          {/* MACD SECTION — label bar only shows when Indicators is ON */}
          {indicatorsOn && (
            <div style={s.macdBar}>
              <span style={s.macdLabel}>MACD 12 26 close 9</span>
              <span style={{ ...s.macdVal, color: "#2962ff" }}>
                {chartData.length > 0 ? chartData[chartData.length-1].macd : "0.00"}
              </span>
              <span style={{ ...s.macdVal, color: "#ef5350", marginLeft: "8px" }}>
                {chartData.length > 0 ? chartData[chartData.length-1].signal : "0.00"}
              </span>
              <span style={{ ...s.macdVal, color: "#ef5350", marginLeft: "8px" }}>
                {chartData.length > 0 ? chartData[chartData.length-1].hist : "0.00"}
              </span>
            </div>
          )}
          <div style={{ ...s.macdBox, flex: indicatorsOn ? 2 : 0.4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#787b86", fontSize: 10 }} tickLine={false}
                  axisLine={{ stroke: "#2a2e39" }} interval={11} />
                <YAxis orientation="right" tick={{ fill: "#787b86", fontSize: 9 }} tickLine={false}
                  axisLine={false} width={60} hide={!indicatorsOn} />
                {indicatorsOn && <Tooltip content={<MACDTooltip />} cursor={{ stroke: "#434651", strokeDasharray: "2 2" }} />}
                {/* MACD histogram bars — hidden when Indicators is OFF */}
                {indicatorsOn && (
                  <Bar dataKey="hist" isAnimationActive={false}>
                    {chartData.map((d, i) => (
                      <rect key={i} fill={d.hist >= 0 ? "#26a69a99" : "#ef535099"} />
                    ))}
                  </Bar>
                )}
                {/* MACD line — hidden when Indicators is OFF */}
                {indicatorsOn && (
                  <Line type="monotone" dataKey="macd" stroke="#2962ff" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                )}
                {/* Signal line — hidden when Indicators is OFF */}
                {indicatorsOn && (
                  <Line type="monotone" dataKey="signal" stroke="#ff6d00" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                )}
 
                {/* Brush for scroll/zoom — always available regardless of Indicators toggle */}
                <Brush dataKey="label" height={20} stroke="#2a2e39" fill="#131722"
                  travellerWidth={6} startIndex={Math.max(0, chartData.length - 60)} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
 
          {/* Chart bottom bar */}
          <div style={s.chartBottomBar}>
            <span style={s.poweredBy}>Powered by TradingView Charts</span>
            <span style={s.logScale}>% log auto</span>
          </div>
        </div>
 
        {/* ---- RIGHT MINI PANEL (Price levels) ---- */}
        <div style={s.rightPanel}>
          {[
            { label: "130.43", color: "#0288d1" },
            { label: "121.94", color: "#787b86" },
            { label: `₹${livePrice}`, color: liveUp ? "#26a69a" : "#ef5350", bold: true },
          ].map((item, i) => (
            <div key={i} style={{ ...s.rightLevel, color: item.color, fontWeight: item.bold ? 700 : 500 }}>
              {item.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {["📊","📈","≡","⊞","•••"].map((icon, i) => (
            <button key={i} style={s.rightIconBtn}>{icon}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
 
const s = {
  root:       { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#131722", color: "#d1d4dc", fontFamily: "'Inter',-apple-system,sans-serif", overflow: "hidden" },
 
  /* TOP BAR */
  topBar:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: "44px", backgroundColor: "#1e2130", borderBottom: "1px solid #2a2e39", flexShrink: 0, gap: "12px" },
  topLeft:    { display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 },
  logoWrap:   { display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#3b82f6,#22c55e)", cursor: "pointer" },
  logoA:      { color: "#fff", fontSize: "11px", fontWeight: 800 },
  idxBox:     { display: "flex", alignItems: "center", gap: "6px" },
  idxName:    { fontSize: "11px", color: "#787b86", fontWeight: 600 },
  idxVal:     { fontSize: "12px", color: "#d1d4dc", fontWeight: 600, fontFamily: "monospace" },
  idxChg:     { fontSize: "11px", fontWeight: 500, fontFamily: "monospace" },
  topSearch:  { flex: 1, display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#2a2e39", borderRadius: "6px", padding: "6px 12px", maxWidth: "380px" },
  topSearchInput: { flex: 1, background: "none", border: "none", outline: "none", color: "#d1d4dc", fontSize: "12px" },
  topRight:   { display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 },
  topNavBtn:  { background: "none", border: "none", color: "#787b86", fontSize: "12px", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: 500 },
  topNavActive:{ color: "#2962ff", borderBottom: "2px solid #2962ff", borderRadius: 0 },
  topAvatar:  { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2962ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", marginLeft: "6px" },
 
  /* BODY */
  body:       { display: "flex", flex: 1, overflow: "hidden" },
 
  /* LEFT ICON TOOLBAR */
  leftToolbar:{ width: "38px", flexShrink: 0, backgroundColor: "#1e2130", borderRight: "1px solid #2a2e39", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: "2px" },
  toolBtn:    { width: "28px", height: "28px", background: "none", border: "none", color: "#787b86", fontSize: "13px", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" },
 
  /* WATCHLIST PANEL */
  watchlistPanel: { width: "240px", flexShrink: 0, backgroundColor: "#1e2130", borderRight: "1px solid #2a2e39", display: "flex", flexDirection: "column", overflow: "hidden" },
  wlHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 6px" },
  wlTitle:    { fontSize: "13px", fontWeight: 600, color: "#d1d4dc" },
  wlIconBtn:  { background: "none", border: "none", color: "#787b86", fontSize: "13px", cursor: "pointer" },
  wlTabs:     { display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid #2a2e39", gap: "2px" },
  wlTab:      { background: "none", border: "none", color: "#787b86", fontSize: "11px", padding: "7px 8px", cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  wlTabActive:{ color: "#d1d4dc", borderBottomColor: "#2962ff" },
  wlAddBtn:   { marginLeft: "auto", background: "none", border: "none", color: "#787b86", fontSize: "16px", cursor: "pointer" },
  wlSearch:   { display: "flex", alignItems: "center", gap: "6px", margin: "8px 10px", backgroundColor: "#131722", borderRadius: "6px", padding: "6px 10px" },
  wlSearchInput: { flex: 1, background: "none", border: "none", outline: "none", color: "#d1d4dc", fontSize: "12px" },
  wlFilterBtn:{ color: "#787b86", fontSize: "13px", cursor: "pointer" },
  wlList:     { flex: 1, overflowY: "auto" },
  wlRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #1a1e2e" },
  wlRowActive:{ backgroundColor: "#1a2332", borderLeft: "2px solid #2962ff" },
  wlLeft:     { display: "flex", flexDirection: "column", gap: "1px" },
  wlSymbol:   { fontSize: "12.5px", fontWeight: 600, color: "#d1d4dc" },
  wlExchange: { fontSize: "9.5px", color: "#787b86", marginLeft: "4px" },
  wlName:     { fontSize: "10px", color: "#787b86" },
  wlRight:    { textAlign: "right" },
  wlPrice:    { fontSize: "12px", fontWeight: 600, color: "#d1d4dc", fontFamily: "monospace" },
  optionsBar: { backgroundColor: "#131722", borderTop: "1px solid #2a2e39", padding: "9px 12px", fontSize: "10.5px", color: "#2962ff", fontWeight: 600, letterSpacing: "0.03em", cursor: "pointer" },
 
  /* CHART PANEL */
  chartPanel: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#131722" },
  chartNav:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", borderBottom: "1px solid #2a2e39", height: "34px", flexShrink: 0 },
  chartNavLeft: { display: "flex", gap: "0" },
  chartNavTab:  { background: "none", border: "none", color: "#787b86", fontSize: "12px", padding: "6px 14px", cursor: "pointer", borderBottom: "2px solid transparent" },
  chartNavTabActive: { color: "#d1d4dc", borderBottomColor: "#2962ff" },
  chartNavRight: { display: "flex", alignItems: "center", gap: "8px" },
  scalperMode:  { fontSize: "11px", color: "#2962ff", fontWeight: 600, cursor: "pointer" },
  chartIconBtn: { background: "none", border: "none", color: "#787b86", fontSize: "13px", cursor: "pointer" },
 
  /* Chart toolbar */
  chartToolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", borderBottom: "1px solid #1e2130", flexShrink: 0 },
  chartToolLeft:{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" },
  chartToolRight:{ display: "flex", alignItems: "center", gap: "4px" },
  tfBtn:       { background: "none", border: "none", color: "#787b86", fontSize: "11.5px", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  tfActive:    { backgroundColor: "#2a2e39", color: "#d1d4dc" },
  tfDropdown:  { color: "#787b86", fontSize: "12px", cursor: "pointer" },
  divider:     { width: "1px", height: "16px", backgroundColor: "#2a2e39", margin: "0 4px" },
  chartToolBtn:{ background: "none", border: "none", color: "#787b86", fontSize: "11.5px", padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap", borderRadius: "4px" },
  chartToolBtnActive: { backgroundColor: "#1a2740", color: "#2962ff" },
  saveBtn:     { display: "flex", alignItems: "center", gap: "4px", background: "none", border: "1px solid #2a2e39", color: "#d1d4dc", fontSize: "11px", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" },
 
  /* OHLC bar */
  ohlcBar:     { display: "flex", alignItems: "center", gap: "10px", padding: "4px 12px", flexShrink: 0, flexWrap: "wrap" },
  ohlcSymbol:  { fontSize: "13px", fontWeight: 700, color: "#d1d4dc" },
  ohlcExchange:{ fontSize: "11px", color: "#787b86" },
  ohlcDot:     { fontSize: "10px", color: "#26a69a" },
  ohlcItem:    { fontSize: "11.5px", color: "#787b86" },
 
  /* BUY/SELL bar */
  buySellBar:  { display: "flex", alignItems: "center", gap: "8px", padding: "5px 12px", borderBottom: "1px solid #1e2130", flexShrink: 0 },
  buyBtn:      { backgroundColor: "#26a69a", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
  bsQty:       { backgroundColor: "#2a2e39", color: "#d1d4dc", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 },
  sellBtn:     { backgroundColor: "#ef5350", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
  liveTime:    { fontSize: "11px", color: "#787b86", fontFamily: "monospace", marginLeft: "auto" },
  chartModeBtns: { display: "flex", gap: "2px" },
  rangBtn:     { background: "none", border: "none", color: "#787b86", fontSize: "11px", padding: "4px 7px", cursor: "pointer", borderRadius: "3px" },
  rangActive:  { backgroundColor: "#2a2e39", color: "#d1d4dc" },
 
  /* Chart boxes */
  chartBox:    { flex: 4, minHeight: 0 },
  volBox:      { flex: 1, minHeight: 0, position: "relative" },
  volLabel:    { position: "absolute", top: "4px", left: "12px", fontSize: "10px", color: "#787b86", zIndex: 1 },
  macdBar:     { display: "flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderTop: "1px solid #1e2130", flexShrink: 0 },
  macdLabel:   { fontSize: "10.5px", color: "#787b86" },
  macdVal:     { fontSize: "10.5px", fontWeight: 600, fontFamily: "monospace" },
  macdBox:     { flex: 2, minHeight: 0 },
  chartBottomBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 12px", borderTop: "1px solid #1e2130", flexShrink: 0 },
  poweredBy:   { fontSize: "10px", color: "#787b86" },
  logScale:    { fontSize: "10px", color: "#787b86" },
 
  /* RIGHT PANEL */
  rightPanel:  { width: "64px", flexShrink: 0, backgroundColor: "#1e2130", borderLeft: "1px solid #2a2e39", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: "6px" },
  rightLevel:  { fontSize: "11px", fontFamily: "monospace", fontWeight: 500 },
  rightIconBtn:{ width: "36px", height: "36px", background: "none", border: "none", color: "#787b86", fontSize: "14px", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" },
};