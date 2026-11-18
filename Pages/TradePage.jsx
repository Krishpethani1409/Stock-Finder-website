import { useLocation } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import { buyStock, sellStock } from '../store/portfolioStore.js';
import Tickertape from '../components/Tickertape.jsx';
import TradingViewWidget from '../components/TradingViewWidget.jsx';
import {
  Search, X, Plus, Star, TrendingUp, TrendingDown, Zap,
  Settings, HelpCircle, Save, Maximize2, ChevronDown, BarChart2,
  Lock, Smile, Grid3x3, Pencil, Camera, Bell
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   STATIC STOCK UNIVERSE — used for the "add to watchlist" search.
   Prices here double as fallback values when the live backend
   (localhost:8000) isn't reachable, so the terminal never looks broken.
   ═══════════════════════════════════════════════════════ */
const STOCK_UNIVERSE = [
  { symbol: 'RAILTEL',     name: 'Railtel Corp',              price: 307.15,  change: -6.90,  changePct: -2.20 },
  { symbol: 'HFCL',        name: 'HFCL Ltd',                  price: 206.75,  change: -8.25,  changePct: -3.84 },
  { symbol: 'INDUSTOWER',  name: 'Indus Towers',               price: 393.15,  change: -0.40,  changePct: -0.10 },
  { symbol: 'ADANIPOWER',  name: 'Adani Power',                price: 226.00,  change: -3.27,  changePct: -1.43 },
  { symbol: 'NIFTYBEES',   name: 'Nifty BeES ETF',             price: 272.13,  change: -1.30,  changePct: -0.48 },
  { symbol: 'ADANIPORTS',  name: 'Adani Ports',                price: 1783.20, change: -12.80, changePct: -0.71 },
  { symbol: 'CGPOWER',     name: 'CG Power',                   price: 946.25,  change: 4.15,   changePct: 0.44 },
  { symbol: 'BHARATCOAL',  name: 'Bharat Coking Coal',         price: 39.50,   change: -0.97,  changePct: -2.40 },
  { symbol: 'VEDL',        name: 'Vedanta Ltd',                price: 278.20,  change: 4.75,   changePct: 1.74 },
  { symbol: 'JIOFIN',      name: 'Jio Financial',              price: 236.55,  change: -2.88,  changePct: -1.20 },
  { symbol: 'SUZLON',      name: 'Suzlon Energy',              price: 57.03,   change: -0.11,  changePct: -0.19 },
  { symbol: 'NTPC',        name: 'NTPC Ltd',                   price: 355.80,  change: 3.75,   changePct: 1.07 },
  { symbol: 'IRFC',        name: 'IRFC Ltd',                   price: 90.42,   change: -1.35,  changePct: -1.47 },
  { symbol: 'YESBANK',     name: 'Yes Bank',                   price: 25.19,   change: 0.32,   changePct: 1.29 },
  { symbol: 'TATAMOTORS',  name: 'Tata Motors',                price: 346.10,  change: -7.10,  changePct: -2.01 },
  { symbol: 'RELIANCE',    name: 'Reliance Industries',        price: 2847.30, change: 34.20,  changePct: 1.22 },
  { symbol: 'TCS',         name: 'Tata Consultancy Services',  price: 3921.15, change: 33.80,  changePct: 0.87 },
  { symbol: 'INFY',        name: 'Infosys Ltd',                price: 1456.80, change: -6.30,  changePct: -0.43 },
  { symbol: 'HDFCBANK',    name: 'HDFC Bank',                  price: 1623.55, change: 33.40,  changePct: 2.10 },
  { symbol: 'WIPRO',       name: 'Wipro Ltd',                  price: 478.90,  change: -4.92,  changePct: -1.02 },
  { symbol: 'TATASTEEL',   name: 'Tata Steel',                 price: 162.45,  change: 2.30,   changePct: 1.43 },
  { symbol: 'BAJFINANCE',  name: 'Bajaj Finance',               price: 7245.60, change: 82.40,  changePct: 1.15 },
  { symbol: 'SBIN',        name: 'State Bank of India',        price: 812.30,  change: -9.40,  changePct: -1.14 },
  { symbol: 'ITC',         name: 'ITC Ltd',                    price: 418.75,  change: 3.20,   changePct: 0.77 },
  { symbol: 'MARUTI',      name: 'Maruti Suzuki',              price: 12840.00,change: 145.00, changePct: 1.14 },
  { symbol: 'ASIANPAINT',  name: 'Asian Paints',                price: 2234.50, change: -18.30, changePct: -0.81 },
  { symbol: 'SUNPHARMA',   name: 'Sun Pharma',                  price: 1678.90, change: 12.50,  changePct: 0.75 },
  { symbol: 'ULTRACEMCO',  name: 'UltraTech Cement',            price: 10456.00,change: -87.00, changePct: -0.82 },
  { symbol: 'RVNL',        name: 'Rail Vikas Nigam',            price: 237.00,  change: 7.00,   changePct: 0.82 },
  { symbol: 'COALINDIA',   name: 'Coal India',                  price: 412.60,  change: 2.10,   changePct: 0.51 },
  { symbol: 'ONGC',        name: 'Oil & Natural Gas Corp',      price: 248.35,  change: -1.90,  changePct: -0.76 },
  { symbol: 'POWERGRID',   name: 'Power Grid Corp',             price: 318.20,  change: 1.55,   changePct: 0.49 },
  { symbol: 'HCLTECH',     name: 'HCL Technologies',            price: 1789.40, change: 15.60,  changePct: 0.88 },
  { symbol: 'AXISBANK',    name: 'Axis Bank',                   price: 1142.75, change: -6.85,  changePct: -0.60 },
  { symbol: 'ICICIBANK',   name: 'ICICI Bank',                  price: 1284.60, change: 9.40,   changePct: 0.74 },
];

const STOCK_MAP = Object.fromEntries(STOCK_UNIVERSE.map((s) => [s.symbol, s]));

const DEFAULT_WATCHLISTS = {
  mywatchlist: STOCK_UNIVERSE.slice(0, 29).map((s) => s.symbol),
  'Watchlist 1': ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'],
  PSU: ['SBIN', 'NTPC', 'IRFC', 'COALINDIA', 'ONGC', 'POWERGRID'],
};

const TIMEFRAMES = [
  { label: '5m', interval: '5' },
  { label: '15m', interval: '15' },
  { label: '1H', interval: '60' },
  { label: 'D', interval: 'D' },
  { label: 'W', interval: 'W' },
  { label: 'M', interval: 'M' },
];

const fmt = (n) => (n === undefined || n === null || isNaN(n) ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 }));

export default function TradePage() {
  const [watchlists, setWatchlists] = useState(DEFAULT_WATCHLISTS);
  const [activeWatchlistTab, setActiveWatchlistTab] = useState('mywatchlist');
  const [selectedSymbol, setSelectedSymbol] = useState('RAILTEL');
  const location = useLocation();
const [idxChart, setIdxChart] = useState(
  location.state?.tv ? { tv: location.state.tv, label: location.state.label, forSymbol: 'RAILTEL' } : null
);
useEffect(() => {
  if (location.state?.tv) {
    setIdxChart({ tv: location.state.tv, label: location.state.label, forSymbol: selectedSymbol });
  }
}, [location.key]); // eslint-disable-line
const idxActive = idxChart && idxChart.forSymbol === selectedSymbol;  
  const [wlSearchOpen, setWlSearchOpen] = useState(false);
  const [wlSearchQuery, setWlSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState('chart'); // 'chart' | 'overview'
  const [timeframe, setTimeframe] = useState('D');
  const [qty, setQty] = useState(1);
  const [scalperMode, setScalperMode] = useState(false);
  const [orderToast, setOrderToast] = useState(null);
  const [newWatchlistPrompt, setNewWatchlistPrompt] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  // Live prices from FastAPI backend — falls back to static STOCK_MAP values
  const [livePrices, setLivePrices] = useState({});
  const [isBackendConnected, setIsBackendConnected] = useState(false);

     useEffect(() => {
     const fetchLive = async () => {
       try {
         const all = [...new Set(Object.values(watchlists).flat().concat(selectedSymbol))];
         const [a, b] = await Promise.allSettled([
           fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + '/stocks').then((r) => r.json()),
           fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + '/quotes?symbols=' + all.join(',')).then((r) => r.json()),
         ]);
         const map = {};
         if (b.status === 'fulfilled') {
           Object.values(b.value.quotes || {}).forEach((q) => { map[q.symbol] = q; });
         }
         if (a.status === 'fulfilled') {
           (a.value.stocks || []).forEach((s) => { map[s.symbol] = s; });
         }
         if (Object.keys(map).length) { setLivePrices(map); setIsBackendConnected(true); }
         else setIsBackendConnected(false);
       } catch {
         setIsBackendConnected(false);
       }
     };
     fetchLive();
     const interval = setInterval(fetchLive, 30000);
     return () => clearInterval(interval);
   }, [watchlists, selectedSymbol]);

     const getStockData = (symbol) => {
     const live = livePrices[symbol];
     const meta = STOCK_MAP[symbol];
     if (live) return { symbol, name: meta?.name || live.name || symbol, price: live.price, change: live.change, changePct: live.change_pct };
     return { symbol, name: meta?.name || symbol, price: null, change: 0, changePct: 0 };
   };

  const currentList = watchlists[activeWatchlistTab] || [];
  const selectedData = getStockData(selectedSymbol);
  const isUp = (selectedData.change ?? 0) >= 0;

  // Filtered search results for adding to watchlist (excludes symbols already in the active list)
  const searchResults = useMemo(() => {
    if (!wlSearchQuery.trim()) return [];
    const q = wlSearchQuery.toLowerCase();
    return STOCK_UNIVERSE.filter(
      (s) =>
        !currentList.includes(s.symbol) &&
        (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [wlSearchQuery, currentList]);

  const addToWatchlist = (symbol) => {
    setWatchlists((prev) => ({
      ...prev,
      [activeWatchlistTab]: [...prev[activeWatchlistTab], symbol],
    }));
    setWlSearchQuery('');
    setWlSearchOpen(false);
  };

  const removeFromWatchlist = (symbol, e) => {
    e.stopPropagation();
    setWatchlists((prev) => ({
      ...prev,
      [activeWatchlistTab]: prev[activeWatchlistTab].filter((s) => s !== symbol),
    }));
    if (selectedSymbol === symbol) {
      const remaining = watchlists[activeWatchlistTab].filter((s) => s !== symbol);
      if (remaining.length) setSelectedSymbol(remaining[0]);
    }
  };

  const createWatchlist = () => {
    const name = newWatchlistName.trim();
    if (!name || watchlists[name]) {
      setNewWatchlistPrompt(false);
      setNewWatchlistName('');
      return;
    }
    setWatchlists((prev) => ({ ...prev, [name]: [] }));
    setActiveWatchlistTab(name);
    setNewWatchlistPrompt(false);
    setNewWatchlistName('');
  };

  const placeOrder = (side) => {
    const price = selectedData.price ?? 0;
    if (!price || price <= 0) return alert("No price data for " + selectedSymbol);

    /* ── SAVE TO PORTFOLIO ── */
    let res;
    if (side === 'BUY') {
      res = buyStock(selectedSymbol, selectedSymbol, qty, price, "Equity");
    } else {
      res = sellStock(selectedSymbol, qty, price);
    }

    /* Show toast */
    setOrderToast({
      side,
      symbol: selectedSymbol,
      qty,
      price,
      total: price * qty,
      message: res.message,
    });
    setTimeout(() => setOrderToast(null), 3500);
  };

  // const tvSymbol = `BSE:${selectedSymbol}`;
  const tvSymbol = idxActive ? idxChart.tv : `BSE:${selectedSymbol}`;

  return (
    <div    style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="h-screen flex flex-col bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      <Navbar />
      {/* <Tickertape /> */}

      <div className="flex flex-1 min-h-0">
        {/* ═══════════ WATCHLIST SIDEBAR ═══════════ */}
        {!scalperMode && (
          <aside className="w-[300px] shrink-0 border-r border-slate-800 flex flex-col bg-[#0E1320]">
            {/* Watchlist tabs */}
            <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-slate-800 overflow-x-auto">
              {Object.keys(watchlists).map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveWatchlistTab(name)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    activeWatchlistTab === name
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-[#1A2234] hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                onClick={() => setNewWatchlistPrompt(true)}
                title="Create new watchlist"
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#1A2234] cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {newWatchlistPrompt && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800 bg-[#131927]">
                <input
                  autoFocus
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createWatchlist()}
                  placeholder="Watchlist name..."
                  className="flex-1 bg-[#0F1729] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                />
                <button onClick={createWatchlist} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer">Add</button>
                <button onClick={() => setNewWatchlistPrompt(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Search / add stock */}
            <div className="p-3 border-b border-slate-800 relative">
              <div className="flex items-center bg-[#0F1729] border border-slate-700 rounded-lg px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                <input
                  value={wlSearchQuery}
                  onChange={(e) => { setWlSearchQuery(e.target.value); setWlSearchOpen(true); }}
                  onFocus={() => setWlSearchOpen(true)}
                  placeholder="Search & add to watchlist"
                  className="bg-transparent outline-none text-xs text-white w-full placeholder-slate-500"
                />
              </div>

              {wlSearchOpen && searchResults.length > 0 && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-[#131927] border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden max-h-72 overflow-y-auto">
                  {searchResults.map((s) => (
                    <div
                      key={s.symbol}
                      onClick={() => addToWatchlist(s.symbol)}
                      className="px-3 py-2.5 flex items-center justify-between hover:bg-[#1A2234] cursor-pointer border-b border-slate-800/60 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{s.symbol}</p>
                        <p className="text-[10px] text-slate-500">{s.name}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  ))}
                </div>
              )}
              {wlSearchOpen && (
                <div className="fixed inset-0 z-20" onClick={() => setWlSearchOpen(false)} />
              )}
            </div>

            {/* Watchlist items */}
            <div className="flex-1 overflow-y-auto">
              {currentList.length === 0 && (
                <p className="text-center text-[11px] text-slate-500 py-8 px-4">
                  No stocks yet. Use the search above to add some.
                </p>
              )}
              {currentList.map((symbol) => {
                const data = getStockData(symbol);
                const up = (data.change ?? 0) >= 0;
                const active = symbol === selectedSymbol;
                return (
                  <div
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`group px-4 py-2.5 border-l-2 cursor-pointer transition-all ${
                      active ? 'border-blue-500 bg-[#131927]' : 'border-transparent hover:bg-[#131927]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-white truncate">{symbol}</span>
                        <span className="text-[9px] px-1 py-px rounded bg-slate-800 text-slate-500 shrink-0">NSE</span>
                      </div>
                      <button
                        onClick={(e) => removeFromWatchlist(symbol, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-500 truncate">{data.name}</span>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-bold text-white">
                          {data.price !== null ? `₹${fmt(data.price)}` : '—'}
                        </p>
                        <p className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                          {up ? '▲' : '▼'} {fmt(Math.abs(data.change ?? 0))} ({fmt(Math.abs(data.changePct ?? 0))}%)
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{currentList.length} scrips</span>
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${isBackendConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {isBackendConnected ? 'Live' : 'Demo Data'}
              </span>
            </div>
          </aside>
        )}

        {/* ═══════════ MAIN CHART AREA ═══════════ */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Chart / Overview tabs */}
          <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-800">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setMainTab('chart')}
                className={`pb-3 text-xs font-bold cursor-pointer border-b-2 transition-all ${
                  mainTab === 'chart' ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setMainTab('overview')}
                className={`pb-3 text-xs font-bold cursor-pointer border-b-2 transition-all ${
                  mainTab === 'overview' ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                Overview
              </button>
            </div>

            <button
              onClick={() => setScalperMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all mb-2 ${
                scalperMode ? 'bg-amber-500 text-black' : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              SCALPER MODE
            </button>
          </div>

          {/* Symbol header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">{selectedSymbol}</h2>
                  <span className="text-[10px] text-slate-500">· {timeframe} · NSE</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                </div>
                <p className="text-[11px] text-slate-500">{selectedData.name}</p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>O <b className="text-slate-200">{fmt(selectedData.price - (selectedData.change ?? 0))}</b></span>
                <span>H <b className="text-emerald-400">{fmt((selectedData.price ?? 0) + Math.abs(selectedData.change ?? 0) * 0.6)}</b></span>
                <span>L <b className="text-red-400">{fmt((selectedData.price ?? 0) - Math.abs(selectedData.change ?? 0) * 0.6)}</b></span>
                <span>C <b className={isUp ? 'text-emerald-400' : 'text-red-400'}>{fmt(selectedData.price)}</b></span>
                <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{fmt(selectedData.change)} ({isUp ? '+' : ''}{fmt(selectedData.changePct)}%)
                </span>
              </div>
            </div>

            {/* Buy / Sell */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#0F1729] border border-slate-700 rounded-lg overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 py-1.5 text-slate-400 hover:text-white cursor-pointer">−</button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-transparent text-center text-xs text-white outline-none"
                />
                <button onClick={() => setQty((q) => q + 1)} className="px-2.5 py-1.5 text-slate-400 hover:text-white cursor-pointer">+</button>
              </div>
              <button
                onClick={() => placeOrder('BUY')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md"
              >
                BUY @ ₹{fmt(selectedData.price)}
              </button>
              <button
                onClick={() => placeOrder('SELL')}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md"
              >
                SELL @ ₹{fmt(selectedData.price)}
              </button>
            </div>
          </div>

          {/* Toolbar: timeframes + indicator hint */}
          {mainTab === 'chart' && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
              <div className="flex items-center gap-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.label}
                    onClick={() => setTimeframe(tf.label)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      timeframe === tf.label ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1A2234] hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="hidden md:flex items-center gap-1">
                  {/* <BarChart2 className="w-3 h-3" /> Click "Indicators" inside the chart to add MACD, SuperTrend, RSI, etc. */}
                </span>
                <Save className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                <Maximize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>
          )}

          {/* CHART / OVERVIEW BODY */}
          <div className="flex-1 min-h-0 relative">
            {mainTab === 'chart' ? (
              <TradingViewWidget
                key={`${selectedSymbol}-${timeframe}`}
                symbol={tvSymbol}
                interval={TIMEFRAMES.find((t) => t.label === timeframe)?.interval || 'D'}
              />
            ) : (
              <OverviewPanel symbol={selectedSymbol} data={selectedData} />
            )}
          </div>

          <div className="px-4 py-1.5 border-t border-slate-800 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Powered by TradingView Charts</span>
            <span></span>
          </div>
        </main>

        {/* Scalper mode floating exit button when sidebar hidden */}
        {scalperMode && (
          <button
            onClick={() => setScalperMode(false)}
            className="fixed top-24 left-3 z-40 px-3 py-2 bg-[#131927] border border-slate-700 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer shadow-lg"
          >
            ← Show Watchlist
          </button>
        )}
      </div>

      {/* ORDER TOAST */}
      {orderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131927] border border-slate-700 rounded-2xl shadow-2xl p-4 w-72 animate-[fadeIn_0.2s_ease]">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-black px-2 py-0.5 rounded ${orderToast.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {orderToast.side} ORDER PLACED (DEMO)
            </span>
            <button onClick={() => setOrderToast(null)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-sm font-bold text-white">{orderToast.qty} × {orderToast.symbol} @ ₹{fmt(orderToast.price)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total: ₹{fmt(orderToast.total)}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OVERVIEW TAB — quick stats panel, no chart
   ═══════════════════════════════════════════════════════ */
function OverviewPanel({ symbol, data }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/stock/${symbol}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [symbol]);

  const up = (data.change ?? 0) >= 0;

  const stats = [
    ['Current Price', data.price !== null ? `₹${fmt(data.price)}` : '—'],
    ['Change', `${up ? '+' : ''}${fmt(data.change)} (${up ? '+' : ''}${fmt(data.changePct)}%)`],
    ['52W High', details?.week52_high ? `₹${fmt(details.week52_high)}` : '—'],
    ['52W Low', details?.week52_low ? `₹${fmt(details.week52_low)}` : '—'],
    ['Volume', details?.volume ? details.volume.toLocaleString('en-IN') : '—'],
    ['Exchange', 'NSE'],
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-3xl">
        <h3 className="text-lg font-black text-white mb-1">{data.name || symbol}</h3>
        <p className="text-xs text-slate-500 mb-6">{symbol} · NSE</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-[#131927] border border-slate-800 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase mb-1">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-300 leading-relaxed">
            For full candlestick charts, indicators, and drawing tools, switch to the <b>Chart</b> tab above.
            This Overview tab pulls live 52-week high/low and volume directly from your FastAPI backend.
          </p>
        </div>
      </div>
    </div>
  );
}