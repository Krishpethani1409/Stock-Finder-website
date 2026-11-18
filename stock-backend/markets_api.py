# markets_api.py  — extra routes for the Markets page
#   GET /market/index/{name}?range=1d|1w|1m|1y   -> chart points + open/high/low/close
#   GET /market/indices                          -> 6 indices incl. MIDCPNIFTY + INDIA VIX
import time
import yfinance as yf
from fastapi import APIRouter, HTTPException

router = APIRouter()

IDX = {
    "NIFTY":      ("NIFTY 50",   "^NSEI"),
    "SENSEX":     ("SENSEX",     "^BSESN"),
    "BANKNIFTY":  ("BANKNIFTY",  "^NSEBANK"),
    "FINNIFTY":   ("FINNIFTY",   "^CNXFIN"),
    "MIDCPNIFTY": ("MIDCPNIFTY", "^NSEMDCP50"),
    "INDIAVIX":   ("INDIA VIX",  "^INDIAVIX"),
}
RANGES = {"1d": ("5d", "5m"), "1w": ("5d", "15m"), "1m": ("1mo", "1d"), "1y": ("1y", "1d")}
_cache = {}

def cached(key, ttl, fn):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    val = fn()
    _cache[key] = (time.time(), val)
    return val

def _r(x):
    return round(float(x), 2)

@router.get("/market/indices")
def market_indices():
    def _go():
        out = []
        for key, (name, ysym) in IDX.items():
            try:
                h = yf.Ticker(ysym).history(period="5d")
                if h.empty:
                    continue
                cur = _r(h["Close"].iloc[-1])
                prev = _r(h["Close"].iloc[-2]) if len(h) > 1 else cur
                chg = _r(cur - prev)
                out.append({"key": key, "name": name, "value": cur, "change": chg,
                            "change_pct": _r(chg / prev * 100) if prev else 0})
            except Exception as e:
                print("market_indices skip", key, str(e)[:60])
        return {"indices": out}
    return cached("idx_all", 20, _go)

@router.get("/market/index/{key}")
def market_index(key: str, range: str = "1d"):
    key = key.upper().replace(" ", "")
    if key == "NIFTY50":
        key = "NIFTY"
    if key not in IDX:
        raise HTTPException(404, "unknown index")
    if range not in RANGES:
        range = "1d"
    period, interval = RANGES[range]

    def _go():
        ysym = IDX[key][1]
        h = yf.Ticker(ysym).history(period=period, interval=interval)
        if h.empty:
            return {"key": key, "range": range, "points": []}
        if range == "1d":                         # keep only the last trading day
            last = h.index[-1].date()
            h = h[[d.date() == last for d in h.index]]
        pts = [{"t": i.strftime("%d %b %H:%M") if interval != "1d" else i.strftime("%d %b %Y"),
                "v": _r(r["Close"])} for i, r in h.iterrows()]
        d = yf.Ticker(ysym).history(period="5d")
        prev = _r(d["Close"].iloc[-2]) if len(d) > 1 else _r(h["Close"].iloc[0])
        return {"key": key, "range": range, "points": pts,
                "open": _r(h["Open"].iloc[0]), "high": _r(h["High"].max()),
                "low": _r(h["Low"].min()), "close": _r(h["Close"].iloc[-1]),
                "prev_close": prev}
    return cached(f"idx_{key}_{range}", 60, _go)


# ───────────── Commodities + News (for the Markets tabs) ─────────────
#   GET /market/commodities   -> global futures + currency pairs (USD / INR)
#   GET /market/news          -> latest market headlines
COMMS = [
    ("GOLD", "Gold", "GC=F", "USD / oz"), ("SILVER", "Silver", "SI=F", "USD / oz"),
    ("CRUDE", "Crude Oil (WTI)", "CL=F", "USD / bbl"), ("BRENT", "Brent Crude", "BZ=F", "USD / bbl"),
    ("NATGAS", "Natural Gas", "NG=F", "USD / mmBtu"), ("COPPER", "Copper", "HG=F", "USD / lb"),
    ("USDINR", "USD / INR", "USDINR=X", "Currency"), ("EURINR", "EUR / INR", "EURINR=X", "Currency"),
    ("GBPINR", "GBP / INR", "GBPINR=X", "Currency"), ("JPYINR", "JPY / INR", "JPYINR=X", "Currency"),
]

@router.get("/market/commodities")
def market_commodities():
    def _go():
        out = []
        for key, name, ysym, unit in COMMS:
            try:
                h = yf.Ticker(ysym).history(period="5d")
                if h.empty:
                    continue
                cur = _r(h["Close"].iloc[-1])
                prev = _r(h["Close"].iloc[-2]) if len(h) > 1 else cur
                chg = _r(cur - prev)
                out.append({"key": key, "name": name, "unit": unit, "price": cur, "change": chg,
                            "change_pct": _r(chg / prev * 100) if prev else 0,
                            "high": _r(h["High"].iloc[-1]), "low": _r(h["Low"].iloc[-1])})
            except Exception as e:
                print("commodity skip", key, str(e)[:60])
        return {"items": out}
    return cached("commodities", 60, _go)

@router.get("/market/news")
def market_news():
    def _go():
        items, seen = [], set()
        for ysym in ("^NSEI", "^BSESN", "RELIANCE.NS", "HDFCBANK.NS"):
            try:
                for n in (yf.Ticker(ysym).news or []):
                    c = n.get("content") or n          # new + old yfinance formats
                    title = c.get("title")
                    if not title or title in seen:
                        continue
                    seen.add(title)
                    url = ((c.get("canonicalUrl") or {}).get("url")) or c.get("link") or ""
                    src = ((c.get("provider") or {}).get("displayName")) or c.get("publisher") or "Market News"
                    ts = c.get("pubDate") or c.get("providerPublishTime") or ""
                    items.append({"title": title, "source": src, "url": url, "time": str(ts)})
            except Exception as e:
                print("news skip", ysym, str(e)[:60])
        return {"items": items[:20]}
    return cached("news", 300, _go)