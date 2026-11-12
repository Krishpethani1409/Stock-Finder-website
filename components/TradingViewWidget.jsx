import React, { useEffect, useRef } from 'react';

// Shared script loader so we don't inject tv.js multiple times across the app
let tvScriptLoadingPromise;
function loadTVScript() {
  if (!tvScriptLoadingPromise) {
    tvScriptLoadingPromise = new Promise((resolve) => {
      if (window.TradingView) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'tradingview-widget-loading-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  return tvScriptLoadingPromise;
}

/**
 * TradingViewWidget
 * Renders a REAL, LIVE candlestick chart for an NSE/BSE symbol using
 * TradingView's free public embeddable widget (no API key needed).
 *
 * IMPORTANT: pass a `key` prop from the parent (e.g. key={symbol+interval})
 * so React fully remounts this component on symbol/interval change —
 * the underlying tv.js widget doesn't support clean imperative updates.
 */
export default function TradingViewWidget({
  symbol = 'NSE:RELIANCE',
  interval = 'D',
  studies = ['MACD@tv-basicstudies', 'Volume@tv-basicstudies'],
  height = '100%',
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(`tv_widget_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;

    loadTVScript().then(() => {
      if (cancelled || !containerRef.current || !window.TradingView) return;

      // Clear any previous widget markup before mounting a fresh one
      containerRef.current.innerHTML = '';
      const innerDiv = document.createElement('div');
      innerDiv.id = widgetIdRef.current;
      innerDiv.style.height = '100%';
      innerDiv.style.width = '100%';
      containerRef.current.appendChild(innerDiv);

      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: 'Asia/Kolkata',
        theme: 'dark',
        style: '1', // candlestick style
        locale: 'en',
        toolbar_bg: '#131927',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        withdateranges: true,
        allow_symbol_change: false,
        studies,
        backgroundColor: '#0B0F19',
        gridColor: 'rgba(148, 163, 184, 0.08)',
        container_id: widgetIdRef.current,
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only runs once per mount — parent forces remount via `key`

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
}