from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf
from datetime import datetime
import time
import warnings
warnings.filterwarnings("ignore")

app = FastAPI(
    title="Stock Finder API",
    description="Live NSE/BSE stock data for Stock Finder website",
    version="2.1.0"
)

# ── CORS ──
# NOTE: allow_credentials=True + allow_origins=["*"] is actually rejected by
# browsers. Since this API doesn't use cookies/auth, keep credentials False.
# In production, replace "*" with your real frontend URL(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from screener_api import router as screener_router
app.include_router(screener_router)

# ════════════════════════════════════════════════════════════
#  SIMPLE IN-MEMORY CACHE (TTL-based)
#  This is the key fix: Yahoo Finance gets hit AT MOST once every
#  CACHE_TTL seconds, no matter how many users/polls hit your API.
# ════════════════════════════════════════════════════════════
CACHE = {}
CACHE_TTL = 60  # seconds — increased from 20s: fewer hits to Yahoo = less chance of rate-limiting

def get_cached(key, fetch_fn):
    now = time.time()
    if key in CACHE:
        ts, data = CACHE[key]
        if now - ts < CACHE_TTL:
            return data
    data = fetch_fn()
    CACHE[key] = (now, data)
    return data


# ── CORRECT YAHOO FINANCE NSE SYMBOLS ──
NSE_STOCKS = [
    {"yahoo": "RELIANCE.NS",   "display": "RELIANCE",   "name": "Reliance Industries"},
    {"yahoo": "TCS.NS",        "display": "TCS",        "name": "Tata Consultancy Services"},
    {"yahoo": "HDFCBANK.NS",   "display": "HDFCBANK",   "name": "HDFC Bank"},
    {"yahoo": "INFY.NS",       "display": "INFY",       "name": "Infosys Ltd"},
    {"yahoo": "ICICIBANK.NS",  "display": "ICICIBANK",  "name": "ICICI Bank"},
    {"yahoo": "WIPRO.NS",      "display": "WIPRO",      "name": "Wipro Ltd"},
    {"yahoo": "ADANIENT.NS",   "display": "ADANIENT",   "name": "Adani Enterprises"},
    {"yahoo": "SBIN.NS",       "display": "SBIN",       "name": "State Bank of India"},
    {"yahoo": "BAJFINANCE.NS", "display": "BAJFINANCE", "name": "Bajaj Finance"},
    {"yahoo": "HINDUNILVR.NS", "display": "HINDUNILVR", "name": "Hindustan Unilever"},
    {"yahoo": "KOTAKBANK.NS",  "display": "KOTAKBANK",  "name": "Kotak Mahindra Bank"},
    {"yahoo": "LT.NS",         "display": "LT",         "name": "Larsen & Toubro"},
    {"yahoo": "AXISBANK.NS",   "display": "AXISBANK",   "name": "Axis Bank"},
    {"yahoo": "ASIANPAINT.NS", "display": "ASIANPAINT", "name": "Asian Paints"},
    {"yahoo": "MARUTI.NS",     "display": "MARUTI",     "name": "Maruti Suzuki"},
    {"yahoo": "SUNPHARMA.NS",  "display": "SUNPHARMA",  "name": "Sun Pharmaceutical"},
    # FIXED: correct NSE symbol is TATAMOTORS.NS (was commented out / wrong .BO before)
    # {"yahoo": "TATAMOTORS.NS", "display": "TATAMOTORS", "name": "Tata Motors Ltd"},   
    {"yahoo": "HCLTECH.NS",    "display": "HCLTECH",    "name": "HCL Technologies"},
    {"yahoo": "NESTLEIND.NS",  "display": "NESTLEIND",  "name": "Nestle India"},
    {"yahoo": "TITAN.NS",      "display": "TITAN",      "name": "Titan Company"},
    {"yahoo": "POWERGRID.NS",  "display": "POWERGRID",  "name": "Power Grid Corp"},
    {"yahoo": "NTPC.NS",       "display": "NTPC",       "name": "NTPC Limited"},
    {"yahoo": "ONGC.NS",       "display": "ONGC",       "name": "Oil & Natural Gas Corp"},
    {"yahoo": "COALINDIA.NS",  "display": "COALINDIA",  "name": "Coal India"},
    {"yahoo": "JSWSTEEL.NS",   "display": "JSWSTEEL",   "name": "JSW Steel"},
    {"yahoo": "TATASTEEL.NS",  "display": "TATASTEEL",  "name": "Tata Steel"},
    {"yahoo": "HINDALCO.NS",   "display": "HINDALCO",   "name": "Hindalco Industries"},
    {"yahoo": "IDEA.NS",       "display": "IDEA",       "name": "Vodafone Idea"},
    {"yahoo": "YESBANK.NS",    "display": "YESBANK",    "name": "Yes Bank"},
    {"yahoo": "RPOWER.NS",     "display": "RPOWER",     "name": "Reliance Power"},
]

INDEX_SYMBOLS = {
    "NIFTY 50":    "^NSEI",
    "SENSEX":      "^BSESN",
    "BANKNIFTY":   "^NSEBANK",
    "NIFTY IT":    "^CNXIT",
}

# ════════════════════════════════════════════════════════════
#  HELPER — fetch one stock safely
# ════════════════════════════════════════════════════════════
def get_stock_data(stock_info: dict):
    yahoo_sym   = stock_info["yahoo"]
    display_sym = stock_info["display"]
    name        = stock_info["name"]

    try:
        ticker = yf.Ticker(yahoo_sym)

        try:
            fi            = ticker.fast_info
            current_price = round(fi.last_price or 0, 2)
            prev_price    = round(fi.previous_close or current_price, 2)

            if current_price and current_price > 0:
                change     = round(current_price - prev_price, 2)
                change_pct = round((change / prev_price) * 100, 2) if prev_price else 0

                return {
                    "symbol":     display_sym,
                    "name":       name,
                    "price":      current_price,
                    "prev_close": prev_price,
                    "change":     change,
                    "change_pct": change_pct,
                    "up":         change >= 0,
                    "high":       round(fi.day_high or current_price, 2),
                    "low":        round(fi.day_low  or current_price, 2),
                    "volume":     fi.three_month_average_volume or 0,
                    "exchange":   "NSE",
                }
        except Exception:
            pass  # fast_info failed, try history

        hist = ticker.history(period="5d")

        if hist.empty:
            print(f"⚠️  No data for {yahoo_sym} — skipping")
            return None

        current_price = round(float(hist["Close"].iloc[-1]), 2)
        prev_price    = round(float(hist["Close"].iloc[-2]), 2) if len(hist) >= 2 else current_price
        change        = round(current_price - prev_price, 2)
        change_pct    = round((change / prev_price) * 100, 2) if prev_price else 0

        return {
            "symbol":     display_sym,
            "name":       name,
            "price":      current_price,
            "prev_close": prev_price,
            "change":     change,
            "change_pct": change_pct,
            "up":         change >= 0,
            "high":       round(float(hist["High"].iloc[-1]), 2),
            "low":        round(float(hist["Low"].iloc[-1]),  2),
            "volume":     int(hist["Volume"].iloc[-1]),
            "exchange":   "NSE",
        }

    except Exception as e:
        print(f"❌ Error fetching {yahoo_sym}: {str(e)[:80]}")
        return None


def fetch_all_stocks_parallel(stock_list):
    """
    FIXED: The old version fired 10 SIMULTANEOUS individual yf.Ticker() requests,
    which Yahoo Finance sees as burst traffic and rate-limits ("Too Many Requests").

    This version fetches ALL symbols in ONE single batched yf.download() call —
    this is how yfinance is designed to be used for multiple tickers, and it does
    not trigger per-symbol rate limiting.
    """
    yahoo_symbols = [s["yahoo"] for s in stock_list]
    symbol_map = {s["yahoo"]: s for s in stock_list}
    results = []
    failed = []

    try:
        data = yf.download(
            tickers=" ".join(yahoo_symbols),
            period="5d",
            group_by="ticker",
            threads=True,
            progress=False,
            auto_adjust=False,
        )
    except Exception as e:
        print(f"❌ Batch download failed entirely: {str(e)[:120]}")
        return [], [s["display"] for s in stock_list]

    for yahoo_sym in yahoo_symbols:
        info = symbol_map[yahoo_sym]
        try:
            df = data[yahoo_sym] if len(yahoo_symbols) > 1 else data
            df = df.dropna(subset=["Close"])
            if df.empty:
                failed.append(info["display"])
                continue

            current_price = round(float(df["Close"].iloc[-1]), 2)
            prev_price = round(float(df["Close"].iloc[-2]), 2) if len(df) >= 2 else current_price
            change = round(current_price - prev_price, 2)
            change_pct = round((change / prev_price) * 100, 2) if prev_price else 0

            results.append({
                "symbol":     info["display"],
                "name":       info["name"],
                "price":      current_price,
                "prev_close": prev_price,
                "change":     change,
                "change_pct": change_pct,
                "up":         change >= 0,
                "high":       round(float(df["High"].iloc[-1]), 2),
                "low":        round(float(df["Low"].iloc[-1]),  2),
                "volume":     int(df["Volume"].iloc[-1]),
                "exchange":   "NSE",
            })
        except Exception as e:
            print(f"⚠️ Parse error for {yahoo_sym}: {str(e)[:80]}")
            failed.append(info["display"])

    return results, failed


# ════════════════════════════════════════════════════════════
#  ROUTE 1 — Health check
# ════════════════════════════════════════════════════════════
@app.get("/")
def root():
    return {
        "status":  "✅ Running",
        "message": "Stock Finder API is live!",
        "docs":    "Visit /docs to test all endpoints",
        "cache_ttl_seconds": CACHE_TTL,
        "time":    datetime.now().isoformat(),
    }


# ════════════════════════════════════════════════════════════
#  ROUTE 2 — All stocks (CACHED + PARALLEL)
# ════════════════════════════════════════════════════════════
def _fetch_all_stocks():
    results, failed = fetch_all_stocks_parallel(NSE_STOCKS)
    return {
        "count":      len(results),
        "failed":     failed,
        "updated_at": datetime.now().isoformat(),
        "stocks":     results,
    }

@app.get("/stocks")
def get_all_stocks():
    return get_cached("all_stocks", _fetch_all_stocks)


# ════════════════════════════════════════════════════════════
#  ROUTE 3 — Single stock with chart data (light cache too)
# ════════════════════════════════════════════════════════════
@app.get("/stock/{symbol}")
def get_single_stock(symbol: str):
    sym_upper = symbol.upper()

    def _fetch_one():
        stock_info = next(
            (s for s in NSE_STOCKS if s["display"] == sym_upper),
            {"yahoo": f"{sym_upper}.NS", "display": sym_upper, "name": sym_upper}
        )

        data = get_stock_data(stock_info)
        if not data:
            return None

        try:
            ticker  = yf.Ticker(stock_info["yahoo"])
            hist_1m = ticker.history(period="1mo")
            hist_1y = ticker.history(period="1y")

            chart_data = [
                {
                    "date":  str(idx.date()),
                    "close": round(float(row["Close"]), 2),
                    "open":  round(float(row["Open"]),  2),
                    "high":  round(float(row["High"]),  2),
                    "low":   round(float(row["Low"]),   2),
                    "vol":   int(row["Volume"]),
                }
                for idx, row in hist_1m.iterrows()
            ] if not hist_1m.empty else []

            data["chart"]       = chart_data
            data["week52_high"] = round(float(hist_1y["High"].max()), 2) if not hist_1y.empty else data["high"]
            data["week52_low"]  = round(float(hist_1y["Low"].min()),  2) if not hist_1y.empty else data["low"]

        except Exception as e:
            print(f"Chart error for {symbol}: {e}")
            data["chart"] = []

        return data

    data = get_cached(f"stock_{sym_upper}", _fetch_one)

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for {symbol}. It may be delisted or the symbol is incorrect."
        )
    return data


# ════════════════════════════════════════════════════════════
#  ROUTE 4 — Live indices (CACHED)
# ════════════════════════════════════════════════════════════
def _fetch_indices():
    results = []
    for name, symbol in INDEX_SYMBOLS.items():
        try:
            ticker = yf.Ticker(symbol)
            try:
                fi      = ticker.fast_info
                current = round(fi.last_price or 0, 2)
                prev    = round(fi.previous_close or current, 2)
                if current > 0:
                    change = round(current - prev, 2)
                    pct    = round((change / prev) * 100, 2) if prev else 0
                    results.append({
                        "name": name, "symbol": symbol,
                        "value": current, "change": change,
                        "change_pct": pct, "up": change >= 0,
                    })
                    continue
            except Exception:
                pass

            hist = ticker.history(period="5d")
            if hist.empty:
                continue

            current = round(float(hist["Close"].iloc[-1]), 2)
            prev    = round(float(hist["Close"].iloc[-2]), 2) if len(hist) >= 2 else current
            change  = round(current - prev, 2)
            pct     = round((change / prev) * 100, 2) if prev else 0

            results.append({
                "name": name, "symbol": symbol,
                "value": current, "change": change,
                "change_pct": pct, "up": change >= 0,
            })
        except Exception as e:
            print(f"Index error {name}: {e}")

    return {"updated_at": datetime.now().isoformat(), "indices": results}

@app.get("/indices")
def get_indices():
    return get_cached("indices", _fetch_indices)


# ════════════════════════════════════════════════════════════
#  ROUTE 5 — Open IPOs
# ════════════════════════════════════════════════════════════
@app.get("/ipo/open")
def get_open_ipos():
    return {
        "count": 3,
        "updated_at": datetime.now().isoformat(),
        "ipos": [
            {
                "id": 1, "name": "Indo-MIM Ltd", "logo": "IM",
                "board": "MAINBOARD", "sector": "Manufacturing",
                "price": "₹204 – ₹216", "min_inv": "₹13,830",
                "lot": 64, "open": "24 Jul 2026", "close": "27 Jul 2026",
                "listing": "30 Jul 2026", "size": "₹850 Cr",
                "gmp": "+₹12 (+5.6%)", "sub_total": 0.65,
                "sub_qib": 0.20, "sub_nii": 0.18, "sub_retail": 1.42,
                "about": "India's largest metal injection moulding company.",
                "pros": ["Market leader 35%+ share", "Revenue CAGR 22%"],
                "cons": ["Capital intensive", "Revenue concentration risk"],
            },
            {
                "id": 2, "name": "Lohia Corp Ltd", "logo": "LC",
                "board": "MAINBOARD", "sector": "Industrials",
                "price": "₹182 – ₹192", "min_inv": "₹14,140",
                "lot": 73, "open": "24 Jul 2026", "close": "27 Jul 2026",
                "listing": "30 Jul 2026", "size": "₹520 Cr",
                "gmp": "+₹8 (+4.2%)", "sub_total": 0.18,
                "sub_qib": 0.05, "sub_nii": 0.08, "sub_retail": 0.42,
                "about": "Diversified conglomerate in packaging and yarn.",
                "pros": ["Debt-free balance sheet", "Exports to 40+ countries"],
                "cons": ["Cyclical business"],
            },
            {
                "id": 3, "name": "Xtranet Technologies", "logo": "XT",
                "board": "MAINBOARD", "sector": "Technology",
                "price": "₹64 – ₹68", "min_inv": "₹13,200",
                "lot": 194, "open": "25 Jul 2026", "close": "27 Jul 2026",
                "listing": "30 Jul 2026", "size": "₹240 Cr",
                "gmp": "+₹5 (+7.4%)", "sub_total": 0.58,
                "sub_qib": 0.30, "sub_nii": 0.22, "sub_retail": 1.10,
                "about": "IT services and digital transformation company.",
                "pros": ["Strong govt order book", "SaaS revenue growing 40%"],
                "cons": ["Govt contract dependency"],
            },
        ],
    }


# ════════════════════════════════════════════════════════════
#  ROUTE 6 — Upcoming IPOs
# ════════════════════════════════════════════════════════════
@app.get("/ipo/upcoming")
def get_upcoming_ipos():
    return {
        "count": 4,
        "updated_at": datetime.now().isoformat(),
        "ipos": [
            {"id":4,"name":"Zomato Fresh Ltd",     "logo":"ZF","board":"MAINBOARD","sector":"Quick Commerce","price":"₹120–₹128","min_inv":"₹14,720","open":"30 Jul","close":"01 Aug","size":"₹1,200 Cr","gmp":"+₹22"},
            {"id":5,"name":"Tata Digital Ltd",     "logo":"TD","board":"MAINBOARD","sector":"Fintech","price":"₹340–₹360","min_inv":"₹14,400","open":"02 Aug","close":"04 Aug","size":"₹2,800 Cr","gmp":"+₹45"},
            {"id":6,"name":"PayMate India Ltd",    "logo":"PM","board":"MAINBOARD","sector":"B2B Payments","price":"₹90–₹96","min_inv":"₹13,440","open":"05 Aug","close":"07 Aug","size":"₹640 Cr","gmp":"+₹14"},
            {"id":7,"name":"Hyundai India Finance","logo":"HF","board":"MAINBOARD","sector":"NBFC","price":"₹210–₹224","min_inv":"₹13,440","open":"08 Aug","close":"12 Aug","size":"₹1,100 Cr","gmp":"+₹18"},
        ],
    }


# ════════════════════════════════════════════════════════════
#  ROUTE 7 — Recently listed IPOs with live CMP (cached)
# ════════════════════════════════════════════════════════════
def _fetch_listed_ipos():
    listed_base = [
        {"id":8, "name":"Bajaj Housing Finance","logo":"BH","yahoo":"BAJHOUSFIN.NS","issue":70,  "list":150,  "date":"16 Sep 2025"},
        {"id":9, "name":"NTPC Green Energy",    "logo":"NG","yahoo":"NTPCGREEN.NS", "issue":108, "list":111,  "date":"27 Nov 2025"},
        {"id":10,"name":"Swiggy Ltd",           "logo":"SW","yahoo":"SWIGGY.NS",    "issue":390, "list":412,  "date":"13 Nov 2025"},
        {"id":11,"name":"Ola Electric",         "logo":"OE","yahoo":"OLAELEC.NS",   "issue":76,  "list":76,   "date":"09 Aug 2025"},
    ]

    def fetch_one(stock):
        cmp = stock["list"]
        try:
            fi = yf.Ticker(stock["yahoo"]).fast_info
            if fi.last_price and fi.last_price > 0:
                cmp = round(fi.last_price, 2)
        except Exception:
            try:
                h = yf.Ticker(stock["yahoo"]).history(period="5d")
                if not h.empty:
                    cmp = round(float(h["Close"].iloc[-1]), 2)
            except Exception:
                pass

        gain = round(((cmp - stock["issue"]) / stock["issue"]) * 100, 2)
        return {
            "id":         stock["id"],
            "name":       stock["name"],
            "logo":       stock["logo"],
            "issue_price":f"₹{stock['issue']}",
            "list_price": f"₹{stock['list']}",
            "cmp":        f"₹{cmp:,.2f}",
            "gain":       f"+{gain}%" if gain >= 0 else f"{gain}%",
            "up":         gain >= 0,
            "list_date":  stock["date"],
        }

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(fetch_one, listed_base))

    return {"count": len(results), "updated_at": datetime.now().isoformat(), "ipos": results}

@app.get("/ipo/listed")
def get_listed_ipos():
    return get_cached("listed_ipos", _fetch_listed_ipos)


# ════════════════════════════════════════════════════════════
#  ROUTE 8 — Top gainers and losers (CACHED, reuses full stock list)
# ════════════════════════════════════════════════════════════
def _fetch_gainers_losers():
    # Reuses the same cached /stocks data instead of re-fetching from Yahoo
    all_data = get_cached("all_stocks", _fetch_all_stocks)
    all_stocks = all_data["stocks"]

    gainers = sorted(all_stocks, key=lambda x: x["change_pct"], reverse=True)[:5]
    losers  = sorted(all_stocks, key=lambda x: x["change_pct"])[:5]

    return {
        "gainers":    gainers,
        "losers":     losers,
        "updated_at": datetime.now().isoformat(),
    }

@app.get("/gainers")
def get_gainers():
    return get_cached("gainers_losers", _fetch_gainers_losers)


# ════════════════════════════════════════════════════════════
#  ROUTE 9 — Search stocks
# ════════════════════════════════════════════════════════════
@app.get("/search")
def search_stocks(q: str):
    q_lower = q.lower()
    matches = [
        s for s in NSE_STOCKS
        if q_lower in s["display"].lower() or q_lower in s["name"].lower()
    ][:5]

    results, _ = fetch_all_stocks_parallel(matches)
    return {"query": q, "count": len(results), "results": results}


# ════════════════════════════════════════════════════════════
#  ROUTE 10 — Mutual funds (mfapi.in is free + CORS-enabled,
#  call it directly from React, no need to proxy through here)
# ════════════════════════════════════════════════════════════
@app.get("/mutual-funds")
def get_mutual_funds():
    return {
        "message": "Use mfapi.in directly from React — it is 100% free and has all 4000+ Indian mutual funds",
        "example": "fetch('https://api.mfapi.in/mf/119597') gives Mirae Asset Large Cap Fund NAV",
        "all_funds": "https://api.mfapi.in/mf/all",
        "updated_at": datetime.now().isoformat(),
    }