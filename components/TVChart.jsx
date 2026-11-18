import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/* TradingView block — same widget, same look as before.
   ONLY change: NSE: symbols are replaced with BSE: ones, because the free
   TradingView embed shows "This symbol is only available on TradingView"
   for NSE: symbols. BSE: symbols work without the popup. */
export const TV_TABS = [
  { sym: "BSE:NIFTYBEES", label: "NIFTY" },
  { sym: "BSE:SENSEX", label: "SENSEX" },
  { sym: "BSE:BANKBEES", label: "BANKNIFTY" },
  { sym: "BSE:RELIANCE", label: "RELIANCE" },
  { sym: "BSE:HDFCBANK", label: "HDFCBANK" },
  { sym: "BSE:TCS", label: "TCS" },
];

export default function TVChart({ symbol, onSymbol }) {
  const [inner, setInner] = useState("BSE:NIFTYBEES");
  const activeChartSymbol = symbol || inner;
  const setActiveChartSymbol = onSymbol || setInner;
  const [activeTimeframe, setActiveTimeframe] = useState("D");
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const tvContainerRef = useRef(null);

  useEffect(() => {
    if (tvContainerRef.current) {
      tvContainerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            autosize: true,
            symbol: activeChartSymbol,
            interval: activeTimeframe,
            timezone: "Asia/Kolkata",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#0B0F19",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: "tradingview_markets_chart",
            hide_side_toolbar: false,
            studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "Volume@tv-basicstudies"],
            overrides: {
              "paneProperties.background": "#0B0F19",
              "paneProperties.vertGridProperties.color": "#1E293B",
              "paneProperties.horzGridProperties.color": "#1E293B",
              "symbolWatermarkProperties.transparency": 90,
              "scalesProperties.textColor": "#94A3B8",
            },
          });
        }
      };
      tvContainerRef.current.appendChild(script);
    }
  }, [activeChartSymbol, activeTimeframe]);

  const label = (TV_TABS.find((t) => t.sym === activeChartSymbol) || {}).label || activeChartSymbol;

  return (
    <section className={`bg-[#0B0F19] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl ${isChartFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      <div className="bg-[#131927] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-white text-sm tracking-tight">{label}</span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">● LIVE NSE/BSE</span>
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-800 pl-3">
            {TV_TABS.map((t) => (
              <button key={t.sym} onClick={() => setActiveChartSymbol(t.sym)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors cursor-pointer ${activeChartSymbol === t.sym ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
          {[["1m", "1"], ["5m", "5"], ["15m", "15"], ["1H", "60"], ["4H", "240"], ["1D", "D"], ["1W", "W"], ["1M", "M"]].map(([l, v]) => (
            <button key={v} onClick={() => setActiveTimeframe(v)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${activeTimeframe === v ? "bg-slate-800 text-blue-400 font-bold border border-blue-500/40" : "text-slate-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
          <button onClick={() => setIsChartFullscreen(!isChartFullscreen)} title="Toggle Fullscreen"
            className="ml-2 p-1 text-slate-400 hover:text-white border border-slate-800 rounded bg-[#0E1320] cursor-pointer">
            {isChartFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="w-full h-[520px] bg-[#0B0F19] relative">
        <div id="tradingview_markets_chart" ref={tvContainerRef} className="w-full h-full" />
      </div>
    </section>
  );
}