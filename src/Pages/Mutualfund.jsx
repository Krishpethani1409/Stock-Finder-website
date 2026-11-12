import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import { 
  Search, TrendingUp, ShieldCheck, Percent, Layers, Building2, 
  ChevronRight, ArrowRight, Wallet, PieChart, Sparkles, X, Star, 
  ArrowUpRight, Calculator, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function Mutualfund() {
  // Navigation & Filter States
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('return3Y'); // 'return1Y' | 'return3Y' | 'return5Y'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Modal States
  const [selectedFund, setSelectedFund] = useState(null);
  const [showSipCalc, setShowSipCalc] = useState(false);

  // SIP Calculator State inside Modal
  const [monthlySip, setMonthlySip] = useState(5000);
  const [sipYears, setSipYears] = useState(10);
  const [sipReturnRate, setSipReturnRate] = useState(15);

  // Funds Data Array
  const rawFunds = [
    {
      id: 'quant-small-cap',
      name: 'Quant Small Cap Fund Direct-Growth',
      amc: 'Quant Mutual Fund',
      amcCode: 'QU',
      category: 'Equity',
      subCategory: 'Small Cap',
      nav: 286.45,
      return1Y: 38.4,
      return3Y: 48.2,
      return5Y: 54.6,
      risk: 'Very High',
      aum: '₹22,630 Cr',
      minSip: 1000,
      rating: 5,
      about: 'Focuses on aggressive growth by investing heavily in high-momentum small-cap equities with active portfolio churn.'
    },
    {
      id: 'nippon-small-cap',
      name: 'Nippon India Small Cap Fund Direct-Growth',
      amc: 'Nippon India MF',
      amcCode: 'NI',
      category: 'Equity',
      subCategory: 'Small Cap',
      nav: 132.88,
      return1Y: 30.2,
      return3Y: 38.5,
      return5Y: 42.3,
      risk: 'Very High',
      aum: '₹52,840 Cr',
      minSip: 100,
      rating: 5,
      about: 'One of India\'s largest small-cap funds with a well-diversified basket of over 100+ emerging market leaders.'
    },
    {
      id: 'hdfc-mid-cap',
      name: 'HDFC Mid-Cap Opportunities Fund Direct-G',
      amc: 'HDFC Mutual Fund',
      amcCode: 'HD',
      category: 'Equity',
      subCategory: 'Mid Cap',
      nav: 145.32,
      return1Y: 24.1,
      return3Y: 29.8,
      return5Y: 33.5,
      risk: 'High',
      aum: '₹68,900 Cr',
      minSip: 100,
      rating: 5,
      about: 'A consistent mid-cap scheme focusing on companies with sound business models and strong long-term growth potential.'
    },
    {
      id: 'parag-parikh-flexi',
      name: 'Parag Parikh Flexi Cap Fund Direct-Growth',
      amc: 'PPFAS Mutual Fund',
      amcCode: 'PP',
      category: 'Equity',
      subCategory: 'Flexi Cap',
      nav: 82.17,
      return1Y: 19.4,
      return3Y: 22.1,
      return5Y: 26.8,
      risk: 'Moderately High',
      aum: '₹72,500 Cr',
      minSip: 1000,
      rating: 5,
      about: 'Follows value-investing principles across Indian equities and selective international tech stocks like Alphabet and Microsoft.'
    },
    {
      id: 'sbi-equity-hybrid',
      name: 'SBI Equity Hybrid Fund Direct-Growth',
      amc: 'SBI Mutual Fund',
      amcCode: 'SB',
      category: 'Hybrid',
      subCategory: 'Aggressive Hybrid',
      nav: 212.65,
      return1Y: 12.8,
      return3Y: 15.6,
      return5Y: 18.2,
      risk: 'Moderately High',
      aum: '₹62,100 Cr',
      minSip: 500,
      rating: 5,
      about: 'Maintains a balanced 70-30 allocation between equity markets for growth and quality debt instruments for stability.'
    },
    {
      id: 'icici-pru-corporate-bond',
      name: 'ICICI Pru Corporate Bond Fund Direct-G',
      amc: 'ICICI Prudential MF',
      amcCode: 'IC',
      category: 'Debt',
      subCategory: 'Corporate Bond',
      nav: 26.78,
      return1Y: 7.8,
      return3Y: 7.2,
      return5Y: 8.6,
      risk: 'Moderate',
      aum: '₹24,150 Cr',
      minSip: 1000,
      rating: 5,
      about: 'Invests predominantly in AA+ and AAA-rated corporate debt instruments offering capital safety and stable accrual interest.'
    },
    {
      id: 'hdfc-short-term-debt',
      name: 'HDFC Short Term Debt Fund Direct-Growth',
      amc: 'HDFC Mutual Fund',
      amcCode: 'HD',
      category: 'Debt',
      subCategory: 'Short Duration',
      nav: 28.45,
      return1Y: 7.2,
      return3Y: 6.8,
      return5Y: 7.1,
      risk: 'Low to Moderate',
      aum: '₹13,820 Cr',
      minSip: 1000,
      rating: 4,
      about: 'Ideal for 1-3 year investment horizons targeting high liquidity and low interest-rate risk exposure.'
    },
    {
      id: 'mirae-asset-fang',
      name: 'Mirae Asset NYSE FANG+ ETF FoF Direct',
      amc: 'Mirae Asset MF',
      amcCode: 'MI',
      category: 'International',
      subCategory: 'Tech / FANG',
      nav: 21.45,
      return1Y: 28.4,
      return3Y: 19.8,
      return5Y: 24.2,
      risk: 'Very High',
      aum: '₹1,820 Cr',
      minSip: 1000,
      rating: 4,
      about: 'Provides Indian investors direct Rupee exposure to global US mega-cap technology leaders like Apple, Nvidia, and Meta.'
    }
  ];

  // Filter & Sort Logic
  const filteredFunds = useMemo(() => {
    return rawFunds
      .filter((fund) => {
        const matchesCategory = activeCategory === 'All' || fund.category === activeCategory;
        const matchesSearch = fund.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              fund.amc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              fund.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [activeCategory, searchQuery, sortBy]);

  // SIP Calculator Calculations
  const calculateSipResult = () => {
    const months = sipYears * 12;
    const rate = sipReturnRate / 12 / 100;
    const totalInvested = monthlySip * months;
    const futureValue = monthlySip * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    const estimatedReturns = futureValue - totalInvested;
    return { totalInvested, estimatedReturns, futureValue };
  };

  const sipResult = calculateSipResult();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-20 selection:bg-blue-600 selection:text-white">
      
      {/* --- 1. OFFICIAL WEBSITE NAVBAR --- */}
      <Navbar />

      {/* --- 2. HERO HEADER --- */}
      <section className="relative pt-12 pb-14 px-4 max-w-7xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[220px] bg-blue-600/15 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MUTUAL FUNDS • DIRECT • 0% COMMISSION</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Invest in Direct <span className="text-blue-500">Mutual Funds</span>
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
          4,000+ mutual fund schemes from 44 AMCs. Compare returns, NAV, and risk. Start SIP from ₹100. Zero commission, direct plans only.
        </p>

        {/* Search Input Bar */}
        <div className="max-w-2xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fund name, AMC, category..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#131927] border border-slate-700/70 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-inner transition-all"
            />
            <button className="absolute right-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
              Search
            </button>
          </div>
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {['Small Cap', 'ELSS Tax Saver', 'Large Cap', 'Mid Cap', 'Flexi Cap', 'Corporate Bond'].map((tag, idx) => (
            <button 
              key={idx}
              onClick={() => setSearchQuery(tag)} 
              className="px-3.5 py-1.5 rounded-lg bg-[#131927] border border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-white transition-all cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* --- 3. METRIC STATS BANNER --- */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: "4,000+", label: "Fund Schemes" },
            { title: "44", label: "Fund Houses" },
            { title: "₹100", label: "Min SIP" },
            { title: "0%", label: "Commission" },
            { title: "5 Mins", label: "Account Opening" },
          ].map((item, index) => (
            <div key={index} className="bg-[#131927] border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="text-xl font-black text-white">{item.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. CATEGORY TABS & SORTING CONTROLS --- */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Equity', 'Debt', 'Hybrid', 'International'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-[#131927] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Tools Controls */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button 
              onClick={() => setShowSipCalc(true)}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              SIP Calculator
            </button>

            <div className="flex items-center gap-1 bg-[#131927] p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 px-2">Sort:</span>
              <button
                onClick={() => setSortBy('return1Y')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'return1Y' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                1Y
              </button>
              <button
                onClick={() => setSortBy('return3Y')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'return3Y' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                3Y
              </button>
              <button
                onClick={() => setSortBy('return5Y')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'return5Y' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                5Y
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. INTERACTIVE FUNDS GRID CARDS --- */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredFunds.length > 0 ? (
            filteredFunds.map((fund) => (
              <div
                key={fund.id}
                onClick={() => setSelectedFund(fund)}
                className="bg-[#131927] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between shadow-lg hover:shadow-2xl"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {fund.amcCode}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {fund.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{fund.amc} • {fund.subCategory}</p>
                      </div>
                    </div>
                  </div>

                  {/* NAV & Rating */}
                  <div className="flex items-center justify-between text-xs my-4 py-2 border-y border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[11px] block">NAV</span>
                      <span className="font-bold text-slate-200">₹{fund.nav.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">Rating</span>
                      <span className="text-amber-400 font-bold">{'★'.repeat(fund.rating)}</span>
                    </div>
                  </div>

                  {/* Returns Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-[#0E1320] p-3 rounded-xl mb-4 border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">1Y Return</span>
                      <span className="text-xs font-bold text-emerald-400">+{fund.return1Y}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">3Y Return</span>
                      <span className="text-xs font-bold text-emerald-400">+{fund.return3Y}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">5Y Return</span>
                      <span className="text-xs font-bold text-emerald-400">+{fund.return5Y}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    fund.risk === 'Very High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    fund.risk === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {fund.risk}
                  </span>

                  <button className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-[#131927] rounded-2xl border border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Funds Found</h3>
              <p className="text-xs text-slate-400 mb-4">Try clearing your search query or selecting a different category filter.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- 6. CLICKABLE FUND DETAILS DRAWER / MODAL (HIGH Z-INDEX z-[200]) --- */}
      {selectedFund && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="flex-1" onClick={() => setSelectedFund(null)} />
          
          <div className="w-full max-w-lg bg-[#0E1320] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center">
                    {selectedFund.amcCode}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white line-clamp-1">{selectedFund.name}</h2>
                    <p className="text-xs text-slate-400">{selectedFund.amc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFund(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fund Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#131927] p-4 rounded-xl border border-slate-800/80 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">NAV Price</span>
                  <span className="text-base font-bold text-white">₹{selectedFund.nav.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Min. SIP Amount</span>
                  <span className="text-base font-bold text-white">₹{selectedFund.minSip}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Fund AUM</span>
                  <span className="font-bold text-slate-200">{selectedFund.aum}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-0.5">SEBI Category</span>
                  <span className="font-bold text-slate-200">{selectedFund.category} ({selectedFund.subCategory})</span>
                </div>
              </div>

              {/* Returns Breakdown */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historical Returns</h3>
                <div className="grid grid-cols-3 gap-3 text-center bg-[#131927] p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">1 Year</span>
                    <span className="text-sm font-black text-emerald-400">+{selectedFund.return1Y}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">3 Years</span>
                    <span className="text-sm font-black text-emerald-400">+{selectedFund.return3Y}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">5 Years</span>
                    <span className="text-sm font-black text-emerald-400">+{selectedFund.return5Y}%</span>
                  </div>
                </div>
              </div>

              {/* Fund Objective */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fund Objective</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#131927] p-4 rounded-xl border border-slate-800/80">
                  {selectedFund.about}
                </p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <button 
                onClick={() => { setSelectedFund(null); setShowSipCalc(true); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                SIP Calculator
              </button>
              <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-blue-600/20 cursor-pointer">
                START SIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 7. CLICKABLE SIP CALCULATOR MODAL (HIGH Z-INDEX z-[200]) --- */}
      {showSipCalc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#0E1320] border border-slate-800 rounded-2xl p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowSipCalc(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">SIP Calculator</h2>
            <p className="text-xs text-slate-400 mb-6">Estimate your future wealth growth with regular monthly investments.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Sliders */}
              <div className="space-y-5 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-400">Monthly SIP Amount</span>
                    <span className="text-white font-bold">₹{monthlySip.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={100000}
                    step={500}
                    value={monthlySip}
                    onChange={(e) => setMonthlySip(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-400">Expected Annual Return</span>
                    <span className="text-white font-bold">{sipReturnRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={0.5}
                    value={sipReturnRate}
                    onChange={(e) => setSipReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-400">Time Duration</span>
                    <span className="text-white font-bold">{sipYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Results Box */}
              <div className="bg-[#131927] border border-slate-800 rounded-xl p-5 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Estimated Total Value</span>
                <div className="text-2xl font-black text-emerald-400 mb-4">
                  ₹{Math.round(sipResult.futureValue).toLocaleString('en-IN')}
                </div>

                <div className="grid grid-cols-2 gap-2 text-left text-xs border-t border-slate-800 pt-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Invested Amount</span>
                    <span className="font-semibold text-slate-200">₹{Math.round(sipResult.totalInvested).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Est. Wealth Gain</span>
                    <span className="font-semibold text-emerald-400">₹{Math.round(sipResult.estimatedReturns).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 8. DISCLAIMER FOOTER --- */}
      <footer className="max-w-7xl mx-auto px-4 text-center border-t border-slate-800/80 pt-6">
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl mx-auto">
          Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing. Past performance is not an indicator of future returns.
        </p>
      </footer>

    </div>
  );
}