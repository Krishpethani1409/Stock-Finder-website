import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { 
  Maximize2, Minimize2, Check, Plus, BookOpen, ExternalLink, 
  TrendingUp, ArrowUpRight, ArrowDownRight, ShieldAlert, Sparkles,
  Share2, ArrowRight
} from 'lucide-react';

export default function MarketsPage() {
  const navigate = useNavigate();

  // Active Symbol for Full-Width TradingView Chart
  const [activeChartSymbol, setActiveChartSymbol] = useState('NSE:NIFTY');
  const [activeTimeframe, setActiveTimeframe] = useState('D');
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // Active Tab States
  const [moversTab, setMoversTab] = useState('GAINERS');
  const [ipoTab, setIpoTab] = useState('CURRENT');

  // Watchlist Tracker
  const [watchlist, setWatchlist] = useState(['RELIANCE', 'TCS', 'HDFCBANK']);

  // TradingView Container Reference
  const tvContainerRef = useRef(null);

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  // -------------------------------------------------------------
  // TRADINGVIEW WIDGET INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (tvContainerRef.current) {
      tvContainerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
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
            studies: [
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies",
              "Volume@tv-basicstudies"
            ],
            overrides: {
              "paneProperties.background": "#0B0F19",
              "paneProperties.vertGridProperties.color": "#1E293B",
              "paneProperties.horzGridProperties.color": "#1E293B",
              "symbolWatermarkProperties.transparency": 90,
              "scalesProperties.textColor": "#94A3B8"
            }
          });
        }
      };
      tvContainerRef.current.appendChild(script);
    }
  }, [activeChartSymbol, activeTimeframe]);

  // -------------------------------------------------------------
  // DATA COLLECTIONS
  // -------------------------------------------------------------
  const liveTickerItems = [
    { name: 'NIFTY 50', price: '23,984.15', chg: '+124.50', pct: '+0.52%', up: true, tvSymbol: 'NSE:NIFTY' },
    { name: 'SENSEX', price: '78,718.40', chg: '+380.10', pct: '+0.49%', up: true, tvSymbol: 'BSE:SENSEX' },
    { name: 'BANKNIFTY', price: '51,240.80', chg: '+385.30', pct: '+0.76%', up: true, tvSymbol: 'NSE:BANKNIFTY' },
    { name: 'FINNIFTY', price: '22,840.10', chg: '+112.40', pct: '+0.49%', up: true, tvSymbol: 'NSE:FINNIFTY' },
    { name: 'MIDCAP', price: '56,120.90', chg: '+445.80', pct: '+0.80%', up: true, tvSymbol: 'NSE:CNXMIDCAP' },
    { name: 'SMALLCAP', price: '18,450.20', chg: '+210.40', pct: '+1.15%', up: true, tvSymbol: 'NSE:CNXSMALLCAP' },
    { name: 'USDINR', price: '83.74', chg: '-0.08', pct: '-0.10%', up: false, tvSymbol: 'FX_IDC:USDINR' },
    { name: 'GOLD (10g)', price: '72,840', chg: '+320.00', pct: '+0.44%', up: true, tvSymbol: 'MCX:GOLD1!' },
    { name: 'SILVER (1kg)', price: '86,450', chg: '-140.00', pct: '-0.16%', up: false, tvSymbol: 'MCX:SILVER1!' },
    { name: 'CRUDE OIL', price: '6,420', chg: '+45.00', pct: '+0.71%', up: true, tvSymbol: 'MCX:CRUDEOIL1!' },
    { name: 'BTC/USD', price: '66,840.00', chg: '+1,240.00', pct: '+1.89%', up: true, tvSymbol: 'BINANCE:BTCUSDT' },
    { name: 'ETH/USD', price: '3,480.20', chg: '+84.10', pct: '+2.48%', up: true, tvSymbol: 'BINANCE:ETHUSDT' },
  ];

  const marketIndicesTable = [
    { name: 'NIFTY 50', price: '23,984.15', chg: '+124.50', pct: '+0.52%', low: '23,810.40', high: '24,025.80', tvSymbol: 'NSE:NIFTY' },
    { name: 'SENSEX', price: '78,718.40', chg: '+380.10', pct: '+0.49%', low: '78,220.10', high: '78,950.30', tvSymbol: 'BSE:SENSEX' },
    { name: 'BANKNIFTY', price: '51,240.80', chg: '+385.30', pct: '+0.76%', low: '50,810.00', high: '51,420.50', tvSymbol: 'NSE:BANKNIFTY' },
    { name: 'FINNIFTY', price: '22,840.10', chg: '+112.40', pct: '+0.49%', low: '22,680.00', high: '22,910.00', tvSymbol: 'NSE:FINNIFTY' },
    { name: 'MIDCAP 100', price: '56,120.90', chg: '+445.80', pct: '+0.80%', low: '55,600.00', high: '56,350.00', tvSymbol: 'NSE:CNXMIDCAP' },
    { name: 'SMALLCAP 100', price: '18,450.20', chg: '+210.40', pct: '+1.15%', low: '18,200.00', high: '18,520.00', tvSymbol: 'NSE:CNXSMALLCAP' },
    { name: 'INDIA VIX', price: '13.42', chg: '-0.58', pct: '-4.14%', low: '13.10', high: '14.10', tvSymbol: 'NSE:INDIAVIX' },
  ];

  const globalMarketsTable = [
    { country: '🇺🇸 US', name: 'S&P 500', price: '5,584.60', chg: '+62.10', pct: '+1.12%', status: 'CLOSED' },
    { country: '🇺🇸 US', name: 'NASDAQ 100', price: '19,820.40', chg: '+284.50', pct: '+1.45%', status: 'CLOSED' },
    { country: '🇬🇧 UK', name: 'FTSE 100', price: '8,210.30', chg: '-18.40', pct: '-0.22%', status: 'CLOSED' },
    { country: '🇩🇪 DE', name: 'DAX', price: '18,340.80', chg: '+45.20', pct: '+0.25%', status: 'CLOSED' },
    { country: '🇯🇵 JP', name: 'NIKKEI 225', price: '38,820.00', chg: '-140.20', pct: '-0.36%', status: 'CLOSED' },
    { country: '🇭🇰 HK', name: 'HANG SENG', price: '17,540.20', chg: '+182.30', pct: '+1.05%', status: 'CLOSED' },
    { country: '🇸🇬 SG', name: 'GIFT NIFTY', price: '24,015.00', chg: '+22.00', pct: '+0.09%', status: 'LIVE' },
  ];

  const topGainersList = [
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', price: '2,340.00', chg: '+78.10', pct: '+3.45%', volume: '4.2M', mcap: '2,66,420 Cr', tvSymbol: 'NSE:ADANIENT' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: '1,623.55', chg: '+33.40', pct: '+2.10%', volume: '12.8M', mcap: '12,35,100 Cr', tvSymbol: 'NSE:HDFCBANK' },
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: '2,847.30', chg: '+34.80', pct: '+1.24%', volume: '8.5M', mcap: '19,26,400 Cr', tvSymbol: 'NSE:RELIANCE' },
    { symbol: 'SBIN', name: 'State Bank of India', price: '840.15', chg: '+9.55', pct: '+1.15%', volume: '11.4M', mcap: '7,49,800 Cr', tvSymbol: 'NSE:SBIN' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: '3,921.15', chg: '+33.80', pct: '+0.87%', volume: '2.1M', mcap: '14,18,200 Cr', tvSymbol: 'NSE:TCS' },
  ];

  const topLosersList = [
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: '942.10', chg: '-12.40', pct: '-1.30%', volume: '9.2M', mcap: '3,12,400 Cr', tvSymbol: 'NSE:TATAMOTORS' },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd', price: '1,280.40', chg: '-14.20', pct: '-1.10%', volume: '1.8M', mcap: '1,25,100 Cr', tvSymbol: 'NSE:TECHM' },
    { symbol: 'WIPRO', name: 'Wipro Limited', price: '478.90', chg: '-4.95', pct: '-1.02%', volume: '5.4M', mcap: '2,50,400 Cr', tvSymbol: 'NSE:WIPRO' },
    { symbol: 'INFY', name: 'Infosys Limited', price: '1,456.80', chg: '-6.30', pct: '-0.43%', volume: '6.1M', mcap: '6,05,200 Cr', tvSymbol: 'NSE:INFY' },
    { symbol: 'SUNPHARMA', name: 'Sun Pharma Ltd', price: '1,520.00', chg: '-6.80', pct: '-0.45%', volume: '3.1M', mcap: '3,64,800 Cr', tvSymbol: 'NSE:SUNPHARMA' },
  ];

  const mostActiveList = [
    { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', price: '57.03', chg: '+1.20', pct: '+2.15%', volume: '48.2M', mcap: '77,800 Cr', tvSymbol: 'NSE:SUZLON' },
    { symbol: 'YESBANK', name: 'Yes Bank Limited', price: '24.15', chg: '+0.45', pct: '+1.90%', volume: '54.0M', mcap: '75,600 Cr', tvSymbol: 'NSE:YESBANK' },
    { symbol: 'IRFC', name: 'Indian Railway Finance', price: '178.40', chg: '+3.10', pct: '+1.77%', volume: '32.1M', mcap: '2,33,100 Cr', tvSymbol: 'NSE:IRFC' },
    { symbol: 'PNB', name: 'Punjab National Bank', price: '118.20', chg: '-0.80', pct: '-0.67%', volume: '28.4M', mcap: '1,30,200 Cr', tvSymbol: 'NSE:PNB' },
    { symbol: 'TATASTEEL', name: 'Tata Steel Limited', price: '164.20', chg: '+2.10', pct: '+1.30%', volume: '22.8M', mcap: '2,05,400 Cr', tvSymbol: 'NSE:TATASTEEL' },
  ];

  const currentMoversData = moversTab === 'GAINERS' ? topGainersList : moversTab === 'LOSERS' ? topLosersList : mostActiveList;

  const sectorsTable = [
    { name: 'NIFTY BANK', pct: '+1.24%', isUp: true, topStock: 'HDFCBANK (+2.10%)' },
    { name: 'NIFTY AUTO', pct: '+0.92%', isUp: true, topStock: 'TATAMOTORS (-1.30%)' },
    { name: 'NIFTY METAL', pct: '+0.65%', isUp: true, topStock: 'TATASTEEL (+1.30%)' },
    { name: 'NIFTY OIL & GAS', pct: '+0.48%', isUp: true, topStock: 'RELIANCE (+1.24%)' },
    { name: 'NIFTY FMCG', pct: '+0.15%', isUp: true, topStock: 'ITC (+0.45%)' },
    { name: 'NIFTY PHARMA', pct: '-0.22%', isUp: false, topStock: 'SUNPHARMA (-0.45%)' },
    { name: 'NIFTY REALTY', pct: '-0.54%', isUp: false, topStock: 'DLF (-1.10%)' },
    { name: 'NIFTY IT', pct: '-0.88%', isUp: false, topStock: 'TCS (+0.87%)' },
  ];

  const ipoTableData = {
    CURRENT: [
      { name: 'INDO-MIM LTD', type: 'MAINBOARD', date: '27 Jul 2026', minLot: '₹13,830', sub: '0.65x' },
      { name: 'LOHIA CORP LTD', type: 'MAINBOARD', date: '27 Jul 2026', minLot: '₹14,140', sub: '0.18x' },
    ],
    UPCOMING: [
      { name: 'SWIGGY LIMITED', type: 'MAINBOARD', date: '12 Aug 2026', minLot: '₹14,500', sub: 'Pending' },
      { name: 'NTPC GREEN ENERGY', type: 'MAINBOARD', date: '18 Aug 2026', minLot: '₹14,200', sub: 'Pending' }
    ],
    RECENT: [
      { name: 'BAJAJ HOUSING FIN', type: 'MAINBOARD', date: '20 Jul 2026', minLot: '₹14,000', sub: '+114.2% Listing' },
    ]
  };

  const marketNewsData = [
    { headline: 'Reliance Industries Q1 Net Profit rises 5.8% YoY to ₹17,448 Cr; Jio ARPU at ₹182', source: 'StockFinder Terminal', time: '10m ago' },
    { headline: 'RBI Monetary Policy Committee maintains Repo Rate unchanged at 6.50%', source: 'Bloomberg', time: '35m ago' },
    { headline: 'Government cuts windfall tax on crude petroleum production to ₹4,600 per tonne', source: 'Reuters', time: '1h ago' },
    { headline: 'US Federal Reserve hints at potential rate cut in upcoming September meeting', source: 'CNBC', time: '2h ago' },
  ];

  const economicCalendarEvents = [
    { event: 'TCS Q1 Earnings Call & Margin Guidance', date: '31 Jul 2026, 16:00', impact: 'HIGH' },
    { event: 'India CPI Inflation Rate YoY', date: '12 Aug 2026, 17:30', impact: 'HIGH' },
    { event: 'US Non-Farm Payrolls & Unemployment', date: '07 Aug 2026, 18:00', impact: 'HIGH' },
    { event: 'RBI MPC Policy Minutes Release', date: '22 Aug 2026, 17:00', impact: 'MEDIUM' },
  ];

  // -------------------------------------------------------------
  // NEW SECTIONS DATA (EXTENSIONS)
  // -------------------------------------------------------------
  const trendingStocks12 = [
    { symbol: 'HAL', name: 'Hindustan Aeronautics', price: '4,820.50', pct: '+4.15%', logo: '🛩️', tvSymbol: 'NSE:HAL', spark: [30, 45, 60, 75, 90] },
    { symbol: 'BEL', name: 'Bharat Electronics', price: '312.40', pct: '+3.80%', logo: '🛡️', tvSymbol: 'NSE:BEL', spark: [40, 50, 65, 78, 88] },
    { symbol: 'CGPOWER', name: 'CG Power & Ind', price: '946.25', pct: '+3.45%', logo: '⚡', tvSymbol: 'NSE:CGPOWER', spark: [35, 48, 62, 70, 85] },
    { symbol: 'TRENT', name: 'Trent Limited', price: '5,420.00', pct: '+3.12%', logo: '🛍️', tvSymbol: 'NSE:TRENT', spark: [50, 58, 68, 74, 82] },
    { symbol: 'ZOMATO', name: 'Zomato Limited', price: '234.15', pct: '+2.85%', logo: '🍟', tvSymbol: 'NSE:ZOMATO', spark: [25, 40, 55, 70, 80] },
    { symbol: 'DIXON', name: 'Dixon Tech India', price: '12,450.00', pct: '+2.60%', logo: '📺', tvSymbol: 'NSE:DIXON', spark: [45, 52, 60, 72, 86] },
    { symbol: 'MAZDOCK', name: 'Mazagon Dock Ship', price: '4,320.00', pct: '+2.45%', logo: '⚓', tvSymbol: 'NSE:MAZDOCK', spark: [30, 42, 58, 68, 79] },
    { symbol: 'BHEL', name: 'Bharat Heavy Elec', price: '318.90', pct: '+2.10%', logo: '🏭', tvSymbol: 'NSE:BHEL', spark: [40, 48, 56, 68, 75] },
    { symbol: 'COALINDIA', name: 'Coal India Ltd', price: '488.30', pct: '+1.95%', logo: '⛏️', tvSymbol: 'NSE:COALINDIA', spark: [50, 54, 62, 70, 78] },
    { symbol: 'IOC', name: 'Indian Oil Corp', price: '174.50', pct: '+1.78%', logo: '⛽', tvSymbol: 'NSE:IOC', spark: [35, 45, 55, 62, 72] },
    { symbol: 'PFC', name: 'Power Fin Corp', price: '522.10', pct: '+1.62%', logo: '🏦', tvSymbol: 'NSE:PFC', spark: [42, 50, 60, 68, 74] },
    { symbol: 'RECLTD', name: 'REC Limited', price: '612.40', pct: '+1.45%', logo: '💡', tvSymbol: 'NSE:RECLTD', spark: [38, 46, 58, 64, 70] },
  ];

  const fiiDiiData = [
    { date: '31 Jul 2026', inst: 'FII / FPI', buy: '14,820.40', sell: '12,450.10', net: '+2,370.30', isNetPos: true },
    { date: '31 Jul 2026', inst: 'DII (Domestic)', buy: '9,450.80', sell: '8,120.20', net: '+1,330.60', isNetPos: true },
    { date: '30 Jul 2026', inst: 'FII / FPI', buy: '11,200.00', sell: '13,100.50', net: '-1,900.50', isNetPos: false },
    { date: '30 Jul 2026', inst: 'DII (Domestic)', buy: '10,800.20', sell: '8,400.00', net: '+2,400.20', isNetPos: true },
  ];

  const optionsChainSnapshot = [
    { index: 'NIFTY 50', pcr: '1.18', maxPain: '24,000', highestCallOI: '24,200 (1.2M)', highestPutOI: '23,800 (1.5M)', sentiment: 'BULLISH' },
    { index: 'BANKNIFTY', pcr: '0.94', maxPain: '51,000', highestCallOI: '51,500 (880K)', highestPutOI: '50,500 (920K)', sentiment: 'NEUTRAL' },
    { index: 'FINNIFTY', pcr: '1.05', maxPain: '22,800', highestCallOI: '23,000 (420K)', highestPutOI: '22,500 (510K)', sentiment: 'MILD BULLISH' },
  ];

  const volumeBreakouts = [
    { stock: 'COCHINSHIP', sector: 'Defense', vol: '14.2M', volChg: '+340%', price: '2,340.00', signal: 'BULLISH SURGE' },
    { stock: 'MCX', sector: 'Fintech', vol: '6.8M', volChg: '+210%', price: '3,890.50', signal: 'VOLUME BREAKOUT' },
    { symbol: 'HUDCO', sector: 'Realty / Infra', vol: '22.1M', volChg: '+185%', price: '284.10', signal: 'HIGH MOMENTUM' },
    { stock: 'RVNL', sector: 'Railways', vol: '38.4M', volChg: '+160%', price: '588.20', signal: 'ACCUMULATION' },
  ];

  const weekHighs = [
    { symbol: 'TRENT', price: '5,420.00', pct: '+3.12%', high: '5,450.00' },
    { symbol: 'BHARTIARTL', price: '1,480.20', pct: '+1.45%', high: '1,485.00' },
    { symbol: 'MAZDOCK', price: '4,320.00', pct: '+2.45%', high: '4,360.00' },
    { symbol: 'DIXON', price: '12,450.00', pct: '+2.60%', high: '12,500.00' },
    { symbol: 'CGPOWER', price: '946.25', pct: '+3.45%', high: '952.00' },
  ];

  const weekLows = [
    { symbol: 'ZEEL', price: '128.40', pct: '-2.15%', low: '126.00' },
    { symbol: 'INDUSINDBK', price: '1,380.00', pct: '-1.80%', low: '1,375.00' },
    { symbol: 'BANDHANBNK', price: '182.50', pct: '-1.40%', low: '180.20' },
    { symbol: 'PAYTM', price: '345.10', pct: '-0.95%', low: '340.00' },
    { symbol: 'JUBLFOOD', price: '462.00', pct: '-0.85%', low: '458.00' },
  ];

  const upcomingEarnings = [
    { company: 'State Bank of India (SBIN)', eps: '₹22.40', date: '02 Aug 2026', session: 'POST MARKET' },
    { company: 'Bharti Airtel (BHARTIARTL)', eps: '₹12.80', date: '05 Aug 2026', session: 'PRE MARKET' },
    { company: 'Larsen & Toubro (LT)', eps: '₹34.10', date: '08 Aug 2026', session: 'POST MARKET' },
    { company: 'Tata Motors (TATAMOTORS)', eps: '₹18.50', date: '10 Aug 2026', session: 'INTRADAY' },
  ];

  const dividendCalendar = [
    { company: 'TCS', div: '₹10.00 / share', exDate: '05 Aug 2026', recordDate: '06 Aug 2026' },
    { company: 'Infosys', div: '₹20.00 / share', exDate: '08 Aug 2026', recordDate: '09 Aug 2026' },
    { company: 'HDFC Bank', div: '₹19.50 / share', exDate: '12 Aug 2026', recordDate: '13 Aug 2026' },
  ];

  const bonusSplitCalendar = [
    { company: 'HPCL', type: 'BONUS 1:1', exDate: '14 Aug 2026', status: 'UPCOMING' },
    { company: 'IRFC', type: 'SPLIT 1:5', exDate: '20 Aug 2026', status: 'APPROVED' },
    { company: 'PERSISTENT', type: 'SPLIT 1:2', exDate: '28 Aug 2026', status: 'ANNOUNCED' },
  ];

  const mutualFundHighlights = [
    { name: 'Quant Active Fund Direct-Growth', ret3Y: '+32.4%', nav: '₹684.20', risk: 'VERY HIGH' },
    { name: 'Parag Parikh Flexi Cap Direct', ret3Y: '+24.8%', nav: '₹82.15', risk: 'VERY HIGH' },
    { name: 'Nippon India Small Cap Direct', ret3Y: '+38.2%', nav: '₹184.50', risk: 'VERY HIGH' },
    { name: 'ICICI Pru Equity & Debt Direct', ret3Y: '+21.5%', nav: '₹340.10', risk: 'MODERATE' },
  ];

  const etfMarket = [
    { symbol: 'NIPPON INDIA NIFTY BEES', price: '262.40', pct: '+0.52%', vol: '12.4M' },
    { symbol: 'SBI BANK ETF', price: '528.10', pct: '+0.76%', vol: '8.2M' },
    { symbol: 'ICICI PRU SILVER ETF', price: '84.20', pct: '-0.16%', vol: '5.1M' },
    { symbol: 'GOLDBEES', price: '64.80', pct: '+0.44%', vol: '9.8M' },
  ];

  const commodityMarket = [
    { symbol: 'GOLD 10g', price: '72,840', pct: '+0.44%', high: '73,100', low: '72,500' },
    { symbol: 'SILVER 1kg', price: '86,450', pct: '-0.16%', high: '87,200', low: '86,100' },
    { symbol: 'CRUDE OIL', price: '6,420', pct: '+0.71%', high: '6,480', low: '6,380' },
    { symbol: 'NATURAL GAS', price: '184.20', pct: '-1.45%', high: '188.00', low: '182.10' },
    { symbol: 'COPPER', price: '785.40', pct: '+0.88%', high: '790.00', low: '780.20' },
  ];

  const currencyMarket = [
    { pair: 'USD / INR', price: '83.74', pct: '-0.10%', high: '83.85', low: '83.68' },
    { pair: 'EUR / INR', price: '91.20', pct: '+0.22%', high: '91.45', low: '90.95' },
    { pair: 'GBP / INR', price: '107.80', pct: '+0.35%', high: '108.10', low: '107.40' },
    { pair: 'JPY / INR (100)', price: '54.20', pct: '-0.45%', high: '54.60', low: '54.10' },
  ];

  const cryptoMarket = [
    { coin: 'Bitcoin (BTC)', price: '$66,840.00', pct: '+1.89%', vol: '$28.4B' },
    { coin: 'Ethereum (ETH)', price: '$3,480.20', pct: '+2.48%', vol: '$14.2B' },
    { coin: 'Binance Coin (BNB)', price: '$584.10', pct: '+0.92%', vol: '$1.8B' },
    { coin: 'Solana (SOL)', price: '$184.50', pct: '+5.12%', vol: '$4.2B' },
  ];

  const recentlyViewed = [
    { symbol: 'RELIANCE', price: '2,847.30', pct: '+1.24%' },
    { symbol: 'TCS', price: '3,921.15', pct: '+0.87%' },
    { symbol: 'HDFCBANK', price: '1,623.55', pct: '+2.10%' },
    { symbol: 'INFY', price: '1,456.80', pct: '-0.43%' },
    { symbol: 'TATAMOTORS', price: '942.10', pct: '-1.30%' },
  ];

  const aiRecommendations = [
    { symbol: 'CGPOWER', reason: 'Bullish Momentum • Golden Cross Breakout', target: '₹1,020', risk: 'LOW' },
    { symbol: 'HAL', reason: 'Defense Sector Allocation • Institutional Inflows', target: '₹5,200', risk: 'MODERATE' },
    { symbol: 'COCHINSHIP', reason: 'High Volume Expansion • Orderbook Spike', target: '₹2,600', risk: 'MODERATE' },
  ];

  const learningArticles = [
    { title: 'Understanding Option Chain PCR & Max Pain for Day Trading', time: '5 min read', category: 'DERIVATIVES' },
    { title: 'How FII/DII Institutional Data Influences Opening Gaps', time: '7 min read', category: 'MACRO' },
    { title: 'Volume Spread Analysis (VSA): Spotting Smart Money Accumulation', time: '6 min read', category: 'TECHNICALS' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans pb-12 selection:bg-blue-600 selection:text-white">
      
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. REAL-TIME SCROLLING MARKET TICKER */}
      <div className="bg-[#0E1320] border-b border-slate-800/80 h-9 overflow-hidden flex items-center select-none text-xs font-mono">
        <div className="bg-[#131927] border-r border-slate-800 px-3 h-full flex items-center gap-1.5 font-bold text-[10px] text-emerald-400 shrink-0 uppercase tracking-wider z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MARKET TICKER</span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap px-4">
          {[...liveTickerItems, ...liveTickerItems].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveChartSymbol(item.tvSymbol)}
              className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors shrink-0"
            >
              <span className="font-semibold text-slate-300">{item.name}</span>
              <span className="font-bold text-white">₹{item.price}</span>
              <span className={`font-bold text-[11px] ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.up ? '▲' : '▼'} {item.pct}
              </span>
              <span className="text-slate-700 mx-1">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-[1600px] mx-auto px-2 sm:px-4 pt-3 space-y-4">
        
        {/* ================= EXISTING SECTION A: FULL-WIDTH TRADINGVIEW CHART ================= */}
        <section className={`bg-[#0B0F19] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl ${isChartFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
          <div className="bg-[#131927] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-black text-white text-sm tracking-tight">{activeChartSymbol}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                ● LIVE NSE/BSE
              </span>

              <div className="hidden lg:flex items-center gap-1 border-l border-slate-800 pl-3">
                {['NSE:NIFTY', 'BSE:SENSEX', 'NSE:BANKNIFTY', 'NSE:RELIANCE', 'NSE:HDFCBANK', 'NSE:TCS'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setActiveChartSymbol(sym)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors cursor-pointer ${
                      activeChartSymbol === sym ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {sym.replace('NSE:', '').replace('BSE:', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px]">
              {[
                { label: '1m', val: '1' },
                { label: '5m', val: '5' },
                { label: '15m', val: '15' },
                { label: '1H', val: '60' },
                { label: '4H', val: '240' },
                { label: '1D', val: 'D' },
                { label: '1W', val: 'W' },
                { label: '1M', val: 'M' },
              ].map((tf) => (
                <button
                  key={tf.val}
                  onClick={() => setActiveTimeframe(tf.val)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    activeTimeframe === tf.val ? 'bg-slate-800 text-blue-400 font-bold border border-blue-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}

              <button
                onClick={() => setIsChartFullscreen(!isChartFullscreen)}
                className="ml-2 p-1 text-slate-400 hover:text-white border border-slate-800 rounded bg-[#0E1320] cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isChartFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="w-full h-[520px] bg-[#0B0F19] relative">
            <div id="tradingview_markets_chart" ref={tvContainerRef} className="w-full h-full" />
          </div>
        </section>

        {/* ================= EXISTING SECTION B: COMPACT DATA MATRIX ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* COLUMN 1: INDICES & GLOBAL MARKETS */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs font-bold text-white">
                <span>BENCHMARK INDICES</span>
                <span className="text-[10px] font-mono text-slate-500">REALTIME</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                      <th className="pb-1.5">Index</th>
                      <th className="pb-1.5 text-right">Last</th>
                      <th className="pb-1.5 text-right">Chg (%)</th>
                      <th className="pb-1.5 text-right">High / Low</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {marketIndicesTable.map((idx) => (
                      <tr 
                        key={idx.name}
                        onClick={() => setActiveChartSymbol(idx.tvSymbol)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-1.5 font-bold text-blue-400">{idx.name}</td>
                        <td className="py-1.5 text-right font-bold text-white">₹{idx.price}</td>
                        <td className={`py-1.5 text-right font-bold ${idx.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {idx.pct}
                        </td>
                        <td className="py-1.5 text-right text-[10px] text-slate-500">{idx.high}/{idx.low}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs font-bold text-white">
                <span>GLOBAL MARKETS</span>
                <span className="text-[10px] font-mono text-slate-500">CORRELATIONS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                      <th className="pb-1.5">Index</th>
                      <th className="pb-1.5 text-right">Last</th>
                      <th className="pb-1.5 text-right">Chg (%)</th>
                      <th className="pb-1.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {globalMarketsTable.map((g) => (
                      <tr key={g.name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 font-bold text-slate-300">{g.country} {g.name}</td>
                        <td className="py-1.5 text-right font-bold text-white">₹{g.price}</td>
                        <td className={`py-1.5 text-right font-bold ${g.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {g.pct}
                        </td>
                        <td className="py-1.5 text-right text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded ${g.status === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMN 2: TOP MOVERS & HEATMAP */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-white">MARKET MOVERS</span>

                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {['GAINERS', 'LOSERS', 'ACTIVE'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setMoversTab(tab)}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        moversTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                      <th className="pb-1.5">Symbol</th>
                      <th className="pb-1.5 text-right">Price (₹)</th>
                      <th className="pb-1.5 text-right">Chg (%)</th>
                      <th className="pb-1.5 text-right">Volume</th>
                      <th className="pb-1.5 text-right">Watchlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {currentMoversData.map((st) => (
                      <tr key={st.symbol} className="hover:bg-slate-800/40 transition-colors">
                        <td 
                          onClick={() => setActiveChartSymbol(st.tvSymbol)}
                          className="py-1.5 font-bold text-blue-400 cursor-pointer"
                        >
                          {st.symbol}
                        </td>
                        <td className="py-1.5 text-right font-bold text-white">₹{st.price}</td>
                        <td className={`py-1.5 text-right font-bold ${st.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {st.pct}
                        </td>
                        <td className="py-1.5 text-right text-slate-400">{st.volume}</td>
                        <td className="py-1.5 text-right">
                          <button
                            onClick={() => toggleWatchlist(st.symbol)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            {watchlist.includes(st.symbol) ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : <Plus className="w-3.5 h-3.5 inline" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
                <span>SECTOR PERFORMANCE HEATMAP</span>
                <span className="text-[10px] font-mono text-slate-500">INTRADAY</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {sectorsTable.map((sec) => (
                  <div 
                    key={sec.name}
                    onClick={() => navigate('/screener')}
                    className={`p-2 rounded border cursor-pointer ${
                      sec.isUp ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-red-950/40 border-red-800/60 text-red-400'
                    }`}
                  >
                    <span className="font-bold block text-white text-[11px]">{sec.name}</span>
                    <span className="font-black text-xs block">{sec.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: IPO, NEWS & CALENDAR */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-white">PRIMARY MARKET IPOs</span>
                <div className="flex gap-1 font-mono text-[9px]">
                  {['CURRENT', 'UPCOMING'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setIpoTab(t)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${ipoTab === t ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {ipoTableData[ipoTab].map((ipo, i) => (
                  <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{ipo.name}</span>
                      <span className="text-[10px] text-slate-500">{ipo.type} • Closes {ipo.date}</span>
                    </div>
                    <span className="font-bold text-emerald-400 text-[11px]">{ipo.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
                <span>ECONOMIC CALENDAR</span>
                <span className="text-[10px] font-mono text-slate-500">EVENTS</span>
              </div>

              <div className="space-y-2 text-xs">
                {economicCalendarEvents.map((e, i) => (
                  <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{e.date}</span>
                      <span className="text-red-400 font-bold">{e.impact}</span>
                    </div>
                    <span className="font-semibold text-white block text-[11px] leading-tight">{e.event}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
                <span>MARKET BULLETINS</span>
                <span className="text-[10px] font-mono text-blue-400">NEWS</span>
              </div>

              <div className="space-y-2 text-xs">
                {marketNewsData.map((n, i) => (
                  <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono block">{n.source} • {n.time}</span>
                    <p className="font-semibold text-slate-200 text-[11px] leading-tight hover:text-blue-400 cursor-pointer">
                      {n.headline}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ======================= EXTENDED TERMINAL SECTIONS ====================== */}
        {/* ========================================================================= */}

        {/* SECTION 1: TRENDING STOCKS (12 CARDS GRID) */}
        <section className="bg-[#131927] border border-slate-800/80 rounded-xl p-3.5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>TRENDING &amp; BREAKOUT EQUITIES</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">12 ACTIVE INSTRUMENTS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {trendingStocks12.map((st) => (
              <div key={st.symbol} className="bg-[#0E1320] border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{st.logo}</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{st.pct}</span>
                  </div>
                  <span className="font-bold text-white text-xs block truncate">{st.symbol}</span>
                  <span className="text-[10px] text-slate-400 block truncate mb-1">{st.name}</span>
                  <span className="font-mono text-xs font-bold text-slate-200">₹{st.price}</span>
                </div>

                {/* Sparkline Visual */}
                <div className="h-4 w-full flex items-end gap-0.5 pt-1 mt-2 border-t border-slate-800/60">
                  {st.spark.map((val, i) => (
                    <div key={i} style={{ height: `${val}%` }} className="flex-1 bg-emerald-400/80 rounded-t-sm" />
                  ))}
                </div>

                <div className="flex items-center gap-1 mt-2 pt-1 border-t border-slate-800/60">
                  <button 
                    onClick={() => toggleWatchlist(st.symbol)}
                    className="flex-1 text-[10px] font-bold py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                  >
                    {watchlist.includes(st.symbol) ? 'Saved' : '+ Save'}
                  </button>
                  <button 
                    onClick={() => setActiveChartSymbol(st.tvSymbol)}
                    className="flex-1 text-[10px] font-bold py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded cursor-pointer transition-colors"
                  >
                    Chart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2 & 3: FII/DII FLOWS + OPTIONS CHAIN SNAPSHOT (2-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* SECTION 2: FII / DII ACTIVITY */}
          <div className="lg:col-span-6 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>FII / DII INSTITUTIONAL FLOWS (₹ CR)</span>
              <span className="text-[10px] font-mono text-slate-500">DAILY CASH</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                    <th className="pb-1.5">Date</th>
                    <th className="pb-1.5">Institution</th>
                    <th className="pb-1.5 text-right">Buy</th>
                    <th className="pb-1.5 text-right">Sell</th>
                    <th className="pb-1.5 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {fiiDiiData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 text-slate-400">{row.date}</td>
                      <td className="py-1.5 font-bold text-white">{row.inst}</td>
                      <td className="py-1.5 text-right text-slate-300">₹{row.buy}</td>
                      <td className="py-1.5 text-right text-slate-300">₹{row.sell}</td>
                      <td className={`py-1.5 text-right font-bold ${row.isNetPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: OPTIONS CHAIN SNAPSHOT */}
          <div className="lg:col-span-6 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>OPTIONS CHAIN OVERVIEW</span>
              <span className="text-[10px] font-mono text-slate-500">DERIVATIVES</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                    <th className="pb-1.5">Index</th>
                    <th className="pb-1.5 text-right">PCR</th>
                    <th className="pb-1.5 text-right">Max Pain</th>
                    <th className="pb-1.5 text-right">Call OI</th>
                    <th className="pb-1.5 text-right">Put OI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {optionsChainSnapshot.map((opt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 font-bold text-blue-400">{opt.index}</td>
                      <td className="py-1.5 text-right font-bold text-white">{opt.pcr}</td>
                      <td className="py-1.5 text-right text-slate-300">{opt.maxPain}</td>
                      <td className="py-1.5 text-right text-red-400">{opt.highestCallOI}</td>
                      <td className="py-1.5 text-right text-emerald-400">{opt.highestPutOI}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* SECTION 4, 5, 6: VOLUME BREAKOUTS + 52W HIGH/LOW (3-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* SECTION 4: TOP VOLUME BREAKOUTS */}
          <div className="lg:col-span-6 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>VOLUME SURGE &amp; BREAKOUTS</span>
              <span className="text-[10px] font-mono text-slate-500">UNUSUAL ACTIVITY</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                    <th className="pb-1.5">Stock</th>
                    <th className="pb-1.5">Sector</th>
                    <th className="pb-1.5 text-right">Volume</th>
                    <th className="pb-1.5 text-right">Vol Chg</th>
                    <th className="pb-1.5 text-right">CMP (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {volumeBreakouts.map((vb, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 font-bold text-white">{vb.stock || vb.symbol}</td>
                      <td className="py-1.5 text-slate-400 text-[10px]">{vb.sector}</td>
                      <td className="py-1.5 text-right text-slate-200">{vb.vol}</td>
                      <td className="py-1.5 text-right font-bold text-emerald-400">{vb.volChg}</td>
                      <td className="py-1.5 text-right font-bold text-white">₹{vb.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: 52 WEEK HIGH */}
          <div className="lg:col-span-3 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span className="text-emerald-400">52 WEEK HIGHS</span>
              <span className="text-[10px] font-mono text-slate-500">RECORD</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1 font-mono text-xs">
              {weekHighs.map((h, i) => (
                <div key={i} className="bg-[#0E1320] p-1.5 rounded border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{h.symbol}</span>
                    <span className="text-[10px] text-slate-500">High: ₹{h.high}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">₹{h.price}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{h.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: 52 WEEK LOW */}
          <div className="lg:col-span-3 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span className="text-red-400">52 WEEK LOWS</span>
              <span className="text-[10px] font-mono text-slate-500">LAGGARDS</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1 font-mono text-xs">
              {weekLows.map((l, i) => (
                <div key={i} className="bg-[#0E1320] p-1.5 rounded border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{l.symbol}</span>
                    <span className="text-[10px] text-slate-500">Low: ₹{l.low}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">₹{l.price}</span>
                    <span className="text-[10px] font-bold text-red-400">{l.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 7, 8, 9: EARNINGS, DIVIDENDS, BONUS/SPLIT (3-COLUMN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* SECTION 7: UPCOMING EARNINGS */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>UPCOMING EARNINGS</span>
              <span className="text-[10px] font-mono text-slate-500">Q1 RESULTS</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {upcomingEarnings.map((earn, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded">
                  <span className="font-bold text-white block truncate">{earn.company}</span>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                    <span>Est EPS: {earn.eps}</span>
                    <span className="text-blue-400">{earn.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 8: DIVIDEND CALENDAR */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>DIVIDEND CALENDAR</span>
              <span className="text-[10px] font-mono text-slate-500">PAYOUTS</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {dividendCalendar.map((div, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{div.company}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{div.div}</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <span>Ex: {div.exDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 9: BONUS & SPLIT CALENDAR */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>BONUS &amp; SPLIT ACTIONS</span>
              <span className="text-[10px] font-mono text-slate-500">CORPORATE</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {bonusSplitCalendar.map((bs, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{bs.company}</span>
                    <span className="text-[10px] text-blue-400 font-mono font-bold">{bs.type}</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <span>{bs.exDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 10 & 11: MUTUAL FUNDS & ETFS (2-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* SECTION 10: MUTUAL FUND HIGHLIGHTS */}
          <div className="lg:col-span-6 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>MUTUAL FUND HIGHLIGHTS</span>
              <span className="text-[10px] font-mono text-slate-500">TOP RETURNERS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                    <th className="pb-1.5">Fund Name</th>
                    <th className="pb-1.5 text-right">3Y Return</th>
                    <th className="pb-1.5 text-right">NAV (₹)</th>
                    <th className="pb-1.5 text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {mutualFundHighlights.map((mf, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 font-bold text-slate-200">{mf.name}</td>
                      <td className="py-1.5 text-right font-bold text-emerald-400">{mf.ret3Y}</td>
                      <td className="py-1.5 text-right text-slate-300">₹{mf.nav}</td>
                      <td className="py-1.5 text-right text-[9px]">
                        <span className="bg-red-950/60 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded">
                          {mf.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 11: ETF MARKET */}
          <div className="lg:col-span-6 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>MOST TRADED ETFs</span>
              <span className="text-[10px] font-mono text-slate-500">EXCHANGE TRADED</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/60 uppercase">
                    <th className="pb-1.5">ETF Instrument</th>
                    <th className="pb-1.5 text-right">Price (₹)</th>
                    <th className="pb-1.5 text-right">Chg (%)</th>
                    <th className="pb-1.5 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {etfMarket.map((etf, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 font-bold text-blue-400">{etf.symbol}</td>
                      <td className="py-1.5 text-right font-bold text-white">₹{etf.price}</td>
                      <td className={`py-1.5 text-right font-bold ${etf.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {etf.pct}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">{etf.vol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* SECTION 12, 13, 14: COMMODITIES, CURRENCY, CRYPTO (3-COLUMN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* SECTION 12: COMMODITY MARKET */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>COMMODITIES (MCX)</span>
              <span className="text-[10px] font-mono text-slate-500">FUTURES</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {commodityMarket.map((c, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{c.symbol}</span>
                    <span className="text-[10px] text-slate-500">{c.low} - {c.high}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">₹{c.price}</span>
                    <span className={`text-[10px] font-bold ${c.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{c.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 13: CURRENCY MARKET */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>CURRENCY FOREX</span>
              <span className="text-[10px] font-mono text-slate-500">PAIRS</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {currencyMarket.map((cur, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{cur.pair}</span>
                    <span className="text-[10px] text-slate-500">{cur.low} - {cur.high}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">₹{cur.price}</span>
                    <span className={`text-[10px] font-bold ${cur.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{cur.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 14: CRYPTO MARKET */}
          <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>CRYPTO ASSETS</span>
              <span className="text-[10px] font-mono text-slate-500">24H GLOBAL</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {cryptoMarket.map((cr, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{cr.coin}</span>
                    <span className="text-[10px] text-slate-500">Vol: {cr.vol}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">{cr.price}</span>
                    <span className={`text-[10px] font-bold ${cr.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{cr.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 15 & 16: RECENTLY VIEWED + RECOMMENDED (2-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* SECTION 15: RECENTLY VIEWED STOCKS */}
          <div className="lg:col-span-5 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span>RECENTLY VIEWED</span>
              <span className="text-[10px] font-mono text-slate-500">HISTORY</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {recentlyViewed.map((rv, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveChartSymbol(`NSE:${rv.symbol}`)}
                  className="bg-[#0E1320] border border-slate-800/80 rounded-lg p-2 shrink-0 w-28 cursor-pointer hover:border-blue-500/40 transition-colors"
                >
                  <span className="font-bold text-white text-xs block">{rv.symbol}</span>
                  <span className="font-mono text-xs block text-slate-300">₹{rv.price}</span>
                  <span className={`font-mono text-[10px] font-bold ${rv.pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {rv.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 16: RECOMMENDED FOR YOU */}
          <div className="lg:col-span-7 bg-[#131927] border border-slate-800/80 rounded-xl p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>RECOMMENDED FOR YOU</span>
              </span>
              <span className="text-[10px] font-mono text-blue-400">MOMENTUM SCANNER</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="bg-[#0E1320] border border-slate-800 p-2 rounded space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{rec.symbol}</span>
                    <span className="text-[9px] font-mono bg-blue-950 text-blue-400 px-1 rounded border border-blue-800">
                      Target: {rec.target}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 17: MARKET LEARNING & ARTICLES */}
        <section className="bg-[#131927] border border-slate-800/80 rounded-xl p-3.5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>MARKET KNOWLEDGE &amp; ACADEMY BULLETINS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">EDUCATIONAL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {learningArticles.map((art, i) => (
              <div key={i} className="bg-[#0E1320] border border-slate-800 p-3 rounded-lg flex flex-col justify-between hover:border-slate-700 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center justify-between text-[9px] font-mono mb-1.5">
                    <span className="text-purple-400 font-bold bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">{art.category}</span>
                    <span className="text-slate-500">{art.time}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-200 hover:text-blue-400 transition-colors leading-snug">
                    {art.title}
                  </h4>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 text-right">
                  <span className="text-[10px] font-bold text-blue-400 flex items-center justify-end gap-1">
                    Read Bulletin <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* SECTION 18: PROFESSIONAL TERMINAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="max-w-[1600px] mx-auto px-4 border-t border-slate-800/80 pt-8 mt-12 text-xs text-slate-400 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="space-y-2">
            <div className="font-black text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              STOCKFINDER
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Institutional-grade market intelligence, technical charting, and derivative order flow analysis.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase mb-2 font-mono">Markets</h5>
            <ul className="space-y-1 text-[11px] text-slate-400 font-mono">
              <li className="hover:text-white cursor-pointer">NSE Equity</li>
              <li className="hover:text-white cursor-pointer">F&amp;O Options Chain</li>
              <li className="hover:text-white cursor-pointer">MCX Commodities</li>
              <li className="hover:text-white cursor-pointer">Global Indices</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase mb-2 font-mono">Tools</h5>
            <ul className="space-y-1 text-[11px] text-slate-400 font-mono">
              <li className="hover:text-white cursor-pointer">Stock Screener</li>
              <li className="hover:text-white cursor-pointer">Trading Terminal</li>
              <li className="hover:text-white cursor-pointer">SIP Calculator</li>
              <li className="hover:text-white cursor-pointer">IPO Desk</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase mb-2 font-mono">Resources</h5>
            <ul className="space-y-1 text-[11px] text-slate-400 font-mono">
              <li className="hover:text-white cursor-pointer">Documentation</li>
              <li className="hover:text-white cursor-pointer">API Access</li>
              <li className="hover:text-white cursor-pointer">Market Bulletins</li>
              <li className="hover:text-white cursor-pointer">Economic Calendar</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase mb-2 font-mono">Legal</h5>
            <ul className="space-y-1 text-[11px] text-slate-400 font-mono">
              <li className="hover:text-white cursor-pointer">Terms of Service</li>
              <li className="hover:text-white cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer">SEBI Disclosure</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
          <p>© 2026 StockFinder Terminal. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right">
            Disclaimer: Market data displayed is for informational purposes only. Past performance is not indicative of future returns.
          </p>
        </div>
      </footer>

    </div>
  );
}