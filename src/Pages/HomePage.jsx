import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Tickertape from '../components/TickerTape.jsx';
import Logo from '../components/Logo.jsx';
import { 
  Search, BarChart2, PieChart, 
  Zap, Repeat, Newspaper, Sparkles, 
  Flame, ChevronRight, Building2,
  Compass, ArrowRight, CheckCircle2, ShieldCheck,
  Percent, ArrowUpRight, Calculator, Award,
  TrendingUp, TrendingDown, GraduationCap, BookOpen, Lightbulb
} from 'lucide-react';

export default function Homepage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [moversTab, setActiveMoversTab] = useState('gainers');

  // API Live States
  const [liveStocks, setLiveStocks] = useState([]);
  const [liveGainers, setLiveGainers] = useState([]);
  const [liveLosers, setLiveLosers] = useState([]);
  const [liveIpos, setLiveIpos] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // -------------------------------------------------------------
  // FETCH LIVE DATA FROM FASTAPI BACKEND (http://localhost:8000)
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [resStocks, resMovers, resIpo] = await Promise.all([
          fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + '/stocks'),
          fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + '/gainers'),
          fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + '/ipo/open')
        ]);

        if (resStocks.ok) {
          const stocksData = await resStocks.json();
          if (Array.isArray(stocksData.stocks)) {
            setLiveStocks(stocksData.stocks);
            setIsBackendConnected(true);
          }
        }
        if (resMovers.ok) {
          const moversData = await resMovers.json();
          if (moversData.gainers) setLiveGainers(moversData.gainers);
          if (moversData.losers) setLiveLosers(moversData.losers);
        }
        if (resIpo.ok) {
          const ipoData = await resIpo.json();
          if (Array.isArray(ipoData.ipos)) {
            setLiveIpos(ipoData.ipos);
          }
        }
      } catch (err) {
        console.error('❌ Backend connection failed:', err.message);
        setIsBackendConnected(false);
      }
    };

    fetchBackendData();
    const interval = setInterval(fetchBackendData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fallback / Master Trending Stock Data
  const fallbackStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: '2,847.30', change: '+1.24%', up: true, volume: '8.5M' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: '3,921.15', change: '+0.87%', up: true, volume: '2.1M' },
    { symbol: 'INFY', name: 'Infosys Ltd', price: '1,456.80', change: '-0.43%', up: false, volume: '6.1M' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: '1,623.55', change: '+2.10%', up: true, volume: '12.8M' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', price: '478.90', change: '-1.02%', up: false, volume: '5.4M' },
    { symbol: 'ADANIENT', name: 'Adani Enterprises', price: '2,340.00', change: '+3.45%', up: true, volume: '4.2M' },
    { symbol: 'ADANIPOWER', name: 'Adani Power Ltd', price: '232.00', change: '+0.65%', up: true, volume: '14.2M' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: '942.10', change: '-1.30%', up: false, volume: '9.2M' },
    { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', price: '57.03', change: '+2.15%', up: true, volume: '48.2M' },
    { symbol: 'IRFC', name: 'Indian Railway Finance', price: '178.40', change: '+1.77%', up: true, volume: '32.1M' },
  ];

  const activeStockPool = liveStocks.length > 0 ? liveStocks : fallbackStocks;

  // Safe Helpers
  const isPositive = (stock) => {
    if (typeof stock.up === 'boolean') return stock.up;
    if (typeof stock.change === 'string') return stock.change.startsWith('+');
    if (typeof stock.change_pct === 'number') return stock.change_pct >= 0;
    if (typeof stock.change === 'number') return stock.change >= 0;
    return true;
  };

  const formatChangeDisplay = (stock) => {
    if (typeof stock.change === 'string') return stock.change;
    if (typeof stock.change_pct === 'number') {
      return `${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct}%`;
    }
    if (stock.percent) return stock.percent;
    if (stock.pct) return stock.pct;
    if (typeof stock.change === 'number') return `${stock.change >= 0 ? '+' : ''}${stock.change}`;
    return 'N/A';
  };

  // Filtered Movers
  const topGainers = liveGainers.length > 0 ? liveGainers : activeStockPool.filter(s => isPositive(s));
  const topLosers = liveLosers.length > 0 ? liveLosers : activeStockPool.filter(s => !isPositive(s));
  const mostActive = [
    { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', price: '57.03', change: '+1.20', percent: '+2.15%', volume: '48.2M' },
    { symbol: 'IRFC', name: 'Indian Railway Finance', price: '178.40', change: '+3.10', percent: '+1.77%', volume: '32.1M' },
    { symbol: 'PNB', name: 'Punjab National Bank', price: '118.20', change: '-0.80', percent: '-0.67%', volume: '28.4M' },
    { symbol: 'YESBANK', name: 'Yes Bank Limited', price: '24.15', change: '+0.45', percent: '+1.90%', volume: '54.0M' },
  ];

  // Thematic Stock Collections
  const stockBaskets = [
    { title: 'High Dividend Giants', desc: 'Top cash-rich companies with high annual yields.', count: '12 Stocks', avgReturn: '18.4% 3Y CAGR', icon: '💰', tag: 'DIVIDEND' },
    { title: 'Monopoly Leaders', desc: 'Companies with >50% market share in India.', count: '8 Stocks', avgReturn: '24.2% 3Y CAGR', icon: '👑', tag: 'MONOPOLY' },
    { title: 'Green Energy & EV', desc: 'Solar, wind, battery & EV leaders.', count: '15 Stocks', avgReturn: '32.1% 3Y CAGR', icon: '🌱', tag: 'FUTURE TECH' },
    { title: 'Debt-Free Compounders', desc: 'Zero debt balance sheets with ROE > 20%.', count: '20 Stocks', avgReturn: '21.8% 3Y CAGR', icon: '🛡️', tag: 'STABILITY' }
  ];

  // Sector Performance Data
  const sectorPerformance = [
    { name: 'IT & Technology', change: 2.8, up: true, stocks: 'TCS, INFY, WIPRO, HCLTECH' },
    { name: 'Banking & Finance', change: 1.4, up: true, stocks: 'HDFCBANK, ICICIBANK, SBIN' },
    { name: 'Auto & EV', change: -0.9, up: false, stocks: 'MARUTI, TATAMOTORS' },
    { name: 'Energy & Power', change: 0.6, up: true, stocks: 'NTPC, POWERGRID, ONGC' },
    { name: 'FMCG', change: -0.3, up: false, stocks: 'HINDUNILVR, NESTLEIND' },
    { name: 'Metals & Mining', change: 3.2, up: true, stocks: 'TATASTEEL, JSWSTEEL, HINDALCO' },
    { name: 'Pharma & Healthcare', change: 1.1, up: true, stocks: 'SUNPHARMA' },
    { name: 'Telecom', change: -1.6, up: false, stocks: 'IDEA' },
  ];

  // Learn & Insights Data
  const learnArticles = [
    { icon: <GraduationCap className="w-5 h-5" />, tag: 'BEGINNER', title: 'What is a P/E Ratio?', desc: 'Understand the single most quoted valuation metric before your first trade.', readTime: '4 min read' },
    { icon: <BookOpen className="w-5 h-5" />, tag: 'STRATEGY', title: 'SIP vs Lumpsum Investing', desc: 'Which approach builds wealth better for Indian retail investors?', readTime: '6 min read' },
    { icon: <Lightbulb className="w-5 h-5" />, tag: 'ANALYSIS', title: 'Reading Balance Sheets Fast', desc: 'Spot red flags in 5 minutes using our Screener\'s financial tables.', readTime: '8 min read' },
  ];

  // IPO Desk Data
  const fallbackIpoData = [
    { id: 'indo-mim', name: 'INDO-MIM LTD', type: 'MAINBOARD', closesOn: '27 Jul 26', minInvestment: '₹13,830', subscription: '0.65x' },
    { id: 'lohia-corp', name: 'LOHIA CORP LTD', type: 'MAINBOARD', closesOn: '27 Jul 26', minInvestment: '₹14,140', subscription: '0.18x' },
    { id: 'xtranet', name: 'XTRANET TECHNOLOGIES LTD', type: 'MAINBOARD', closesOn: '27 Jul 26', minInvestment: '₹13,200', subscription: '0.58x' }
  ];

  const ipoData = liveIpos.length > 0 ? liveIpos : fallbackIpoData;

  // Official Broker Partners Data
  const dematBrokers = [
    { name: 'Zerodha', tag: 'Kite Trading Engine', fee: '₹0 Account Fee', brokerage: '₹0 Delivery • ₹20 F&O', rating: '4.9 ★', badge: 'MOST POPULAR', color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/40' },
    { name: 'Groww', tag: 'Direct Stocks & MF', fee: '₹0 AMC Charges', brokerage: '₹20 or 0.05% max', rating: '4.8 ★', badge: 'EASIEST UI', color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/40' },
    { name: 'Angel One', tag: 'ARQ Prime Advisory', fee: '₹0 First Year AMC', brokerage: '₹0 Equity Delivery', rating: '4.7 ★', badge: 'BEST ADVISORY', color: 'from-purple-600/20 to-pink-600/20 border-purple-500/40' },
  ];

  // Live Instant Search Handler
  const handleSearchChange = (val) => {
    setQuery(val);
    if (val.trim().length > 0) {
      const filtered = activeStockPool.filter(
        (s) =>
          s.symbol.toLowerCase().includes(val.toLowerCase()) ||
          (s.name && s.name.toLowerCase().includes(val.toLowerCase()))
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/screener/${encodeURIComponent(query.trim().toUpperCase())}`);
    } else {
      navigate('/screener');
    }
  };

  const currentMovers = 
    moversTab === 'gainers' ? topGainers : 
    moversTab === 'losers' ? topLosers : mostActive;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-24 selection:bg-blue-600 selection:text-white">
      
      {/* 1. SHARED OFFICIAL NAVBAR */}
      <Navbar />

      {/* 2. IMPORTED TICKERTAPE COMPONENT
      <Tickertape /> */}

      {/* 3. HERO HEADER SECTION */}
      <section className="relative pt-12 pb-14 px-4 max-w-7xl mx-auto text-center">
        {/* Glow Background Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[250px] bg-blue-600/15 blur-[130px] rounded-full -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-semibold mb-6 shadow-lg shadow-blue-900/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBackendConnected ? `🟢 Live: ${liveStocks.length} stocks connected via FastAPI` : "India's Premier Financial Analytics Platform"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
          Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">Best Stocks</span><br />
          Before Everyone Else
        </h1>
        
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
          Screen 5,000+ Indian equities, analyze fundamental financials, track institutional flows, and estimate SIP returns with precision.
        </p>

        {/* Live Search Input with Dropdown Suggestions */}
        <div className="max-w-xl mx-auto relative mb-5">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search stocks, mutual funds, or ETFs... e.g. RELIANCE, TCS"
              className="w-full pl-12 pr-28 py-3.5 bg-[#131927] border border-slate-700/80 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm shadow-2xl transition-all font-medium"
            />
            <button 
              type="submit"
              className="absolute right-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Search Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#131927] border border-slate-700 rounded-2xl overflow-hidden z-50 shadow-2xl divide-y divide-slate-800 text-left">
              {suggestions.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => {
                    setQuery(s.symbol);
                    setSuggestions([]);
                    navigate(`/screener/${s.symbol}`);
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-[#1A2234] transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-blue-400 text-xs mr-2 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded">
                      {s.symbol}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">{s.name}</span>
                  </div>
                  <span className={`text-xs font-black ${isPositive(s) ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{s.price} ({formatChangeDisplay(s)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Stock Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500">Popular:</span>
          {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ADANIPOWER', 'SUZLON'].map((tag) => (
            <button 
              key={tag} 
              onClick={() => navigate(`/screener/${tag}`)}
              className="hover:text-blue-400 transition-colors cursor-pointer font-medium"
            >
              {tag} •
            </button>
          ))}
        </div>
      </section>

      {/* 3.5 NEW SECTION: COMPACT LIVE MARKET SUMMARY STRIP */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full text-left">
            {/* 1. NIFTY 50 */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIFTY 50</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-white">₹23,984.15</span>
                <span className="text-xs font-bold text-emerald-400">+0.52%</span>
              </div>
            </div>

            {/* 2. SENSEX */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SENSEX</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-white">₹78,718.40</span>
                <span className="text-xs font-bold text-emerald-400">+0.49%</span>
              </div>
            </div>

            {/* 3. TOP GAINER */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOP GAINER</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-white">
                  {topGainers.length > 0 ? topGainers[0].symbol : 'ADANIENT'}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {topGainers.length > 0 ? formatChangeDisplay(topGainers[0]) : '+3.45%'}
                </span>
              </div>
            </div>

            {/* 4. TOP LOSER */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOP LOSER</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-white">
                  {topLosers.length > 0 ? topLosers[0].symbol : 'TATAMOTORS'}
                </span>
                <span className="text-xs font-bold text-red-400">
                  {topLosers.length > 0 ? formatChangeDisplay(topLosers[0]) : '-1.30%'}
                </span>
              </div>
            </div>

            {/* 5. MARKET STATUS */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MARKET STATUS</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">OPEN • NSE/BSE</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/markets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto text-center"
          >
            Explore Markets →
          </button>
        </div>
      </section>

      {/* 4. DISCOVERY CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-4 mb-14">
        <h2 className="text-base md:text-lg font-bold text-white mb-4 tracking-tight">
          What are you looking for today?
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div onClick={() => navigate('/screener')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">Stock Screener</span>
              <span className="text-[10px] text-slate-500">5,000+ Stocks</span>
            </div>
          </div>

          <div onClick={() => navigate('/mutualfund')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">Mutual Funds</span>
              <span className="text-[10px] text-slate-500">Direct 0% Comm.</span>
            </div>
          </div>

          <div onClick={() => navigate('/tradeone')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">Futures &amp; Options</span>
              <span className="text-[10px] text-slate-500">Live Trading</span>
            </div>
          </div>

          <div onClick={() => navigate('/markets')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">ETF Discovery</span>
              <span className="text-[10px] text-slate-500">Index &amp; Gold</span>
            </div>
          </div>

          <div onClick={() => navigate('/IpoPage')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">IPO Desk</span>
              <span className="text-[10px] text-slate-500">Open &amp; Upcoming</span>
            </div>
          </div>

          <div onClick={() => navigate('/tools')} className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-start gap-3 cursor-pointer group transition-all shadow-md hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors block">Tools &amp; Alerts</span>
              <span className="text-[10px] text-slate-500">GTT &amp; Spreads</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MARKET MOVERS TABLE */}
      <section className="max-w-7xl mx-auto px-4 mb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Market Movers Today</span>
          </h2>

          <div className="flex items-center gap-1 bg-[#131927] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMoversTab('gainers')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                moversTab === 'gainers' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setActiveMoversTab('losers')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                moversTab === 'losers' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Losers
            </button>
            <button
              onClick={() => setActiveMoversTab('active')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                moversTab === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Most Active
            </button>
          </div>
        </div>

        <div className="bg-[#131927] border border-slate-800/80 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-[#0E1320]">
                <th className="py-3.5 px-5 font-semibold">Symbol</th>
                <th className="py-3.5 px-5 font-semibold">Company Name</th>
                <th className="py-3.5 px-5 font-semibold">Price (₹)</th>
                <th className="py-3.5 px-5 font-semibold">Net Change</th>
                <th className="py-3.5 px-5 font-semibold">Volume</th>
                <th className="py-3.5 px-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {currentMovers.map((stock, idx) => (
                <tr key={idx} className="hover:bg-[#1A2234] transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-900/30 border border-blue-500/20 text-blue-400">
                      {stock.symbol}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-medium text-white">{stock.name || stock.symbol}</td>
                  <td className="py-3.5 px-5 font-bold text-slate-200">₹{stock.price}</td>
                  <td className={`py-3.5 px-5 font-extrabold ${isPositive(stock) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatChangeDisplay(stock)}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">{stock.volume || 'N/A'}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button 
                      onClick={() => navigate(`/screener/${stock.symbol}`)}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      Analyse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. CALCULATORS STRIP */}
      <section className="max-w-7xl mx-auto px-4 mb-14">
        <div className="bg-[#132038] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>FINANCIAL ANALYTICS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Calculate Your Investment Growth
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Plan SIPs, lumpsum wealth returns, brokerage taxes, and stock valuation ratios instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {["SIP Calculator", "Brokerage & PnL", "P/E Valuation"].map((calc) => (
              <button
                key={calc}
                onClick={() => navigate('/calculator')}
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {calc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 7. INVEST IN LATEST IPOs */}
      <section className="max-w-7xl mx-auto px-4 mb-14">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            Invest in Latest <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-xs font-black border border-amber-500/30">IPOs</span>
          </h2>

          <button 
            onClick={() => navigate('/IpoPage')}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
          >
            <span>VIEW ALL OPEN &amp; UPCOMING IPO</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ipoData.map((ipo, idx) => (
            <div
              key={ipo.id || idx}
              onClick={() => navigate('/IpoPage')}
              className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden cursor-pointer group transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
                      {ipo.name ? ipo.name.substring(0, 2) : 'IP'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {ipo.name}
                      </h3>
                      <span className="inline-block mt-1 text-[9px] font-extrabold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase">
                        {ipo.type || 'MAINBOARD'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Closes On</span>
                    <span className="font-bold text-slate-200 text-xs">{ipo.closesOn || ipo.date || 'TBA'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Min. Investment</span>
                    <span className="font-bold text-slate-200 text-xs">{ipo.minInvestment || ipo.minLot || '₹14,000'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0E1320] px-4 py-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Overall Subscription</span>
                <span className="font-bold text-emerald-400 text-xs">{ipo.subscription || ipo.sub || 'Active'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CURATED STOCK BASKETS */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Theme-Based Stock Collections</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Curated stock baskets handpicked by quantitative filters.</p>
          </div>

          <button onClick={() => navigate('/screener')} className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer">
            Explore All Baskets →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stockBaskets.map((basket, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/screener')}
              className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer group transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{basket.icon}</span>
                  <span className="text-[9px] font-extrabold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded">
                    {basket.tag}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors mb-1">
                  {basket.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {basket.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[10px]">{basket.count}</span>
                <span className="font-bold text-emerald-400 text-[11px]">{basket.avgReturn}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. SECTOR PERFORMANCE */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Sector Performance Today</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">See which sectors are leading and lagging the broader market.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sectorPerformance.map((sector, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/markets')}
              className={`rounded-2xl p-4 border cursor-pointer transition-all hover:-translate-y-0.5 shadow-md ${
                sector.up
                  ? 'bg-emerald-500/[0.07] border-emerald-500/25 hover:border-emerald-500/50'
                  : 'bg-red-500/[0.07] border-red-500/25 hover:border-red-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{sector.name}</span>
                {sector.up ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </div>
              <div className={`text-lg font-black mb-1 ${sector.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {sector.up ? '+' : ''}{sector.change}%
              </div>
              <p className="text-[10px] text-slate-500 truncate">{sector.stocks}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. LEARN & INSIGHTS */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Learn &amp; Insights</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Quick reads to sharpen how you read the market.</p>
          </div>

          <button onClick={() => navigate('/tips')} className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer">
            View All Tips →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learnArticles.map((article, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/tips')}
              className="bg-[#131927] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer group transition-all shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  {article.icon}
                </div>
                <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                  {article.tag}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors mb-1.5">
                {article.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {article.desc}
              </p>
              <span className="text-[10px] text-slate-500">{article.readTime}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 11. OPEN DEMAT ACCOUNT SECTION */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="bg-[#131927] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max mb-2">
                OFFICIAL BROKER PARTNERS
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Open Demat Account
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paperless 5-minute KYC setup with 0% commission equity investing.
              </p>
            </div>

            <button
              onClick={() => navigate('/open-demat')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer w-max"
            >
              <span>Explore All Brokers</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Brokers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dematBrokers.map((broker, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/open-demat')}
                className={`bg-gradient-to-b ${broker.color} border rounded-2xl p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 transition-all shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-white bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-lg">
                      {broker.name}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded">
                      {broker.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {broker.tag}
                  </h3>

                  <div className="space-y-1.5 my-4 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{broker.fee}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{broker.brokerage}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{broker.rating} User Rating</span>
                  <span className="text-xs font-extrabold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Perks Summary Bar */}
          <div className="bg-[#0E1320] border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>SEBI &amp; CDSL / NSDL Registered</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>Zero Delivery Brokerage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Instant Digital e-KYC Verification</span>
            </div>
          </div>

        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Logo />
        </div>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed text-slate-500 mb-2">
          ⚠️ Disclaimer: Stock Finder is for educational and analytical purposes only. Not financial advice. Always consult a certified SEBI advisor before investing.
        </p>
        <p className="text-[10px] text-slate-600">
          © 2026 Stock Finder. Built with React.
        </p>
      </footer>

    </div>
  );
}