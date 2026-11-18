import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import Navbar from "../components/Navbar.jsx";
import { buyStock } from "../store/portfolioStore.js";
 
/* ── EXACT ANGEL ONE COLOR TOKENS ── */
const C = {
  bg:        "#131722",   /* page background */
  surface:   "#1e2130",   /* card background */
  border:    "#2a2e3d",   /* divider / border */
  green:     "#00b386",   /* Angel One teal-green */
  red:       "#e5314a",   /* Angel One red */
  blue:      "#2962ff",   /* Angel One blue accent */
  textPri:   "#d1d4dc",   /* primary text */
  textSec:   "#787b86",   /* secondary/label text */
  textWeak:  "#4a4e5a",   /* very muted text */
  white:     "#ffffff",
};
 
/* ── INDEX AREA CHART DATA ── */
const areaData = [
  { t:"09:30", v:24359 }, { t:"09:45", v:24312 }, { t:"10:00", v:24280 },
  { t:"10:15", v:24265 }, { t:"10:30", v:24300 }, { t:"10:45", v:24245 },
  { t:"11:00", v:24210 }, { t:"11:15", v:24190 }, { t:"11:30", v:24220 },
  { t:"11:45", v:24175 }, { t:"12:00", v:24150 }, { t:"12:15", v:24130 },
  { t:"12:30", v:24110 }, { t:"12:45", v:24095 }, { t:"13:00", v:24120 },
  { t:"13:15", v:24085 }, { t:"13:30", v:24068 }, { t:"13:45", v:24040 },
  { t:"14:00", v:24020 }, { t:"14:15", v:24005 }, { t:"14:30", v:23985 },
];
 
const indices = [
  { name:"NIFTY",    val:"23,844.65", chg:"-549.85", pct:"-2.26%", up:false },
  { name:"SENSEX",   val:"78,264.10", chg:"-1,786.62",pct:"-2.23%",up:false },
  { name:"BANKNIFTY",val:"50,715.50", chg:"-887.20", pct:"-1.72%", up:false },
  { name:"FINNIFTY", val:"24,362.80", chg:"-487.25", pct:"-2.00%", up:false },
  { name:"MIDCPNIFTY",val:"14,394.35",chg:"-262.25", pct:"-1.72%", up:false },
  { name:"INDIA VIX", val:"13.05",    chg:"+3.48",   pct:"+39.58%",up:true  },
];
 
/* ── MOST BOUGHT ── */
const mostBought = [
  { sym:"IDEA",    name:"VODAFONE IDEA LIMITED",    price:"13.94", chg:"+0.09", pct:"+0.65%", up:true  },
  { sym:"YESBANK", name:"YES BANK LIMITED",          price:"22.42", chg:"-0.39", pct:"-2.46%", up:false },
  { sym:"JPPOWER", name:"JAIPRAKASH POWER VEN...",   price:"15.92", chg:"-0.64", pct:"-3.84%", up:false },
  { sym:"RPOWER",  name:"RELIANCE POWER LTD.",       price:"26.50", chg:"-0.46", pct:"-1.84%", up:false },
  { sym:"IRB",     name:"IRB INFRA DEV LTD.",        price:"20.06", chg:"-0.42", pct:"-2.05%", up:false },
];
 
/* ── GAINERS / IT SECTOR ── */
const gainers = [
  { sym:"KALYANKJL",  name:"Kalyan Jewellers Ind Ltd",   ltp:"₹271.90", chg:"₹17.05", pct:"+6.91%" },
  { sym:"ATHERNENRG", name:"Ather Energy Limited",       ltp:"₹1,109.30",chg:"₹48.70", pct:"+4.21%" },
  { sym:"MCX",        name:"Multi Commodity Exchange",    ltp:"₹7,107.60",chg:"₹54.40", pct:"+3.44%" },
  { sym:"CHENNPETRO", name:"Chennai Petroleum Corp Lt",  ltp:"₹1,108.40",chg:"₹22.30", pct:"+2.09%" },
  { sym:"ACUTAAS",    name:"Acutaas Chemicals Limited",  ltp:"₹3,462.50",chg:"₹72.60", pct:"+2.14%" },
];
const itSector = [
  { sym:"PINELABS",  name:"Pine Labs Limited",           ltp:"₹142.17", chg:"-₹5.70",  pct:"-3.91%", up:false },
  { sym:"WIPRO",     name:"Wipro Ltd",                   ltp:"₹173.11", chg:"+₹0.11",  pct:"+0.08%", up:true  },
  { sym:"SWIGGY",    name:"Swiggy Limited",              ltp:"₹265.27", chg:"-₹6.00",  pct:"-0.25%", up:false },
  { sym:"SONATSOFTW",name:"Sonata Software Limited",     ltp:"₹278.30", chg:"-₹9.60",  pct:"-3.43%", up:false },
  { sym:"BSOFT",     name:"Brilsoft Limited",            ltp:"₹272.75", chg:"-₹9.90",  pct:"-3.56%", up:false },
];
 
/* ── TOP PERFORMERS ── */
const topPerf = [
  { sym:"LODHA",      name:"Lodha Developers U...", pct:"+31.94%", price:"₹1,105.40", chg:"+42.80 (+4.02%)", up:true,  color:"#2962ff" },
  { sym:"HCLTECH",    name:"HCL Technologies Lt",   pct:"+19.71%", price:"₹1,143.80", chg:"-24.40 (-2.09%)", up:false, color:"#2962ff" },
  { sym:"ADANIENSOL", name:"Adani Energy Solutio...",pct:"+9.06%",  price:"₹1,005.80", chg:"+49.90 (+5.23%)", up:true,  color:"#e5314a" },
  { sym:"INFY",       name:"Infosys Limited",        pct:"+9.35%",  price:"₹1,263.90", chg:"-9.90 (-0.50%)",  up:false, color:"#2962ff" },
];
 
/* ── TECHNICAL SCREENERS ── */
const techScreeners = [
  { sym:"NYKAA",      name:"Nykaa Commerce Vent...",ltp:"₹216.30", chg:"+₹45.10", pct:"+9.96%" },
  { sym:"NATIONALUM", name:"National Aluminium...", ltp:"₹248.90", chg:"+₹9.00",  pct:"+3.89%" },
  { sym:"KALYANKJL",  name:"Kalyan Jewellers Ind...",ltp:"₹371.90",chg:"+₹17.00", pct:"+4.84%" },
  { sym:"LTFOODS",    name:"LT Foods Limited",      ltp:"₹383.15", chg:"+₹41.65", pct:"+10.43%"},
  { sym:"INDUSTOWER", name:"Indus Towers Limited",  ltp:"₹387.25", chg:"+₹44.40", pct:"+1.16%" },
];
 
/* ── TRADING SIGNALS ── */
const signals = [
  { sym:"SUNPHARMA",  name:"Sun Pharmaceutical Ind L", price:"₹1,878.80", chg:"-24.80 (-1.29%)", pattern:"Doji\n(Neutral)", up:false },
  { sym:"BAJFINANCE", name:"Bajaj Finance Limited",     price:"₹1,007.30", chg:"-35.20 (-3.38%)", pattern:"Bearish\n(Bearish)", up:false },
  { sym:"GRASIM",     name:"Grasim Industries Ltd",     price:"₹3,125.50", chg:"-65.40 (-2.05%)", pattern:"Piercing Line\n(Bullish)", up:true  },
];
 
/* ── RESEARCH ── */
const research = [
  { sym:"DLF",     name:"DLF Limited",        tag:"Closed at ₹934.30", ltp:"₹0 (0%)", sl:"647.00", entry:"629.00 - 642.00", target:"626.00", potential:"PROFIT ACHIEVED 0.74%", color:"#00b386" },
  { sym:"MPHASIS", name:"Mphasis Limited",    tag:"Closed at ₹2260.00",ltp:"₹0 (0%)", sl:"2,220.00",entry:"2,267.00 - 2,270.00",target:"2,370.00",potential:"LOSS BOOKED 0.44%", color:"#e5314a" },
  { sym:"LICI",    name:"Life Insura Corp Of India",tag:"Closed at ₹429.90",ltp:"₹0 (0%)",sl:"438.00",entry:"430.00 - 430.00",target:"2,600.00",potential:"LOSS BOOKED 2.36%", color:"#e5314a" },
  { sym:"AURUM",   name:"Aurum Proptech Limited",tag:"",ltp:"₹0 (0%)",sl:"221.00",entry:"228.00 - 231.00",target:"260.00",potential:"LOSS I", color:"#e5314a" },
];
 
/* ── POCKET FRIENDLY ── */
const pocket = [
  { sym:"NSLNISP", name:"NMDC STEEL LIMITED",      price:"₹42.45", chg:"-₹0.81", pct:"-1.87%", up:false },
  { sym:"OLAELEC", name:"OLA ELECTRIC MOBILITY...", price:"₹41.33", chg:"-₹0.03", pct:"-0.05%", up:false },
  { sym:"SAGILITY",name:"SAGILITY LIMITED",         price:"₹40.01", chg:"-₹0.49", pct:"-1.10%", up:false },
  { sym:"MSUMI",   name:"MOTHERSON SUMI WRN...",    price:"₹40.75", chg:"-₹0.36", pct:"-1.34%", up:false },
  { sym:"TTML",    name:"TATA TELESERV(MAHAR...",   price:"₹40.29", chg:"-₹1.33", pct:"-3.19%", up:false },
];
 
/* ── CORPORATE ACTIONS ── */
const corpActions = [
  { co:"SIMPLEX CASTINGS LTD.",          ratio:"10:2", ex:"2026-07-10" },
  { co:"INDIAN TONERS & DEVELOPERS LTD", ratio:"10:2", ex:"2026-07-17" },
  { co:"Kotak Nifty PSU Bank ETF",       ratio:"10:1", ex:"2026-07-19" },
  { co:"MANGALAM WORLDWIDE LTD",         ratio:"10:1", ex:"2026-07-10" },
];
 
/* ── NEWS ── */
const news = [
  { title:"Adani Ports, JSW Infra to gain from container boom", src:"Flipitmoney", tags:["ADANIPORTS"], time:"3 mins" },
  { title:"Denmark's PM vows to protect Greenland against U.S. control", src:"Flipitmoney", tags:[], time:"4 mins" },
  { title:"Ola Electric responds to supplier bankruptcy petitions", src:"Flipitmoney", tags:["OLAELEC"], time:"4 mins" },
];
 
/* ── CUSTOM TOOLTIP ── */
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 9px", fontSize: 11, color: C.textPri }}>
      ₹{payload[0].value.toLocaleString("en-IN")}
    </div>
  );
};
 
 
const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");
 
function useMarketData() {
  const [liveIndices, setLiveIndices] = useState(null);
  const [liveGainers, setLiveGainers] = useState(null);
  const [liveLosers,  setLiveLosers]  = useState(null);
  const [apiStatus,   setApiStatus]   = useState("loading");
 
  useEffect(() => {
    const load = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API}/indices`),
          fetch(`${API}/gainers`),
        ]);
        const idx  = await r1.json();
        const gain = await r2.json();
 
        // /indices returns: { indices: [{name, value, change, change_pct, up}] }
        if (idx.indices?.length) {
          setLiveIndices(idx.indices.map(i => ({
            name: i.name,
            val:  i.value.toLocaleString("en-IN", {minimumFractionDigits:2}),
            chg:  (i.change >= 0 ? "+" : "") + i.change.toFixed(2),
            pct:  (i.change_pct >= 0 ? "+" : "") + i.change_pct.toFixed(2) + "%",
            up:   i.up,
          })));
        }
 
        // /gainers returns: { gainers: [{symbol, name, price, change, change_pct, up}] }
        if (gain.gainers?.length) {
          setLiveGainers(gain.gainers.map(s => ({
            sym:  s.symbol,
            name: s.name,
            ltp:  "₹" + s.price.toLocaleString("en-IN", {minimumFractionDigits:2}),
            chg:  (s.change >= 0 ? "+" : "") + "₹" + Math.abs(s.change).toFixed(2),
            pct:  (s.change_pct >= 0 ? "+" : "") + s.change_pct.toFixed(2) + "%",
          })));
        }
 
        if (gain.losers?.length) {
          setLiveLosers(gain.losers.map(s => ({
            sym:  s.symbol,
            name: s.name,
            ltp:  "₹" + s.price.toLocaleString("en-IN", {minimumFractionDigits:2}),
            chg:  (s.change >= 0 ? "+" : "-") + "₹" + Math.abs(s.change).toFixed(2),
            pct:  (s.change_pct >= 0 ? "+" : "") + s.change_pct.toFixed(2) + "%",
          })));
        }
 
        setApiStatus("live");
      } catch {
        setApiStatus("offline");
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);
 
  return { liveIndices, liveGainers, liveLosers, apiStatus };
}
 
export default function MarketsPage() {
  const navigate = useNavigate();
  const { liveIndices, liveGainers, liveLosers, apiStatus } = useMarketData();

  /* ── BUY HANDLER — saves to Portfolio via localStorage ── */
  const handleBuy = (sym, name, priceStr, sector="Equity") => {
    const price = parseFloat(String(priceStr).replace(/[₹,]/g,""));
    if (!price || isNaN(price)) return alert("Invalid price for "+sym);
    const qty = Number(prompt(`Buy ${sym} @ ₹${price.toLocaleString("en-IN")}\nEnter quantity:`, "1"));
    if (!qty || isNaN(qty) || qty < 1) return;
    const res = buyStock(sym, name, qty, price, sector);
    alert(res.message + "\n\nCheck your Portfolio page!");
  };
  const [tfIdx, setTfIdx]     = useState(0);
  const [gainTab, setGainTab] = useState("gainers");
  const [pktTab, setPktTab]   = useState("<₹50");
  const [caTab,  setCaTab]    = useState("Split");
  const [sigTab, setSigTab]   = useState("Candlesticks");
 
  const tfs = ["1D -2.07%", "1W -0.58%", "1M +3.14%", "1Y -6.56%", "All"];
 
  return (
    <div style={s.root}>
      <Navbar />
      <div style={{backgroundColor:apiStatus==="live"?"#052e16":apiStatus==="offline"?"#1f0a0a":"#131722",borderBottom:"1px solid #2a2e3d",padding:"5px 20px",display:"flex",alignItems:"center",gap:10,fontSize:11,minHeight:28}}>
        {apiStatus==="live"    && <span style={{color:"#00b386",fontWeight:700}}>● LIVE DATA · Updates every 60s</span>}
        {apiStatus==="offline" && <span style={{color:"#e5314a",fontWeight:700}}>● OFFLINE — run: uvicorn main:app --reload</span>}
        {apiStatus==="loading" && <span style={{color:"#787b86"}}>● Connecting...</span>}
      </div>
 
      {/* ── SUB NAV ── */}
      {/* <div style={s.subNav}> */}
        {/* <div style={s.subNavInner}>
          {["Stock Discovery","Index F&O","Stocks F&O","Commodities","All Indices","News"].map((t,i)=>(
            <button key={t} style={{ ...s.subNavBtn, ...(i===0 ? s.subNavActive : {}) }}>{t}</button>
          ))}
        </div> */}
      {/* </div> */}
 
      <div style={s.page}>
 
        {/* ═══════════ INDEX OVERVIEW ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Index Overview</span>
            <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
          </div>
 
          {/* Index chips */}
          <div style={s.indexChips}>
            {(liveIndices || indices).map(idx=>(
              <div key={idx.name} style={s.idxChip}>
                <span style={s.idxName}>{idx.name}</span>
                <span style={s.idxVal}>{idx.val}</span>
                <span style={{ ...s.idxChg, color: idx.up ? C.green : C.red }}>
                  {idx.up?"▲":"▼"} {idx.chg} ({idx.pct})
                </span>
              </div>
            ))}
          </div>
 
          {/* Area chart + Day High/Low */}
          <div style={s.chartRow}>
            <div style={s.hlPanel}>
              <div style={s.hlTitle}>Day's High/Low</div>
              <div style={s.hlBar}>
                <div style={s.hlBarFill} />
              </div>
              <div style={s.hlRow}>
                <div>
                  <div style={{ ...s.hlVal, color: C.red }}>23845.00</div>
                  <div style={s.hlLbl}>Low</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ ...s.hlVal, color: C.green }}>24300.00</div>
                  <div style={s.hlLbl}>High</div>
                </div>
              </div>
              <div style={s.ohlcRow}>
                {[["Open","24,259.55"],["High","24,300.00","green"],["Low","23,845.00","red"],["Close","24,208.70"]].map(([l,v,c])=>(
                  <div key={l}>
                    <div style={s.ohlcLbl}>{l}</div>
                    <div style={{ ...s.ohlcVal, color: c==="green"?C.green:c==="red"?C.red:C.white }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
 
            <div style={s.areaPanel}>
              {/* TF buttons */}
              <div style={s.tfRow}>
                {tfs.map((t,i)=>(
                  <button key={t} style={{ ...s.tfBtn, ...(tfIdx===i?s.tfActive:{}) }} onClick={()=>setTfIdx(i)}>{t}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={areaData} margin={{ top:4, right:0, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.red} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={C.red} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fill:C.textSec, fontSize:10 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis hide domain={["auto","auto"]} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="v" stroke={C.red} strokeWidth={1.5} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
 
        {/* ═══════════ MOST BOUGHT ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Most Bought Stocks</span>
            <button style={s.viewAll} onClick={()=>navigate("/screener")}>VIEW ALL &rsaquo;</button>
          </div>
          <div style={s.mostBoughtRow}>
            {mostBought.map(s2=>(
              <div key={s2.sym} style={s.mbCard} onClick={()=>navigate(`/stock/${s2.sym}`)}>
                <div style={s.mbIconWrap}>
                  <div style={s.mbIcon}>{s2.sym.slice(0,2)}</div>
                </div>
                <div style={s.mbSym}>{s2.sym}</div>
                <div style={s.mbName}>{s2.name}</div>
                <div style={s.mbPrice}>₹{s2.price}</div>
                <div style={{ ...s.mbChg, color: s2.up ? C.green : C.red }}>
                  {s2.up?"▲":"▼"} {s2.chg} ({s2.pct})
                </div>
                <button
                  style={{ width:"100%", marginTop:8, backgroundColor:"#00b38622", color:C.green,
                    border:"1px solid #00b38644", padding:"6px", borderRadius:6, fontSize:11,
                    fontWeight:700, cursor:"pointer" }}
                  onClick={(e)=>{ e.stopPropagation(); handleBuy(s2.sym, s2.name, s2.price); }}>
                  + Buy
                </button>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ TOP MOVERS ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Top Movers and Sectorwise Movements</span>
          </div>
          <div style={s.tabRow}>
            {["Gainers","Losers"].map(t=>(
              <button key={t} style={{ ...s.tabBtn, ...(gainTab===t.toLowerCase()?s.tabActive:{}) }}
                onClick={()=>setGainTab(t.toLowerCase())}>{t}</button>
            ))}
            <div style={{ flex:1 }} />
            {["Index","Market Cap","Sector"].map(f=>(
              <button key={f} style={s.filterBtn}>{f} ▾</button>
            ))}
            <button style={{ ...s.filterBtn, backgroundColor:"#162032", color:C.blue }}>IT · Software</button>
            <button style={s.filterBtn}>Finance/NBFC</button>
          </div>
          <div style={s.moversGrid}>
            <div style={s.moversTable}>
              <div style={{...s.moversTHead, gridTemplateColumns:"2fr 1fr 1fr 1fr 0.7fr"}}>
                <span>Stock ⇅</span><span>LTP ⇅</span><span>Chng ⇅</span><span style={{ textAlign:"right" }}>%Chng ⇅</span><span></span>
              </div>
              {(gainTab==="gainers" ? (liveGainers||gainers) : (liveLosers||itSector)).map(r=>(
                <div key={r.sym} style={{...s.moversRow, gridTemplateColumns:"2fr 1fr 1fr 1fr 0.7fr"}} onClick={()=>navigate(`/stock/${r.sym}`)}>
                  <div><div style={s.moversSymbol}>{r.sym}</div><div style={s.moversName}>{r.name}</div></div>
                  <span style={s.moversLtp}>{r.ltp}</span>
                  <span style={{ color:C.green, fontSize:12 }}>{r.chg}</span>
                  <span style={{ ...s.moversPct, backgroundColor:"#052e16", color:C.green }}>{r.pct}</span>
                  <button style={{backgroundColor:"#00b38622",color:C.green,border:"1px solid #00b38644",padding:"3px 7px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer"}}
                    onClick={(e)=>{e.stopPropagation();handleBuy(r.sym,r.name,r.ltp);}}>Buy</button>
                </div>
              ))}
              <button style={s.viewAllInline}>VIEW ALL &rsaquo;</button>
            </div>
            <div style={s.moversTable}>
              <div style={{...s.moversTHead, gridTemplateColumns:"2fr 1fr 1fr 1fr 0.7fr"}}>
                <span>Stock ⇅</span><span>LTP ⇅</span><span>Chng ⇅</span><span style={{ textAlign:"right" }}>%Chng ⇅</span><span></span>
              </div>
              {itSector.map(r=>(
                <div key={r.sym} style={{...s.moversRow, gridTemplateColumns:"2fr 1fr 1fr 1fr 0.7fr"}} onClick={()=>navigate(`/stock/${r.sym}`)}>
                  <div><div style={s.moversSymbol}>{r.sym}</div><div style={s.moversName}>{r.name}</div></div>
                  <span style={s.moversLtp}>{r.ltp}</span>
                  <span style={{ color: r.up?C.green:C.red, fontSize:12 }}>{r.chg}</span>
                  <span style={{ ...s.moversPct, backgroundColor: r.up?"#052e16":"#1f0a0a", color: r.up?C.green:C.red }}>{r.pct}</span>
                  <button style={{backgroundColor:"#00b38622",color:C.green,border:"1px solid #00b38644",padding:"3px 7px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer"}}
                    onClick={(e)=>{e.stopPropagation();handleBuy(r.sym,r.name,r.ltp);}}>Buy</button>
                </div>
              ))}
              <button style={s.viewAllInline}>VIEW ALL &rsaquo;</button>
            </div>
          </div>
        </div>
 
        {/* ═══════════ TOP PERFORMERS ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Top Performers</span>
            <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
          </div>
          <div style={s.tabRow}>
            {["1 Week","1 Month","1 Year","5 Year"].map((t,i)=>(
              <button key={t} style={{ ...s.tabBtn, ...(i===0?s.tabActive:{}) }}>{t}</button>
            ))}
            <div style={{ flex:1 }} />
            <button style={s.filterBtn}>Large Cap ▾</button>
          </div>
          <div style={s.perfGrid}>
            {topPerf.map(p=>(
              <div key={p.sym} style={s.perfCard} onClick={()=>navigate(`/stock/${p.sym}`)}>
                <div style={s.perfTop}>
                  <div style={{ ...s.perfAvatar, backgroundColor: p.color }}>{p.sym.slice(0,2)}</div>
                  <span style={{ ...s.perfBadge, color:C.green, backgroundColor:"#052e16" }}>{p.pct}</span>
                </div>
                <div style={s.perfSym}>{p.sym}</div>
                <div style={s.perfName}>{p.name}</div>
                <div style={s.perfPrice}>{p.price}</div>
                <div style={{ fontSize:11, color: p.up?C.green:C.red }}>{p.chg}</div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ TECHNICAL SCREENERS ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Technical Screeners</span>
            <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
          </div>
          <div style={s.tabRow}>
            {["Simple Pivot","RSI List","MACD","SMA","EMA"].map((t,i)=>(
              <button key={t} style={{ ...s.tabBtn, ...(i===0?s.tabActive:{}) }}>{t}</button>
            ))}
            <div style={{ flex:1 }} />
            <button style={s.filterBtn}>Nifty 500 ▾</button>
            <button style={s.filterBtn}>Positive Breakdown ▾</button>
          </div>
          <div style={s.techGrid}>
            {techScreeners.map(r=>(
              <div key={r.sym} style={s.techCard} onClick={()=>navigate(`/stock/${r.sym}`)}>
                <div style={s.techSym}>{r.sym}</div>
                <div style={s.techName}>{r.name}</div>
                <div style={s.techLtp}>{r.ltp}</div>
                <div style={{ fontSize:11, color:C.green }}>{r.chg} <span style={{ backgroundColor:"#052e16", color:C.green, padding:"1px 6px", borderRadius:3, marginLeft:4 }}>{r.pct}</span></div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ TRADING SIGNALS ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Trading Signals</span>
            <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
          </div>
          <div style={s.tabRow}>
            {["Candlesticks","Chart Patterns","Price Action"].map(t=>(
              <button key={t} style={{ ...s.tabBtn, ...(sigTab===t?s.tabActive:{}) }} onClick={()=>setSigTab(t)}>{t}</button>
            ))}
          </div>
          <div style={s.signalsGrid}>
            {signals.map(sig=>(
              <div key={sig.sym} style={s.signalCard} onClick={()=>navigate(`/stock/${sig.sym}`)}>
                <div style={s.signalIcon}>
                  {sig.pattern.includes("Bullish") ? "📈" : sig.pattern.includes("Bearish") ? "📉" : "✛"}
                  <div style={{ fontSize:10, color: sig.up?C.green:C.red, textAlign:"center", marginTop:3, lineHeight:1.3 }}>
                    {sig.pattern}
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={s.signalSym}>{sig.sym}</div>
                  <div style={s.signalName}>{sig.name}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={s.signalPrice}>{sig.price}</div>
                  <div style={{ fontSize:11, color:C.red }}>{sig.chg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ RESEARCH RECOMMENDATIONS ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Research Recommendations</span>
            <button style={s.viewAll}>VIEW ALL TRADING IDEAS &rsaquo;</button>
          </div>
          <div style={s.researchGrid}>
            {research.map(r=>(
              <div key={r.sym} style={s.resCard}>
                <div style={s.resTop}>
                  <span style={s.resSym}>{r.sym}</span>
                  {r.tag && <span style={{ fontSize:10, color: r.color }}>● {r.tag}</span>}
                </div>
                <div style={s.resName}>{r.name}</div>
                <div style={s.resLtp}>LTP <span style={{ color:C.white }}>₹0</span> <span style={{ color:C.textSec }}>▲ 0 (0%)</span></div>
                <div style={s.resMiniGrid}>
                  <div><div style={s.resMiniLbl}>S</div><div style={s.resMiniVal}>{r.sl}</div></div>
                  <div><div style={s.resMiniLbl}>Entry</div><div style={s.resMiniVal}>{r.entry}</div></div>
                  <div><div style={s.resMiniLbl}>T</div><div style={s.resMiniVal}>{r.target}</div></div>
                </div>
                <div style={{ ...s.resPotential, color: r.color }}>{r.potential}</div>
                <button style={{ ...s.resBuyBtn, backgroundColor: r.color === C.green ? "#00b38622" : "#e5314a22",
                  color: r.color, border: `1px solid ${r.color}` }}
                  onClick={()=>navigate(`/stock/${r.sym}`)}>
                  {r.color === C.green ? "BUY" : "SELL"}
                </button>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ POCKET FRIENDLY ═══════════ */}
        <div style={s.sectionWrap}>
          <div style={s.secRow}>
            <span style={s.secTitle}>Pocket Friendly Stocks</span>
            <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
          </div>
          <div style={s.tabRow}>
            {["<₹50","<₹100","<₹200"].map(t=>(
              <button key={t} style={{ ...s.tabBtn, ...(pktTab===t?s.tabActive:{}) }} onClick={()=>setPktTab(t)}>{t}</button>
            ))}
          </div>
          <div style={s.pocketGrid}>
            {pocket.map(p=>(
              <div key={p.sym} style={s.pocketCard} onClick={()=>navigate(`/stock/${p.sym}`)}>
                <div style={s.pocketSym}>{p.sym}</div>
                <div style={s.pocketName}>{p.name}</div>
                <div style={s.pocketPrice}>{p.price}</div>
                <div style={{ fontSize:11, color: p.up?C.green:C.red }}>{p.chg} ({p.pct})</div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ CORPORATE ACTION + NEWS ═══════════ */}
        <div style={s.bottomGrid}>
          <div style={s.sectionWrap}>
            <div style={s.secRow}>
              <span style={s.secTitle}>Corporate Action</span>
            </div>
            <div style={s.tabRow}>
              {["Split","Bonus","Dividend","Board Meeting"].map(t=>(
                <button key={t} style={{ ...s.tabBtn, ...(caTab===t?s.tabActive:{}) }} onClick={()=>setCaTab(t)}>{t}</button>
              ))}
            </div>
            <div style={s.caTable}>
              <div style={s.caTHead}>
                <span>Company ⇅</span><span>Ratio ⇅</span><span style={{ textAlign:"right" }}>Ex-Date ⇅</span>
              </div>
              {corpActions.map((c,i)=>(
                <div key={i} style={s.caRow}>
                  <span style={s.caCompany}>{c.co}</span>
                  <span style={{ fontSize:12, color:C.textPri }}>{c.ratio}</span>
                  <span style={{ fontSize:12, color:C.textSec, textAlign:"right" }}>{c.ex}</span>
                </div>
              ))}
            </div>
          </div>
 
          <div style={s.sectionWrap}>
            <div style={s.secRow}>
              <span style={s.secTitle}>Stocks in News</span>
              <button style={s.viewAll}>VIEW ALL &rsaquo;</button>
            </div>
            {news.map((n,i)=>(
              <div key={i} style={s.newsRow}>
                <div style={s.newsThumb} />
                <div>
                  <div style={s.newsTitle}>{n.title}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                    <span style={s.newsSrc}>{n.src}</span>
                    {n.tags.map(t=><span key={t} style={s.newsTag}>{t}</span>)}
                    <span style={s.newsSrc}>· {n.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ═══════════ JOIN COMMUNITY ═══════════ */}
        <div style={s.community}>
          <span style={s.secTitle}>Join our Community</span>
          <div style={s.socialRow}>
            {["📺 YouTube","📷 Instagram","📘 Facebook","🐦 Twitter","💼 LinkedIn"].map(s2=>(
              <button key={s2} style={s.socialBtn}>{s2}</button>
            ))}
          </div>
        </div>
 
        <p style={s.disclaimer}>All data shown is for educational and demonstration purposes only. Not real market data. Not investment advice.</p>
      </div>
    </div>
  );
}
 
const s = {
  root:     { minHeight:"100vh", backgroundColor:C.bg, color:C.textPri, fontFamily:"'Inter',-apple-system,sans-serif", fontSize:13 },
  subNav:   { backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:56, zIndex:90 },
  subNavInner:{ maxWidth:1400, margin:"0 auto", display:"flex", padding:"0 1.25rem" },
  subNavBtn:  { background:"none", border:"none", color:C.textSec, fontSize:13, padding:"11px 16px", cursor:"pointer", borderBottom:"2px solid transparent" },
  subNavActive:{ color:C.blue, borderBottomColor:C.blue },
  page:     { maxWidth:1400, margin:"0 auto", padding:"1.5rem 1.25rem" },
  sectionWrap:{ marginBottom:"2rem" },
  secRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" },
  secTitle: { fontSize:15, fontWeight:600, color:C.white },
  viewAll:  { background:"none", border:"none", color:C.blue, fontSize:12, cursor:"pointer", fontWeight:500 },
 
  /* INDEX */
  indexChips:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:8, marginBottom:12 },
  idxChip:  { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px" },
  idxName:  { fontSize:11, color:C.textSec, display:"block", marginBottom:2, fontWeight:600 },
  idxVal:   { fontSize:14, fontWeight:700, color:C.white, display:"block", marginBottom:2, fontFamily:"monospace" },
  idxChg:   { fontSize:11, fontWeight:500, fontFamily:"monospace" },
  chartRow: { display:"grid", gridTemplateColumns:"280px 1fr", gap:16, backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:16 },
  hlPanel:  { borderRight:`1px solid ${C.border}`, paddingRight:16 },
  hlTitle:  { fontSize:11, color:C.textSec, marginBottom:10, fontWeight:600 },
  hlBar:    { height:5, backgroundColor:"#2a2e3d", borderRadius:999, marginBottom:10, position:"relative", overflow:"hidden" },
  hlBarFill:{ position:"absolute", left:"37%", right:0, top:0, bottom:0, background:`linear-gradient(90deg, ${C.red}, ${C.green})` },
  hlRow:    { display:"flex", justifyContent:"space-between", marginBottom:10 },
  hlVal:    { fontSize:14, fontWeight:700, fontFamily:"monospace" },
  hlLbl:    { fontSize:10, color:C.textSec },
  ohlcRow:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, paddingTop:10, borderTop:`1px solid ${C.border}` },
  ohlcLbl:  { fontSize:10, color:C.textSec },
  ohlcVal:  { fontSize:13, fontWeight:600, fontFamily:"monospace", marginTop:2 },
  areaPanel:{ display:"flex", flexDirection:"column" },
  tfRow:    { display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" },
  tfBtn:    { background:"none", border:"none", color:C.textSec, fontSize:11, padding:"4px 10px", cursor:"pointer", borderRadius:4 },
  tfActive: { backgroundColor:"#2a2e3d", color:C.white },
 
  /* MOST BOUGHT */
  mostBoughtRow: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 },
  mbCard:   { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, cursor:"pointer" },
  mbIconWrap:{ marginBottom:8 },
  mbIcon:   { width:32, height:32, borderRadius:"50%", backgroundColor:"#2a2e3d", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.textSec },
  mbSym:    { fontSize:13, fontWeight:700, color:C.white },
  mbName:   { fontSize:10, color:C.textSec, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  mbPrice:  { fontSize:13, fontWeight:600, fontFamily:"monospace", color:C.white },
  mbChg:    { fontSize:11, fontWeight:500 },
 
  /* TABS & FILTERS */
  tabRow:   { display:"flex", gap:4, marginBottom:12, flexWrap:"wrap", alignItems:"center" },
  tabBtn:   { background:"none", border:`1px solid ${C.border}`, color:C.textSec, fontSize:12, padding:"5px 13px", borderRadius:999, cursor:"pointer" },
  tabActive:{ backgroundColor:"#162032", borderColor:C.blue, color:C.blue },
  filterBtn:{ background:"none", border:`1px solid ${C.border}`, color:C.textSec, fontSize:11, padding:"4px 10px", borderRadius:4, cursor:"pointer" },
 
  /* MOVERS */
  moversGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  moversTable:  { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" },
  moversTHead:  { display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:4, padding:"8px 12px", fontSize:10, color:C.textSec, fontWeight:600, borderBottom:`1px solid ${C.border}` },
  moversRow:    { display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:4, padding:"9px 12px", alignItems:"center", borderBottom:`1px solid ${C.border}`, cursor:"pointer" },
  moversSymbol: { fontSize:12, fontWeight:700, color:C.white },
  moversName:   { fontSize:10, color:C.textSec },
  moversLtp:    { fontSize:12, fontWeight:600, fontFamily:"monospace", color:C.white },
  moversPct:    { fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:3, textAlign:"center" },
  viewAllInline:{ width:"100%", background:"none", border:"none", color:C.blue, fontSize:11, padding:"8px", cursor:"pointer", borderTop:`1px solid ${C.border}` },
 
  /* TOP PERFORMERS */
  perfGrid:   { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 },
  perfCard:   { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, cursor:"pointer" },
  perfTop:    { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  perfAvatar: { width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.white },
  perfBadge:  { fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:3 },
  perfSym:    { fontSize:13, fontWeight:700, color:C.white },
  perfName:   { fontSize:10, color:C.textSec, marginBottom:8 },
  perfPrice:  { fontSize:13, fontWeight:700, fontFamily:"monospace", color:C.white },
 
  /* TECHNICAL */
  techGrid:   { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 },
  techCard:   { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, cursor:"pointer" },
  techSym:    { fontSize:12, fontWeight:700, color:C.white },
  techName:   { fontSize:10, color:C.textSec, marginBottom:6 },
  techLtp:    { fontSize:13, fontWeight:700, fontFamily:"monospace", color:C.white, marginBottom:4 },
 
  /* SIGNALS */
  signalsGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:10 },
  signalCard: { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, display:"flex", gap:12, alignItems:"center", cursor:"pointer" },
  signalIcon: { display:"flex", flexDirection:"column", alignItems:"center", width:60, flexShrink:0 },
  signalSym:  { fontSize:13, fontWeight:700, color:C.white },
  signalName: { fontSize:10, color:C.textSec },
  signalPrice:{ fontSize:13, fontWeight:700, fontFamily:"monospace", color:C.white },
 
  /* RESEARCH */
  researchGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10 },
  resCard:    { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12 },
  resTop:     { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 },
  resSym:     { fontSize:13, fontWeight:700, color:C.white },
  resName:    { fontSize:10, color:C.textSec, marginBottom:8 },
  resLtp:     { fontSize:11, color:C.textSec, marginBottom:8 },
  resMiniGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4, paddingTop:8, borderTop:`1px solid ${C.border}`, marginBottom:8 },
  resMiniLbl: { fontSize:9, color:C.textSec },
  resMiniVal: { fontSize:11, fontWeight:600, color:C.white, fontFamily:"monospace", marginTop:2 },
  resPotential:{ fontSize:10, fontWeight:600, marginBottom:8 },
  resBuyBtn:  { width:"100%", padding:"7px", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer" },
 
  /* POCKET */
  pocketGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 },
  pocketCard: { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, cursor:"pointer" },
  pocketSym:  { fontSize:12, fontWeight:700, color:C.white },
  pocketName: { fontSize:10, color:C.textSec, marginBottom:6 },
  pocketPrice:{ fontSize:13, fontWeight:700, fontFamily:"monospace", color:C.white },
 
  /* BOTTOM GRID */
  bottomGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:"2rem" },
  caTable:    { backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" },
  caTHead:    { display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:4, padding:"8px 12px", fontSize:10, color:C.textSec, fontWeight:600, borderBottom:`1px solid ${C.border}` },
  caRow:      { display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:4, padding:"10px 12px", borderBottom:`1px solid ${C.border}`, alignItems:"center" },
  caCompany:  { fontSize:12, color:C.textPri, fontWeight:500 },
 
  /* NEWS */
  newsRow:    { display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" },
  newsThumb:  { width:64, height:48, borderRadius:6, backgroundColor:"#2a2e3d", flexShrink:0 },
  newsTitle:  { fontSize:12, color:C.textPri, lineHeight:1.5 },
  newsSrc:    { fontSize:10, color:C.textSec },
  newsTag:    { fontSize:10, color:C.blue, backgroundColor:"#162032", padding:"1px 6px", borderRadius:3 },
 
  /* COMMUNITY */
  community:  { display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, padding:"1.5rem 0", borderTop:`1px solid ${C.border}`, marginBottom:"1rem" },
  socialRow:  { display:"flex", gap:8, flexWrap:"wrap" },
  socialBtn:  { background:"none", border:`1px solid ${C.border}`, color:C.textSec, fontSize:12, padding:"7px 14px", borderRadius:20, cursor:"pointer" },
 
  disclaimer: { fontSize:10, color:C.textWeak, textAlign:"center", padding:"1rem 0 2rem" },
};