import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Tickertape from '../components/TickerTape.jsx';
import {
  Calculator as CalcIcon, TrendingUp, Repeat, Percent,
  IndianRupee, Info, PieChart as PieIcon, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ── Helpers ──
const formatINR = (num) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(num || 0));

const formatINR2 = (num) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num || 0);

export default function Calculator() {
  const [activeTab, setActiveTab] = useState('sip');

  const tabs = [
    { id: 'sip', label: 'SIP Calculator', icon: <Repeat className="w-4 h-4" /> },
    { id: 'lumpsum', label: 'Lumpsum Calculator', icon: <IndianRupee className="w-4 h-4" /> },
    { id: 'brokerage', label: 'Brokerage & PnL', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'pe', label: 'P/E Valuation', icon: <PieIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-24 selection:bg-blue-600 selection:text-white">
      <Navbar />
      {/* <Tickertape /> */}

      {/* HERO + TABS + HIGHLIGHTS PANEL */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: Title, description, tabs */}
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FREE TOOLS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Investment Calculators
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mb-8">
              Plan your SIP, lumpsum investments, trading costs, and stock valuation — all in one place, updated instantly as you type.
            </p>

            <div className="flex flex-wrap gap-2 bg-[#131927] p-1.5 rounded-2xl border border-slate-800 w-max max-w-full overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A2234]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Highlights panel — fills the blank space next to the header */}
          <div className="bg-gradient-to-b from-[#14224a] to-[#131927] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-3">
              <CalcIcon className="w-4 h-4 text-blue-400" />
              Why use our calculators?
            </h3>
            <div className="space-y-4">
              {[
                { icon: <Sparkles className="w-4 h-4" />, title: '100% Free, No Signup', desc: 'Every calculator is open — no login wall, no hidden paywall.' },
                { icon: <TrendingUp className="w-4 h-4" />, title: 'Updates Instantly', desc: 'Every slider and input recalculates live, no "Calculate" button needed.' },
                { icon: <IndianRupee className="w-4 h-4" />, title: 'Built for Indian Markets', desc: 'STT, GST, stamp duty & SEBI charges modeled for NSE/BSE trades.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-snug">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-blue-900/40 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-lg font-black text-blue-400">4</p>
                <p className="text-[10px] text-slate-500">Calculators</p>
              </div>
              <div>
                <p className="text-lg font-black text-emerald-400">Live</p>
                <p className="text-[10px] text-slate-500">Instant Results</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-4">
        {activeTab === 'sip' && <SIPCalculator />}
        {activeTab === 'lumpsum' && <LumpsumCalculator />}
        {activeTab === 'brokerage' && <BrokerageCalculator />}
        {activeTab === 'pe' && <PECalculator />}
      </section>

      <p className="max-w-7xl mx-auto px-4 mt-10 text-[11px] text-slate-500 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          These calculations are estimates based on the inputs provided and assume constant returns. Actual mutual fund
          and trading returns vary with market conditions, taxation, and brokerage plans. Not investment advice.
        </span>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SLIDER FIELD — shared styled input used across calculators
   ═══════════════════════════════════════════════════════ */
function SliderField({ label, value, setValue, min, max, step, prefix = '', suffix = '' }) {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-bold text-white">
          {prefix}{value.toLocaleString('en-IN')}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-blue-500 cursor-pointer"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DONUT RESULT CARD — shared invested vs returns chart
   ═══════════════════════════════════════════════════════ */
function ResultDonut({ invested, returns, total, label = 'Total Value' }) {
  const data = [
    { name: 'Invested', value: Math.max(invested, 0) },
    { name: 'Returns', value: Math.max(returns, 0) },
  ];
  const COLORS = ['#3b82f6', '#22c55e'];

  return (
    <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
      <div className="relative w-52 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={68}
              outerRadius={92}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatINR(v)}
              contentStyle={{ background: '#0F1729', border: '1px solid #263048', borderRadius: 10, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-slate-400">{label}</span>
          <span className="text-lg font-black text-white">{formatINR(total)}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 mt-6">
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-400">Invested</span>
          </div>
          <span className="text-sm font-bold text-white">{formatINR(invested)}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-400">Returns</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">{formatINR(returns)}</span>
        </div>
      </div>

      <div className="w-full border-t border-slate-800 mt-6 pt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">Future Value</span>
        <span className="text-xl font-black text-emerald-400">{formatINR(total)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   1. SIP CALCULATOR
   ═══════════════════════════════════════════════════════ */
function SIPCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const { invested, returns, total } = useMemo(() => {
    const months = years * 12;
    const monthlyRate = rate / 12 / 100;
    const fv =
      monthlyRate === 0
        ? monthly * months
        : monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const inv = monthly * months;
    return { invested: inv, returns: fv - inv, total: fv };
  }, [monthly, rate, years]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <SliderField label="Monthly Investment" value={monthly} setValue={setMonthly} min={500} max={100000} step={500} prefix="₹" />
        <SliderField label="Expected Return Rate (p.a)" value={rate} setValue={setRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderField label="Time Period" value={years} setValue={setYears} min={1} max={40} step={1} suffix=" Yr" />
      </div>

      <ResultDonut invested={invested} returns={returns} total={total} />

      <InfoCards
        left={{
          title: 'What is a SIP?',
          body: 'A Systematic Investment Plan lets you invest a fixed amount regularly (usually monthly) into mutual funds, building wealth gradually through the power of compounding and rupee-cost averaging.',
        }}
        right={{
          title: 'Why does compounding matter?',
          body: 'Your returns earn their own returns over time. The longer you stay invested, the more dramatic the growth — which is why starting early, even with small amounts, beats starting late with larger ones.',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. LUMPSUM CALCULATOR
   ═══════════════════════════════════════════════════════ */
function LumpsumCalculator() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const { invested, returns, total } = useMemo(() => {
    const fv = amount * Math.pow(1 + rate / 100, years);
    return { invested: amount, returns: fv - amount, total: fv };
  }, [amount, rate, years]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <SliderField label="Lumpsum Amount" value={amount} setValue={setAmount} min={1000} max={5000000} step={1000} prefix="₹" />
        <SliderField label="Expected Return Rate (p.a)" value={rate} setValue={setRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderField label="Time Period" value={years} setValue={setYears} min={1} max={40} step={1} suffix=" Yr" />
      </div>

      <ResultDonut invested={invested} returns={returns} total={total} />

      <InfoCards
        left={{
          title: 'What is Lumpsum Investing?',
          body: 'A one-time investment of a large amount, rather than spreading it out over time. It works best when you have a windfall (bonus, inheritance) and believe the market is fairly valued or undervalued right now.',
        }}
        right={{
          title: 'SIP vs Lumpsum — which is better?',
          body: 'Lumpsum can outperform SIP in a rising market since your full capital compounds from day one. SIP reduces timing risk through rupee-cost averaging. Most investors benefit from a mix of both.',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. BROKERAGE & PnL CALCULATOR
   ═══════════════════════════════════════════════════════ */
function NumberField({ label, value, setValue, prefix = '', suffix = '', step = 1 }) {
  return (
    <div className="mb-5">
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div className="flex items-center bg-[#0F1729] border border-slate-700 rounded-xl px-4 py-3">
        {prefix && <span className="text-slate-500 text-sm mr-1.5">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => setValue(Number(e.target.value))}
          className="bg-transparent outline-none text-white text-sm font-semibold w-full"
        />
        {suffix && <span className="text-slate-500 text-sm ml-1.5">{suffix}</span>}
      </div>
    </div>
  );
}

function BrokerageCalculator() {
  const [buyPrice, setBuyPrice] = useState(1500);
  const [sellPrice, setSellPrice] = useState(1560);
  const [qty, setQty] = useState(50);
  const [brokeragePerOrder, setBrokeragePerOrder] = useState(20);
  const [orderType, setOrderType] = useState('delivery'); // delivery | intraday

  const calc = useMemo(() => {
    const buyTurnover = buyPrice * qty;
    const sellTurnover = sellPrice * qty;
    const turnover = buyTurnover + sellTurnover;

    // Delivery trades are typically zero-brokerage on many platforms; intraday charges both legs.
    const brokerage = orderType === 'delivery' ? 0 : brokeragePerOrder * 2;

    const sttRate = orderType === 'delivery' ? 0.001 : 0.00025; // approx illustrative rates
    const stt = sellTurnover * sttRate;

    const exchangeCharges = turnover * 0.0000297; // approx NSE txn charges
    const gst = (brokerage + exchangeCharges) * 0.18;
    const stampDuty = buyTurnover * 0.00015;
    const sebiCharges = turnover * 0.0000001;

    const totalCharges = brokerage + stt + exchangeCharges + gst + stampDuty + sebiCharges;
    const grossPnl = sellTurnover - buyTurnover;
    const netPnl = grossPnl - totalCharges;

    return { turnover, brokerage, stt, exchangeCharges, gst, stampDuty, sebiCharges, totalCharges, grossPnl, netPnl };
  }, [buyPrice, sellPrice, qty, brokeragePerOrder, orderType]);

  const isProfit = calc.netPnl >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex gap-2 mb-6">
          {['delivery', 'intraday'].map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                orderType === t ? 'bg-blue-600 text-white' : 'bg-[#0F1729] text-slate-400 border border-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Buy Price" value={buyPrice} setValue={setBuyPrice} prefix="₹" step={0.05} />
          <NumberField label="Sell Price" value={sellPrice} setValue={setSellPrice} prefix="₹" step={0.05} />
        </div>
        <NumberField label="Quantity" value={qty} setValue={setQty} step={1} />
        {orderType === 'intraday' && (
          <NumberField label="Brokerage per Order (flat)" value={brokeragePerOrder} setValue={setBrokeragePerOrder} prefix="₹" step={1} />
        )}

        <div className="mt-2 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-300 leading-relaxed">
            Charges shown (STT, exchange fees, GST, stamp duty) are approximate illustrative rates for demonstration —
            actual charges vary by broker and current regulations.
          </p>
        </div>
      </div>

      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-bold text-white mb-5">Charges Breakdown</h3>
        <div className="space-y-3 text-xs">
          {[
            ['Turnover', calc.turnover],
            ['Brokerage', calc.brokerage],
            ['STT (Securities Transaction Tax)', calc.stt],
            ['Exchange Transaction Charges', calc.exchangeCharges],
            ['GST (18%)', calc.gst],
            ['Stamp Duty', calc.stampDuty],
            ['SEBI Charges', calc.sebiCharges],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between text-slate-400">
              <span>{label}</span>
              <span className="text-slate-200 font-semibold">{formatINR2(val)}</span>
            </div>
          ))}
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <span className="text-slate-300 font-bold">Total Charges</span>
            <span className="text-white font-bold">{formatINR2(calc.totalCharges)}</span>
          </div>
        </div>

        <div className={`mt-6 p-5 rounded-2xl border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300">Gross P&amp;L</span>
            <span className="text-sm font-bold text-white">{formatINR2(calc.grossPnl)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Net P&amp;L (after charges)</span>
            <span className={`text-2xl font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{formatINR2(calc.netPnl)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. P/E VALUATION CALCULATOR
   ═══════════════════════════════════════════════════════ */
function PECalculator() {
  const [price, setPrice] = useState(2847);
  const [eps, setEps] = useState(95);
  const [industryPE, setIndustryPE] = useState(28);

  const pe = eps > 0 ? price / eps : 0;
  const diffPct = industryPE > 0 ? ((pe - industryPE) / industryPE) * 100 : 0;
  const verdict = diffPct > 15 ? 'Overvalued' : diffPct < -15 ? 'Undervalued' : 'Fairly Valued';
  const verdictColor = diffPct > 15 ? 'text-red-400' : diffPct < -15 ? 'text-emerald-400' : 'text-blue-400';
  const verdictBg = diffPct > 15 ? 'bg-red-500/10 border-red-500/30' : diffPct < -15 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <NumberField label="Current Stock Price" value={price} setValue={setPrice} prefix="₹" step={1} />
        <NumberField label="Earnings Per Share (EPS)" value={eps} setValue={setEps} prefix="₹" step={0.5} />
        <NumberField label="Industry Average P/E" value={industryPE} setValue={setIndustryPE} step={0.5} />
      </div>

      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center">
        <span className="text-xs text-slate-400 mb-2">Price-to-Earnings Ratio</span>
        <span className="text-5xl font-black text-white mb-4">{pe.toFixed(2)}x</span>

        <div className={`w-full p-4 rounded-2xl border ${verdictBg} mb-4`}>
          <span className={`text-lg font-black ${verdictColor}`}>{verdict}</span>
          <p className="text-[11px] text-slate-400 mt-1">
            {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}% vs industry average of {industryPE}x
          </p>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[10px] mb-1">Stock P/E</span>
            <span className="font-bold text-white">{pe.toFixed(2)}x</span>
          </div>
          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[10px] mb-1">Industry P/E</span>
            <span className="font-bold text-white">{industryPE.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-[#131927] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-400" /> What does P/E ratio tell you?
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The P/E ratio shows how much investors are willing to pay for ₹1 of a company's earnings. A high P/E relative
          to the industry can mean the stock is overvalued or that investors expect strong future growth. A low P/E can
          mean the stock is undervalued or that the market has concerns about the company's prospects. Always compare
          P/E within the same sector — a "high" P/E in IT may be normal, but unusual in a capital-intensive industry.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED INFO CARDS (used by SIP & Lumpsum tabs)
   ═══════════════════════════════════════════════════════ */
function InfoCards({ left, right }) {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white mb-2">{left.title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{left.body}</p>
      </div>
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white mb-2">{right.title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{right.body}</p>
      </div>
    </div>
  );
}