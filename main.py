from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf
from datetime import datetime
import time
import threading
import requests
from urllib.parse import quote
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
import os
origins = [o.strip() for o in os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_methods=["*"], allow_headers=["*"])
# (old demat routes removed — simple practice accounts live in auth_api.py)

from auth_api import router as auth_router
app.include_router(auth_router)

from markets_api import router as markets_router
app.include_router(markets_router)

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
#  YAHOO DATA HELPERS  (fast, with time limits — never hangs)
#  1) Try Yahoo's chart web-address directly (small + quick)
#  2) If that fails, try yfinance (with a time limit)
#  If both fail, the last good prices are kept (see "SNAPSHOT" below)
# ════════════════════════════════════════════════════════════
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json",
}
LAST_ERROR = {"msg": ""}
_YF_POOL = ThreadPoolExecutor(max_workers=4)


def _num(x, default=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def _chart_raw(yahoo_sym, rng="5d", interval="1d"):
    url = "https://query1.finance.yahoo.com/v8/finance/chart/" + quote(yahoo_sym, safe="")
    r = requests.get(url, params={"range": rng, "interval": interval}, headers=UA, timeout=8)
    r.raise_for_status()
    res = r.json()["chart"]["result"][0]
    return res["meta"], res["timestamp"], res["indicators"]["quote"][0]


def _chart_quote(yahoo_sym):
    meta, _ts, q = _chart_raw(yahoo_sym, "5d", "1d")
    closes = q.get("close") or []
    idxs = [i for i, c in enumerate(closes) if c is not None]
    if not idxs:
        raise ValueError("no price data")
    last = idxs[-1]
    price = _num(meta.get("regularMarketPrice"), closes[last]) or closes[last]
    prev = closes[idxs[-2]] if len(idxs) >= 2 else _num(meta.get("chartPreviousClose"), price)
    high = (q.get("high") or [None] * (last + 1))[last]
    low = (q.get("low") or [None] * (last + 1))[last]
    vol = (q.get("volume") or [0] * (last + 1))[last]
    return {"price": price, "prev": prev or price,
            "high": _num(high, price) or price, "low": _num(low, price) or price,
            "volume": int(_num(vol, 0))}


def _yf_quote(yahoo_sym):
    def work():
        h = yf.Ticker(yahoo_sym).history(period="5d")
        h = h.dropna(subset=["Close"])
        if h.empty:
            raise ValueError("yfinance returned no rows")
        price = float(h["Close"].iloc[-1])
        prev = float(h["Close"].iloc[-2]) if len(h) >= 2 else price
        return {"price": price, "prev": prev, "high": float(h["High"].iloc[-1]),
                "low": float(h["Low"].iloc[-1]), "volume": int(h["Volume"].iloc[-1])}
    return _YF_POOL.submit(work).result(timeout=12)


def _quote(yahoo_sym):
    """Returns {price, prev, high, low, volume} or None. Never raises, never hangs."""
    try:
        return _chart_quote(yahoo_sym)
    except Exception as e:
        LAST_ERROR["msg"] = f"{yahoo_sym} chart: {type(e).__name__}: {str(e)[:140]}"
    try:
        return _yf_quote(yahoo_sym)
    except Exception as e:
        LAST_ERROR["msg"] = f"{yahoo_sym} yfinance: {type(e).__name__}: {str(e)[:140]}"
        return None


def _row(info, q):
    price = round(q["price"], 2)
    prev = round(q["prev"], 2)
    change = round(price - prev, 2)
    pct = round((change / prev) * 100, 2) if prev else 0
    return {
        "symbol": info["display"], "name": info["name"],
        "price": price, "prev_close": prev, "change": change, "change_pct": pct,
        "up": change >= 0, "high": round(q["high"], 2), "low": round(q["low"], 2),
        "volume": q["volume"], "exchange": "NSE",
    }


def get_stock_data(stock_info: dict):
    q = _quote(stock_info["yahoo"])
    return _row(stock_info, q) if q else None


def fetch_all_stocks_parallel(stock_list):
    """Fetch many stocks at once (6 at a time), each with a time limit."""
    if not stock_list:
        return [], []
    with ThreadPoolExecutor(max_workers=6) as ex:
        quotes = list(ex.map(lambda s: _quote(s["yahoo"]), stock_list))
    results, failed = [], []
    for info, q in zip(stock_list, quotes):
        if q:
            results.append(_row(info, q))
        else:
            failed.append(info["display"])
    return results, failed


def _chart_series(yahoo_sym, rng, interval="1d"):
    """List of daily candles (for the stock detail chart). Empty list on failure."""
    try:
        _m, ts, q = _chart_raw(yahoo_sym, rng, interval)
        out = []
        for i, t in enumerate(ts):
            c = q["close"][i]
            if c is None:
                continue
            out.append({
                "date": datetime.fromtimestamp(t).strftime("%Y-%m-%d"),
                "close": round(float(c), 2),
                "open": round(_num(q["open"][i], c), 2),
                "high": round(_num(q["high"][i], c), 2),
                "low": round(_num(q["low"][i], c), 2),
                "vol": int(_num(q["volume"][i], 0)),
            })
        return out
    except Exception as e:
        LAST_ERROR["msg"] = f"{yahoo_sym} series: {type(e).__name__}: {str(e)[:140]}"
        return []


# ════════════════════════════════════════════════════════════
#  SNAPSHOT — a background worker refreshes prices every 45 s.
#  Web requests just read the latest saved copy, so they are instant
#  and the site keeps showing the last good prices if Yahoo is slow.
# ════════════════════════════════════════════════════════════
SNAP = {"stocks": None, "indices": None}
SNAP_TS = {"stocks": 0, "indices": 0}
READY = threading.Event()


def _snap(key, empty):
    READY.wait(timeout=15)          # only matters in the first seconds after start
    d = SNAP.get(key)
    if d:
        return dict(d, age_seconds=int(time.time() - SNAP_TS[key]))
    return dict(empty, status="unavailable", error=LAST_ERROR["msg"])


def _refresh_loop():
    while True:
        try:
            s = _fetch_all_stocks()
            if s["count"] > 0:
                SNAP["stocks"] = s
                SNAP_TS["stocks"] = time.time()
        except Exception as e:
            LAST_ERROR["msg"] = f"stocks refresh: {type(e).__name__}: {str(e)[:140]}"
        try:
            i = _fetch_indices()
            if i["indices"]:
                SNAP["indices"] = i
                SNAP_TS["indices"] = time.time()
        except Exception as e:
            LAST_ERROR["msg"] = f"indices refresh: {type(e).__name__}: {str(e)[:140]}"
        READY.set()
        time.sleep(45)


@app.on_event("startup")
def _start_background():
    threading.Thread(target=_refresh_loop, daemon=True).start()


@app.get("/debug/yahoo")
def debug_yahoo():
    """Open this link in the browser to see WHY prices are missing."""
    out = {
        "yfinance_version": getattr(yf, "__version__", "?"),
        "last_error": LAST_ERROR["msg"],
        "have_stocks": bool(SNAP["stocks"]),
        "have_indices": bool(SNAP["indices"]),
    }
    try:
        out["chart_test_RELIANCE"] = _chart_quote("RELIANCE.NS")
    except Exception as e:
        out["chart_test_error"] = f"{type(e).__name__}: {str(e)[:300]}"
    return out




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
    return _snap("stocks", {"count": 0, "failed": [], "updated_at": datetime.now().isoformat(), "stocks": []})


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
            sym = stock_info["yahoo"]
            chart_data = _chart_series(sym, "1mo")
            hist_1y = _chart_series(sym, "1y")
            data["chart"]       = chart_data
            data["week52_high"] = max((c["high"] for c in hist_1y), default=data["high"])
            data["week52_low"]  = min((c["low"] for c in hist_1y), default=data["low"])
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
    names = list(INDEX_SYMBOLS.items())
    with ThreadPoolExecutor(max_workers=4) as ex:
        quotes = list(ex.map(lambda kv: _quote(kv[1]), names))
    results = []
    for (name, symbol), q in zip(names, quotes):
        if not q:
            continue
        current = round(q["price"], 2)
        prev = round(q["prev"], 2)
        change = round(current - prev, 2)
        pct = round((change / prev) * 100, 2) if prev else 0
        results.append({"name": name, "symbol": symbol, "value": current,
                        "change": change, "change_pct": pct, "up": change >= 0})
    return {"updated_at": datetime.now().isoformat(), "indices": results}

@app.get("/indices")
def get_indices():
    return _snap("indices", {"updated_at": datetime.now().isoformat(), "indices": []})


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
    all_data = _snap("stocks", {"stocks": []})
    all_stocks = all_data.get("stocks", [])

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