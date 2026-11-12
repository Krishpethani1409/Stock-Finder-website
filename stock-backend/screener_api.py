# ============================================================
#  screener_api.py  →  put it NEXT TO main.py (stock-backend/)
#  Live data for the Screener page (screener.in style).
#
#  Endpoints (all live from Yahoo Finance via yfinance):
#    GET /screener/{symbol}              full company page data
#    GET /screener/{symbol}/quote        light live price (polled)
#    GET /screener/{symbol}/chart?range= 1m|6m|1y|3y|5y|10y|max
#
#  Add to main.py (2 lines, after `app = FastAPI(...)` / CORS):
#       from screener_api import router as screener_router
#       app.include_router(screener_router)
# ============================================================
from fastapi import APIRouter, HTTPException
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import yfinance as yf
import math
import time

router = APIRouter()

# ── small TTL cache ─────────────────────────────────────────
_C = {}


def cached(key, ttl, fn):
    now = time.time()
    hit = _C.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]
    val = fn()
    if val is not None:
        _C[key] = (now, val)
    return val


def num(x, d=2):
    try:
        if x is None:
            return None
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            return None
        return round(v, d)
    except Exception:
        return None


def cr(x):
    """rupees → ₹ crores"""
    v = num(x, 4)
    return None if v is None else round(v / 1e7, 2)


# ── sector map for peers (your 29 stocks) ───────────────────
SECTORS = {
    "Energy": ["RELIANCE", "ONGC", "COALINDIA", "POWERGRID", "NTPC", "RPOWER"],
    "IT": ["TCS", "INFY", "WIPRO", "HCLTECH"],
    "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BAJFINANCE", "YESBANK"],
    "FMCG": ["HINDUNILVR", "NESTLEIND", "ASIANPAINT", "TITAN"],
    "Auto": ["MARUTI", "TATAMOTORS"],
    "Pharma": ["SUNPHARMA"],
    "Metals": ["JSWSTEEL", "TATASTEEL", "HINDALCO"],
    "Infra": ["LT"],
    "Telecom": ["IDEA"],
    "Conglomerate": ["ADANIENT"],
}


def sector_of(sym):
    for k, v in SECTORS.items():
        if sym in v:
            return k
    return None


def clean_symbol(s):
    return s.upper().strip().replace(".NS", "").replace(".BO", "")


# ── resolve a ticker that really has data (.NS first, then .BO) ──
def resolve(sym):
    def _go():
        for suffix in (".NS", ".BO"):
            try:
                t = yf.Ticker(sym + suffix)
                lp = t.fast_info.last_price
                if lp and lp > 0:
                    return sym + suffix
            except Exception:
                continue
        return None

    return cached("resolve_" + sym, 3600, _go)


# ── quote (price part) ──────────────────────────────────────
def get_quote(ysym):
    t = yf.Ticker(ysym)
    fi = t.fast_info
    price = num(fi.last_price)
    prev = num(fi.previous_close) or price
    if not price:
        return None
    change = round(price - prev, 2)
    return {
        "price": price,
        "prev_close": prev,
        "change": change,
        "change_pct": round(change / prev * 100, 2) if prev else 0,
        "day_high": num(fi.day_high),
        "day_low": num(fi.day_low),
        "year_high": num(fi.year_high),
        "year_low": num(fi.year_low),
        "market_cap": cr(fi.market_cap),
        "volume": int(fi.last_volume or 0),
        "updated_at": datetime.now().isoformat(),
    }


# ── statement helpers ───────────────────────────────────────
def _series(df, keys):
    if df is None or getattr(df, "empty", True):
        return None
    for k in keys:
        if k in df.index:
            s = df.loc[k]
            if getattr(s, "ndim", 1) > 1:
                s = s.iloc[0]
            return s
    return None


def _cols(df, maxcols):
    """newest → oldest columns, limited, then returned oldest → newest"""
    if df is None or getattr(df, "empty", True):
        return []
    cols = sorted(list(df.columns), reverse=True)[:maxcols]
    return list(reversed(cols))


def _label(c):
    try:
        return c.strftime("%b %Y")
    except Exception:
        return str(c)[:7]


def build_table(df, row_defs, maxcols=6, derive=None):
    cols = _cols(df, maxcols)
    if not cols:
        return {"cols": [], "rows": []}
    data = {}
    order = []
    for label, keys, scale in row_defs:
        s = _series(df, keys)
        if s is None:
            continue
        vals = []
        for c in cols:
            try:
                v = s[c]
            except Exception:
                v = None
            vals.append(cr(v) if scale == "cr" else num(v))
        if all(v is None for v in vals):
            continue
        data[label] = vals
        order.append(label)
    if derive:
        derive(data, order)
    rows = [{"label": k, "values": data[k]} for k in order if k in data]
    return {"cols": [_label(c) for c in cols], "rows": rows}


def derive_income(data, order):
    sales, op = data.get("Sales"), data.get("Operating Profit")
    if sales and op:
        data["Expenses"] = [None if (s is None or o is None) else round(s - o, 2) for s, o in zip(sales, op)]
        data["OPM %"] = [None if (s in (None, 0) or o is None) else round(o / s * 100, 1) for s, o in zip(sales, op)]
        # keep a screener-like order
        for k in ("Expenses", "OPM %"):
            if k not in order:
                order.append(k)
    np_, s_ = data.get("Net Profit"), data.get("Sales")
    if np_ and s_:
        data["Net Margin %"] = [None if (s in (None, 0) or n is None) else round(n / s * 100, 1) for s, n in zip(s_, np_)]
        order.append("Net Margin %")
    desired = ["Sales", "Expenses", "Operating Profit", "OPM %", "Interest", "Depreciation",
               "Profit before tax", "Tax", "Net Profit", "Net Margin %", "EPS in Rs"]
    order[:] = [k for k in desired if k in data] + [k for k in order if k not in desired]


INCOME_ROWS = [
    ("Sales", ["Total Revenue", "Operating Revenue"], "cr"),
    ("Operating Profit", ["Operating Income", "EBIT"], "cr"),
    ("Interest", ["Interest Expense", "Interest Expense Non Operating"], "cr"),
    ("Depreciation", ["Reconciled Depreciation", "Depreciation And Amortization In Income Statement"], "cr"),
    ("Profit before tax", ["Pretax Income"], "cr"),
    ("Tax", ["Tax Provision"], "cr"),
    ("Net Profit", ["Net Income", "Net Income Common Stockholders"], "cr"),
    ("EPS in Rs", ["Basic EPS", "Diluted EPS"], "raw"),
]

BALANCE_ROWS = [
    ("Equity Capital", ["Capital Stock", "Common Stock"], "cr"),
    ("Reserves", ["Retained Earnings"], "cr"),
    ("Total Equity", ["Stockholders Equity", "Common Stock Equity"], "cr"),
    ("Borrowings", ["Total Debt"], "cr"),
    ("Total Liabilities", ["Total Liabilities Net Minority Interest"], "cr"),
    ("Fixed Assets", ["Net PPE"], "cr"),
    ("Investments", ["Investments And Advances", "Long Term Equity Investment"], "cr"),
    ("Current Assets", ["Current Assets"], "cr"),
    ("Current Liabilities", ["Current Liabilities"], "cr"),
    ("Total Assets", ["Total Assets"], "cr"),
]

CASH_ROWS = [
    ("Cash from Operating Activity", ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"], "cr"),
    ("Cash from Investing Activity", ["Investing Cash Flow", "Cash Flow From Continuing Investing Activities"], "cr"),
    ("Cash from Financing Activity", ["Financing Cash Flow", "Cash Flow From Continuing Financing Activities"], "cr"),
    ("Net Cash Flow", ["Changes In Cash"], "cr"),
    ("Free Cash Flow", ["Free Cash Flow"], "cr"),
    ("Capital Expenditure", ["Capital Expenditure"], "cr"),
]


def yearly_ratios(income_df, balance_df, maxcols=5):
    """ROE, ROCE, Debt/Equity, Current ratio per fiscal year (computed)."""
    cols = _cols(income_df, maxcols)
    if not cols:
        return {"cols": [], "rows": []}
    ni = _series(income_df, ["Net Income", "Net Income Common Stockholders"])
    ebit = _series(income_df, ["EBIT", "Operating Income"])
    eq = _series(balance_df, ["Stockholders Equity", "Common Stock Equity"])
    ta = _series(balance_df, ["Total Assets"])
    cl = _series(balance_df, ["Current Liabilities"])
    ca = _series(balance_df, ["Current Assets"])
    debt = _series(balance_df, ["Total Debt"])

    def at(s, c):
        if s is None:
            return None
        try:
            return num(s[c], 4)
        except Exception:
            # match balance sheet column by same month/year
            try:
                for k in s.index:
                    if _label(k) == _label(c):
                        return num(s[k], 4)
            except Exception:
                pass
        return None

    roe, roce, de, cur = [], [], [], []
    for c in cols:
        n, e, E, A, L, CA, D = at(ni, c), at(ebit, c), at(eq, c), at(ta, c), at(cl, c), at(ca, c), at(debt, c)
        roe.append(round(n / E * 100, 1) if n is not None and E else None)
        roce.append(round(e / (A - L) * 100, 1) if e is not None and A and L is not None and (A - L) else None)
        de.append(round(D / E, 2) if D is not None and E else None)
        cur.append(round(CA / L, 2) if CA is not None and L else None)
    rows = [("ROE %", roe), ("ROCE %", roce), ("Debt to Equity", de), ("Current Ratio", cur)]
    rows = [{"label": k, "values": v} for k, v in rows if any(x is not None for x in v)]
    return {"cols": [_label(c) for c in cols], "rows": rows}


def cagr(first, last, years):
    try:
        if first and last and first > 0 and last > 0 and years > 0:
            return round(((last / first) ** (1 / years) - 1) * 100, 1)
    except Exception:
        pass
    return None


def shareholding(t, info):
    ins = num((info.get("heldPercentInsiders") or 0) * 100, 2) if info.get("heldPercentInsiders") is not None else None
    inst = num((info.get("heldPercentInstitutions") or 0) * 100, 2) if info.get("heldPercentInstitutions") is not None else None
    if ins is None and inst is None:
        try:
            mh = t.major_holders
            if mh is not None and not mh.empty and "Value" in mh.columns:
                if "insidersPercentHeld" in mh.index:
                    ins = num(float(mh.loc["insidersPercentHeld", "Value"]) * 100, 2)
                if "institutionsPercentHeld" in mh.index:
                    inst = num(float(mh.loc["institutionsPercentHeld", "Value"]) * 100, 2)
        except Exception:
            pass
    if ins is None and inst is None:
        return []
    ins = ins or 0
    inst = inst or 0
    public = round(max(0, 100 - ins - inst), 2)
    return [
        {"label": "Promoters / Insiders", "value": ins},
        {"label": "Institutions (FII + DII)", "value": inst},
        {"label": "Public & others", "value": public},
    ]


def peers_for(sym, sector):
    names = [s for s in SECTORS.get(sector, []) if s != sym][:5] if sector else []

    def one(p):
        def _go():
            ys = resolve(p)
            if not ys:
                return None
            t = yf.Ticker(ys)
            q = get_quote(ys)
            if not q:
                return None
            inf = {}
            try:
                inf = t.info or {}
            except Exception:
                pass
            return {
                "symbol": p,
                "name": inf.get("longName") or inf.get("shortName") or p,
                "price": q["price"], "change_pct": q["change_pct"],
                "pe": num(inf.get("trailingPE")),
                "market_cap": q["market_cap"],
                "div_yield": _div_yield(inf, q["price"]),
                "roe": num((inf.get("returnOnEquity") or 0) * 100, 1) if inf.get("returnOnEquity") is not None else None,
            }
        try:
            return cached("peer_" + p, 600, _go)
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=5) as ex:
        res = list(ex.map(one, names))
    return [r for r in res if r]


def _div_yield(info, price):
    rate = info.get("dividendRate") or info.get("trailingAnnualDividendRate")
    if rate and price:
        return round(rate / price * 100, 2)
    return None


def pros_cons(r, growth):
    pros, cons = [], []
    roe, roce, pe, pb = r.get("roe"), r.get("roce"), r.get("pe"), r.get("price_to_book")
    de, dy = r.get("debt_to_equity"), r.get("div_yield")
    if roe is not None:
        if roe >= 15: pros.append(f"Good return on equity of {roe}%.")
        elif roe < 8: cons.append(f"Low return on equity of {roe}%.")
    if roce is not None:
        if roce >= 15: pros.append(f"Healthy ROCE of {roce}%.")
        elif roce < 8: cons.append(f"Low ROCE of {roce}%.")
    if de is not None:
        if de <= 0.5: pros.append(f"Company has low debt (debt to equity {de}).")
        elif de >= 1.5: cons.append(f"High debt (debt to equity {de}).")
    if dy is not None and dy >= 1.5:
        pros.append(f"Pays a dividend yield of {dy}%.")
    elif dy is not None and dy == 0:
        cons.append("Does not pay a dividend.")
    if pe is not None:
        if pe > 50: cons.append(f"Stock is expensive at a P/E of {pe}.")
        elif 0 < pe < 15: pros.append(f"Stock looks reasonably priced at a P/E of {pe}.")
    if pb is not None and pb > 6:
        cons.append(f"Stock trades at {pb} times its book value.")
    sg, pg = growth.get("sales"), growth.get("profit")
    if sg is not None:
        if sg >= 10: pros.append(f"Sales growing at {sg}% a year (reported period).")
        elif sg < 0: cons.append(f"Sales shrinking at {abs(sg)}% a year (reported period).")
    if pg is not None:
        if pg >= 12: pros.append(f"Profit growing at {pg}% a year (reported period).")
        elif pg < 0: cons.append(f"Profit declining at {abs(pg)}% a year (reported period).")
    return pros, cons


# ── ROUTE: quote (cheap, polled every 30s) ──────────────────
@router.get("/screener/{symbol}/quote")
def screener_quote(symbol: str):
    sym = clean_symbol(symbol)
    ys = resolve(sym)
    if not ys:
        raise HTTPException(404, f"No data for {sym}")
    q = cached("quote_" + sym, 20, lambda: get_quote(ys))
    if not q:
        raise HTTPException(404, f"No price for {sym}")
    return q


# ── ROUTE: chart ────────────────────────────────────────────
RANGES = {
    "1m": ("1mo", "1d"), "6m": ("6mo", "1d"), "1y": ("1y", "1d"),
    "3y": ("3y", "1wk"), "5y": ("5y", "1wk"), "10y": ("10y", "1wk"), "max": ("max", "1mo"),
}


@router.get("/screener/{symbol}/chart")
def screener_chart(symbol: str, range: str = "1y"):
    sym = clean_symbol(symbol)
    if range not in RANGES:
        range = "1y"
    ys = resolve(sym)
    if not ys:
        raise HTTPException(404, f"No data for {sym}")
    period, interval = RANGES[range]

    def _go():
        h = yf.Ticker(ys).history(period=period, interval=interval)
        if h is None or h.empty:
            return None
        pts = [{"d": str(i.date()), "c": num(r["Close"]), "v": int(r["Volume"] or 0)} for i, r in h.iterrows()
               if num(r["Close"]) is not None]
        if len(pts) > 600:
            step = math.ceil(len(pts) / 600)
            pts = pts[::step] + ([pts[-1]] if pts[-1] is not pts[::step][-1] else [])
        return {"symbol": sym, "range": range, "points": pts}

    data = cached(f"chart_{sym}_{range}", 600, _go)
    if not data:
        raise HTTPException(404, f"No chart data for {sym}")
    return data


# ── ROUTE: full page data ───────────────────────────────────
@router.get("/screener/{symbol}")
def screener_page(symbol: str):
    sym = clean_symbol(symbol)
    ys = resolve(sym)
    if not ys:
        raise HTTPException(404, f"Could not find live data for '{sym}'. Check the NSE symbol.")

    def _build():
        t = yf.Ticker(ys)

        def safe(fn, default=None):
            try:
                v = fn()
                return default if v is None else v
            except Exception as e:
                print(f"[screener] {sym}: {str(e)[:80]}")
                return default

        with ThreadPoolExecutor(max_workers=6) as ex:
            f_info = ex.submit(safe, lambda: t.info, {})
            f_q = ex.submit(safe, lambda: t.quarterly_income_stmt)
            f_a = ex.submit(safe, lambda: t.income_stmt)
            f_b = ex.submit(safe, lambda: t.balance_sheet)
            f_c = ex.submit(safe, lambda: t.cashflow)
            f_quote = ex.submit(safe, lambda: get_quote(ys))
            info, qdf, adf, bdf, cdf, quote = (f.result() for f in (f_info, f_q, f_a, f_b, f_c, f_quote))

        info = info or {}
        if not quote:
            return None

        sector = sector_of(sym)
        yearly = build_table(adf, INCOME_ROWS, 5, derive_income)
        ratios_year = yearly_ratios(adf, bdf, 5)
        balance = build_table(bdf, BALANCE_ROWS, 5)

        # headline ratios
        pe = num(info.get("trailingPE"))
        roe = num(info["returnOnEquity"] * 100, 1) if info.get("returnOnEquity") is not None else None
        roce = None
        for row in ratios_year["rows"]:
            if row["label"] == "ROCE %":
                vals = [v for v in row["values"] if v is not None]
                roce = vals[-1] if vals else None
        de = None
        for row in ratios_year["rows"]:
            if row["label"] == "Debt to Equity":
                vals = [v for v in row["values"] if v is not None]
                de = vals[-1] if vals else None
        if de is None and info.get("debtToEquity") is not None:
            de = num(info["debtToEquity"] / 100)

        ratios = {
            "market_cap": quote.get("market_cap") or cr(info.get("marketCap")),
            "pe": pe,
            "book_value": num(info.get("bookValue")),
            "price_to_book": num(info.get("priceToBook")),
            "div_yield": _div_yield(info, quote["price"]),
            "roe": roe, "roce": roce, "debt_to_equity": de,
            "eps": num(info.get("trailingEps")),
            "profit_margin": num(info["profitMargins"] * 100, 1) if info.get("profitMargins") is not None else None,
            "beta": num(info.get("beta")),
        }

        # growth (over the years Yahoo reports)
        growth = {"sales": None, "profit": None, "years": 0}
        sales = next((r["values"] for r in yearly["rows"] if r["label"] == "Sales"), None)
        prof = next((r["values"] for r in yearly["rows"] if r["label"] == "Net Profit"), None)
        if sales:
            v = [x for x in sales if x is not None]
            growth["years"] = max(len(v) - 1, 0)
            if len(v) >= 2:
                growth["sales"] = cagr(v[0], v[-1], len(v) - 1)
        if prof:
            v = [x for x in prof if x is not None]
            if len(v) >= 2:
                growth["profit"] = cagr(v[0], v[-1], len(v) - 1)

        pros, cons = pros_cons(ratios, growth)

        return {
            "symbol": sym,
            "yahoo_symbol": ys,
            "name": info.get("longName") or info.get("shortName") or sym,
            "website": info.get("website"),
            "about": info.get("longBusinessSummary"),
            "sector": info.get("sector") or sector,
            "industry": info.get("industry"),
            "employees": info.get("fullTimeEmployees"),
            "quote": quote,
            "ratios": ratios,
            "growth": growth,
            "pros": pros, "cons": cons,
            "quarterly": build_table(qdf, INCOME_ROWS, 8, derive_income),
            "yearly": yearly,
            "balance": balance,
            "cashflow": build_table(cdf, CASH_ROWS, 5),
            "ratios_year": ratios_year,
            "shareholding": shareholding(t, info),
            "peers": peers_for(sym, sector),
            "updated_at": datetime.now().isoformat(),
        }

    data = cached("screener_" + sym, 300, _build)
    if not data:
        raise HTTPException(404, f"Yahoo Finance returned no data for {sym}. Try again in a minute.")
    return data


# ── ROUTE: batch live quotes for ANY symbols (used by Trade page watchlist) ──
def _quick_quote(sym):
    def _go():
        for suffix in (".NS", ".BO"):
            try:
                q = get_quote(sym + suffix)
                if q:
                    return {"symbol": sym, "price": q["price"], "change": q["change"],
                            "change_pct": q["change_pct"], "prev_close": q["prev_close"],
                            "day_high": q["day_high"], "day_low": q["day_low"]}
            except Exception:
                continue
        return None
    try:
        return cached("qq_" + sym, 30, _go)
    except Exception:
        return None


@router.get("/quotes")
def batch_quotes(symbols: str):
    syms = []
    for s in symbols.split(","):
        c = clean_symbol(s)
        if c and c not in syms:
            syms.append(c)
    syms = syms[:60]
    with ThreadPoolExecutor(max_workers=8) as ex:
        res = list(ex.map(_quick_quote, syms))
    return {"updated_at": datetime.now().isoformat(),
            "quotes": {r["symbol"]: r for r in res if r},
            "missing": [s for s, r in zip(syms, res) if not r]}