import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { 
  Zap, Bell, BarChart3, TrendingUp, TrendingDown, Layers, ShieldCheck, 
  Plus, Trash2, Play, Pause, ChevronRight, ChevronDown, Sparkles, CheckCircle2,
  Calculator, ArrowUpRight, ArrowDownRight, Target, Brain, ShoppingBag, Sliders,
  RefreshCw, DollarSign, Activity, Lock, AlertTriangle
} from 'lucide-react';

export default function ToolsPage() {
  const navigate = useNavigate();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('strategies'); // 'strategies' | 'alerts' | 'insights' | 'scalper' | 'basket'
  const [stratFilter, setStratFilter] = useState('All'); // 'All' | 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile'
  const [expandedStrat, setExpandedStrat] = useState(null);

  // Price Alerts State
  const [alerts, setAlerts] = useState([
    { id: 1, symbol: 'RELIANCE', currentPrice: 2847.30, targetPrice: 2900.00, condition: 'Above', on: true, note: 'Breakout above resistance' },
    { id: 2, symbol: 'TCS', currentPrice: 3921.15, targetPrice: 3850.00, condition: 'Below', on: true, note: 'Dip buy opportunity' },
    { id: 3, symbol: 'NIFTY 50', currentPrice: 23984.00, targetPrice: 24200.00, condition: 'Above', on: false, note: 'All-time high target' },
    { id: 4, symbol: 'INFY', currentPrice: 1456.80, targetPrice: 1500.00, condition: 'Above', on: true, note: 'Post-earnings target' }
  ]);
  const [newAlert, setNewAlert] = useState({ symbol: '', price: '', condition: 'Above', note: '' });

  // Scalper Terminal State
  const [scalperStock, setScalperStock] = useState('NIFTY 24000 CE');
  const [scalperQty, setScalperQty] = useState(25);
  const [scalperPrice, setScalperPrice] = useState(142.50);
  const [orderType, setOrderType] = useState('MARKET');
  const [ordersLog, setOrdersLog] = useState([
    { id: 1, side: 'BUY', stock: 'NIFTY 24000 CE', qty: 25, price: 138.20, status: 'FILLED', time: '09:42:15 AM' },
    { id: 2, side: 'SELL', stock: 'NIFTY 24000 CE', qty: 25, price: 145.80, status: 'FILLED', time: '09:48:30 AM' }
  ]);

  // Basket Orders State
  const [basket, setBasket] = useState([
    { id: 1, symbol: 'RELIANCE', action: 'BUY', qty: 10, type: 'EQUITY', approxPrice: 2847.30 },
    { id: 2, symbol: 'HDFCBANK', action: 'BUY', qty: 25, type: 'EQUITY', approxPrice: 1623.55 }
  ]);

  // Option Strategies Dataset
  const strategies = [
    {
      id: 'bull-call-spread',
      name: 'Bull Call Spread',
      type: 'Bullish',
      risk: 'Limited (Net Premium Paid)',
      reward: 'Limited (Strike Diff - Premium)',
      breakeven: 'Lower Strike + Net Premium Paid',
      maxProfit: '₹8,400',
      maxLoss: '₹3,600',
      when: 'When you expect moderate upside in the stock price with reduced capital risk.',
      legs: ['BUY 1 ATM Call Option', 'SELL 1 OTM Call Option'],
      color: 'emerald',
      icon: TrendingUp
    },
    {
      id: 'bear-put-spread',
      name: 'Bear Put Spread',
      type: 'Bearish',
      risk: 'Limited (Net Premium Paid)',
      reward: 'Limited (Strike Diff - Premium)',
      breakeven: 'Higher Strike - Net Premium Paid',
      maxProfit: '₹9,200',
      maxLoss: '₹4,100',
      when: 'When you expect moderate downside in the stock or market index.',
      legs: ['BUY 1 ATM Put Option', 'SELL 1 OTM Put Option'],
      color: 'red',
      icon: TrendingDown
    },
    {
      id: 'iron-condor',
      name: 'Iron Condor',
      type: 'Neutral',
      risk: 'Limited',
      reward: 'Limited (Net Premium Credit)',
      breakeven: 'Put Strike - Credit / Call Strike + Credit',
      maxProfit: '₹6,500',
      maxLoss: '₹5,500',
      when: 'When you expect the stock to trade in a tight range with low volatility.',
      legs: ['SELL 1 OTM Put', 'BUY 1 Far OTM Put', 'SELL 1 OTM Call', 'BUY 1 Far OTM Call'],
      color: 'amber',
      icon: Layers
    },
    {
      id: 'long-straddle',
      name: 'Long Straddle',
      type: 'Volatile',
      risk: 'Limited to total premium paid',
      reward: 'Unlimited',
      breakeven: 'Strike ± Total Premium Paid',
      maxProfit: 'Unlimited',
      maxLoss: '₹7,200',
      when: 'When an earnings announcement or major economic event causes high volatility.',
      legs: ['BUY 1 ATM Call Option', 'BUY 1 ATM Put Option'],
      color: 'purple',
      icon: Zap
    },
    {
      id: 'covered-call',
      name: 'Covered Call',
      type: 'Bullish',
      risk: 'Substantial (Stock Price Decline)',
      reward: 'Limited to Call Premium',
      breakeven: 'Purchase Price - Premium Received',
      maxProfit: '₹12,000',
      maxLoss: 'Stock downside minus premium',
      when: 'When you hold underlying stock and want to generate extra rental income.',
      legs: ['HOLD 1 Lot Underlying Shares', 'SELL 1 OTM Call Option'],
      color: 'blue',
      icon: ShieldCheck
    },
    {
      id: 'protective-put',
      name: 'Protective Put',
      type: 'Bearish',
      risk: 'Limited (Put Premium Paid)',
      reward: 'Unlimited Stock Upside',
      breakeven: 'Stock Purchase Price + Put Premium',
      maxProfit: 'Unlimited',
      maxLoss: 'Put Premium Paid',
      when: 'When you hold long-term shares but want insurance against market crashes.',
      legs: ['HOLD Underlying Stock', 'BUY 1 ATM/OTM Put Option'],
      color: 'cyan',
      icon: Lock
    }
  ];

  // Filtered Strategies
  const filteredStrategies = useMemo(() => {
    if (stratFilter === 'All') return strategies;
    return strategies.filter(s => s.type.toLowerCase() === stratFilter.toLowerCase());
  }, [stratFilter]);

  // Handle Add Alert
  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!newAlert.symbol || !newAlert.price) return;
    const alertObj = {
      id: Date.now(),
      symbol: newAlert.symbol.toUpperCase(),
      currentPrice: parseFloat(newAlert.price) * 0.98,
      targetPrice: parseFloat(newAlert.price),
      condition: newAlert.condition,
      on: true,
      note: newAlert.note || 'User defined target'
    };
    setAlerts([alertObj, ...alerts]);
    setNewAlert({ symbol: '', price: '', condition: 'Above', note: '' });
  };

  // Handle Scalper Order
  const handleScalperOrder = (side) => {
    const newOrd = {
      id: Date.now(),
      side,
      stock: scalperStock,
      qty: scalperQty,
      price: parseFloat(scalperPrice),
      status: 'FILLED',
      time: new Date().toLocaleTimeString('en-IN')
    };
    setOrdersLog([newOrd, ...ordersLog.slice(0, 9)]);
  };

  // Monthly PnL Data for Insights Tab
  const monthlyPnL = [
    { month: 'Jan', pnl: 14200, winRate: 64 },
    { month: 'Feb', pnl: -4800, winRate: 45 },
    { month: 'Mar', pnl: 22500, winRate: 70 },
    { month: 'Apr', pnl: 11200, winRate: 58 },
    { month: 'May', pnl: 31900, winRate: 75 },
    { month: 'Jun', pnl: -6100, winRate: 40 },
    { month: 'Jul', pnl: 18600, winRate: 68 },
    { month: 'Aug', pnl: 42400, winRate: 82 },
    { month: 'Sep', pnl: 15300, winRate: 62 }
  ];

  const maxPnl = Math.max(...monthlyPnL.map(m => Math.abs(m.pnl)));

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-20 selection:bg-blue-600 selection:text-white">
      
      {/* 1. SHARED OFFICIAL NAVBAR */}
      <Navbar />

      {/* 2. HERO PAGE TITLE */}
      <header className="border-b border-slate-800/80 bg-[#0E1320] pt-8 pb-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SMART TRADING TOOLS &amp; STRATEGY ENGINE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Professional Trading Tools
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Automated option spreads, real-time GTT alerts, AI analytics, and instant scalper terminal.
            </p>
          </div>

          {/* Quick Metrics Bar Header */}
          <div className="flex items-center gap-3 bg-[#131927] p-2.5 rounded-2xl border border-slate-800/80 text-xs">
            <div className="px-3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] block">Active Alerts</span>
              <span className="font-bold text-white text-sm">{alerts.filter(a => a.on).length} Active</span>
            </div>
            <div className="px-3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] block">Win Rate (30D)</span>
              <span className="font-bold text-emerald-400 text-sm">68.4%</span>
            </div>
            <div className="px-3">
              <span className="text-slate-500 text-[10px] block">Profit Factor</span>
              <span className="font-bold text-blue-400 text-sm">2.14</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* ==================== LEFT SIDEBAR NAVIGATION ==================== */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Navigation Tabs List */}
            <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 px-3 py-1 uppercase tracking-wider block">
                TOOL SECTIONS
              </span>

              {[
                { id: 'strategies', label: 'Option Strategies', icon: Layers, badge: '6 Ready' },
                { id: 'alerts', label: 'GTT & Price Alerts', icon: Bell, badge: `${alerts.length}` },
                { id: 'insights', label: 'AI PnL Insights', icon: Brain, badge: 'AI' },
                { id: 'scalper', label: 'Scalper Terminal', icon: Zap, badge: 'FAST' },
                { id: 'basket', label: 'Basket Orders', icon: ShoppingBag, badge: `${basket.length}` }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-400 hover:text-white hover:bg-[#1A2234]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                QUICK SHORTCUTS
              </span>
              <div className="space-y-2 text-xs font-semibold">
                <button 
                  onClick={() => navigate('/calculator')}
                  className="w-full flex items-center justify-between p-2.5 bg-[#0E1320] hover:bg-slate-800/80 border border-slate-800/60 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>SIP Calculator</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button 
                  onClick={() => navigate('/tradeone')}
                  className="w-full flex items-center justify-between p-2.5 bg-[#0E1320] hover:bg-slate-800/80 border border-slate-800/60 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span>Live Trading Terminal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Risk Management Tip Card */}
            <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/30 border border-blue-500/20 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Pro Risk Rule</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Never risk more than 2% of total trading capital on a single position. Always define your stop loss before entering a trade.
              </p>
            </div>

          </aside>

          {/* ==================== RIGHT CONTENT WORKSPACE ==================== */}
          <main className="lg:col-span-3">
            
            {/* ---------------- 1. OPTION STRATEGIES SECTION ---------------- */}
            {activeTab === 'strategies' && (
              <div className="space-y-6">
                
                {/* Header & Filter Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#131927] border border-slate-800/80 rounded-2xl p-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Option Strategy Engine
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pre-built multi-leg options strategies with predefined risk and payoff structure.
                    </p>
                  </div>

                  {/* Sentiment Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#0E1320] p-1 rounded-xl border border-slate-800 text-xs">
                    {['All', 'Bullish', 'Bearish', 'Neutral', 'Volatile'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStratFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          stratFilter === filter 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategies Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStrategies.map((st) => {
                    const Icon = st.icon;
                    const isExpanded = expandedStrat === st.id;

                    return (
                      <div 
                        key={st.id} 
                        className={`bg-[#131927] border rounded-2xl p-4 transition-all flex flex-col justify-between shadow-lg ${
                          st.color === 'emerald' ? 'border-emerald-500/30 hover:border-emerald-500/60' :
                          st.color === 'red' ? 'border-red-500/30 hover:border-red-500/60' :
                          st.color === 'amber' ? 'border-amber-500/30 hover:border-amber-500/60' :
                          st.color === 'purple' ? 'border-purple-500/30 hover:border-purple-500/60' :
                          'border-blue-500/30 hover:border-blue-500/60'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
                                st.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                st.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                st.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                st.color === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-white">{st.name}</h3>
                                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded uppercase mt-0.5 ${
                                  st.type === 'Bullish' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                  st.type === 'Bearish' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                                  st.type === 'Neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                  'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                }`}>
                                  {st.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-[#0E1320] p-3 rounded-xl border border-slate-800/60">
                            {st.when}
                          </p>

                          {/* Profit / Loss Payoff Metrics Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] my-2 py-1 border-y border-slate-800/80">
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase">Est. Max Profit</span>
                              <span className="font-extrabold text-emerald-400">{st.maxProfit}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase">Est. Max Loss</span>
                              <span className="font-extrabold text-red-400">{st.maxLoss}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Legs Drawer Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => setExpandedStrat(isExpanded ? null : st.id)}
                            className="w-full py-2 px-3 bg-[#0E1320] hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Strategy Legs' : 'View Strategy Legs & Execution'}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Expanded Leg Details */}
                          {isExpanded && (
                            <div className="mt-3 p-3 bg-[#0E1320] rounded-xl border border-slate-800/80 space-y-2 animate-fadeIn text-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Strategy Execution Legs:
                              </span>
                              {st.legs.map((leg, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-slate-200">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="font-semibold">{leg}</span>
                                </div>
                              ))}

                              <button 
                                onClick={() => navigate('/tradeone')}
                                className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Execute on Terminal</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ---------------- 2. PRICE ALERTS & GTT SECTION ---------------- */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                
                {/* Add Alert Form */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <span>Create Live Price Alert / GTT Trigger</span>
                  </h2>

                  <form onSubmit={handleAddAlert} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Stock Symbol</label>
                      <input
                        type="text"
                        placeholder="e.g. RELIANCE, TCS"
                        value={newAlert.symbol}
                        onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Target Price (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3000"
                        value={newAlert.price}
                        onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Condition</label>
                      <select
                        value={newAlert.condition}
                        onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      >
                        <option value="Above">Price Moves Above (≥)</option>
                        <option value="Below">Price Moves Below (≤)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Alert</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Alerts List Table */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Active Price Triggers ({alerts.length})</h3>
                    <span className="text-xs text-slate-400">Notifies via Push &amp; In-App Sound</span>
                  </div>

                  <div className="divide-y divide-slate-800/60 text-xs">
                    {alerts.map((al) => (
                      <div key={al.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#1A2234] transition-colors">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setAlerts(alerts.map(a => a.id === al.id ? { ...a, on: !a.on } : a));
                            }}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              al.on 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {al.on ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{al.symbol}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                al.condition === 'Above' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                              }`}>
                                {al.condition === 'Above' ? '≥ Above' : '≤ Below'} ₹{al.targetPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">{al.note}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">LTP Price</span>
                            <span className="font-bold text-slate-200">₹{al.currentPrice.toLocaleString('en-IN')}</span>
                          </div>

                          <button
                            onClick={() => setAlerts(alerts.filter(a => a.id !== al.id))}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- 3. AI TRADING INSIGHTS SECTION ---------------- */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                
                {/* Key Performance Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Executed Trades', val: '247', sub: 'Last 90 days', icon: Activity, color: 'text-blue-400' },
                    { label: 'Overall Win Rate', val: '68.4%', sub: '+4.2% vs last month', icon: Target, color: 'text-emerald-400' },
                    { label: 'Profit Factor', val: '2.14', sub: 'Healthy risk:reward', icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Max Drawdown', val: '-5.2%', sub: 'Within risk limits', icon: ShieldCheck, color: 'text-amber-400' }
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="bg-[#131927] border border-slate-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{stat.label}</span>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className={`text-xl font-black ${stat.color}`}>{stat.val}</div>
                        <span className="text-[10px] text-slate-500 mt-1 block">{stat.sub}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly PnL Visual Bar Chart */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <span>Monthly P&amp;L Performance Breakdown (₹)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Historical net realized profit and loss per month.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/50">
                      Total PnL: +₹1,44,000
                    </span>
                  </div>

                  {/* SVG Bar Visualizer */}
                  <div className="flex items-end justify-between gap-2 h-44 pt-4 border-b border-slate-800/80 pb-2 px-2">
                    {monthlyPnL.map((item, idx) => {
                      const isProfit = item.pnl >= 0;
                      const heightPct = Math.round((Math.abs(item.pnl) / maxPnl) * 100);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                          {/* Hover Tooltip Value */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow absolute -translate-y-8 pointer-events-none">
                            {isProfit ? '+' : ''}₹{item.pnl.toLocaleString('en-IN')}
                          </div>

                          {/* Bar Graphic */}
                          <div 
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                              isProfit 
                                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
                                : 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/20'
                            }`}
                          />
                          <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Automated Trade Recommendations */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span>AI Trade Optimization Feed</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-[#0E1320] border border-purple-500/30 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-0.5">High Win-Rate Sector Detected: IT &amp; Tech</h4>
                        <p className="text-slate-400 leading-relaxed">
                          Your historical trades in TCS and INFY show a 78% win rate with an average holding period of 3 days. Consider prioritizing IT breakouts.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#0E1320] border border-amber-500/30 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-0.5">Avoid Over-Trading On Loss Days</h4>
                        <p className="text-slate-400 leading-relaxed">
                          Data shows 62% of your losses occurred after taking more than 4 trades in a single session. Enforce a daily limit of 3 trades.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- 4. SCALPER TERMINAL SECTION ---------------- */}
            {activeTab === 'scalper' && (
              <div className="space-y-6">
                
                {/* Scalper Controls Header */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>Ultra-Fast Scalper Order Panel</span>
                    </h2>
                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                      SUB-SECOND EXECUTION
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-6">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Instrument / Contract</label>
                      <input
                        type="text"
                        value={scalperStock}
                        onChange={(e) => setScalperStock(e.target.value.toUpperCase())}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Quantity / Lots</label>
                      <input
                        type="number"
                        min={1}
                        value={scalperQty}
                        onChange={(e) => setScalperQty(Math.max(1, Number(e.target.value)))}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Price (₹)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={scalperPrice}
                        onChange={(e) => setScalperPrice(e.target.value)}
                        className="w-full p-2.5 bg-[#0E1320] border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Direct Instant Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleScalperOrder('BUY')}
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      <span>INSTANT BUY @ ₹{scalperPrice}</span>
                    </button>

                    <button
                      onClick={() => handleScalperOrder('SELL')}
                      className="py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowDownRight className="w-5 h-5" />
                      <span>INSTANT SELL @ ₹{scalperPrice}</span>
                    </button>
                  </div>
                </div>

                {/* Scalper Live Order Log */}
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Execution Order Log</h3>
                    <span className="text-xs text-slate-400">Simulated Instant Trades</span>
                  </div>

                  <div className="divide-y divide-slate-800/60 text-xs">
                    {ordersLog.map((ord) => (
                      <div key={ord.id} className="p-3.5 flex items-center justify-between hover:bg-[#1A2234] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase ${
                            ord.side === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                          }`}>
                            {ord.side}
                          </span>
                          <span className="font-bold text-white">{ord.stock}</span>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="text-slate-300 font-semibold">Qty: {ord.qty}</span>
                          <span className="text-slate-300 font-semibold">@ ₹{ord.price.toFixed(2)}</span>
                          <span className="text-slate-500 text-[10px]">{ord.time}</span>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- 5. BASKET ORDERS SECTION ---------------- */}
            {activeTab === 'basket' && (
              <div className="space-y-6">
                <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-400" />
                        <span>Multi-Leg Basket Order Engine</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Combine multiple stock or option legs and execute all at once.</p>
                    </div>

                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Add Leg to Basket</span>
                    </button>
                  </div>

                  {/* Basket Item Rows */}
                  <div className="divide-y divide-slate-800/80 my-4 border-y border-slate-800/80">
                    {basket.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {item.action}
                          </span>
                          <div>
                            <span className="font-bold text-white block">{item.symbol}</span>
                            <span className="text-[10px] text-slate-500">{item.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="text-slate-300">Qty: <b>{item.qty}</b></span>
                          <span className="text-slate-300">Approx: <b>₹{item.approxPrice.toFixed(2)}</b></span>
                          <button 
                            onClick={() => setBasket(basket.filter(b => b.id !== item.id))}
                            className="text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Basket Execution Bottom Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-slate-400 text-xs block">Total Margin Required</span>
                      <span className="text-lg font-black text-blue-400">
                        ₹{(basket.reduce((acc, b) => acc + (b.qty * b.approxPrice), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button 
                      onClick={() => alert('Basket Orders Executed Successfully!')}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                    >
                      EXECUTE ALL BASKET ORDERS
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>

    </div>
  );
}