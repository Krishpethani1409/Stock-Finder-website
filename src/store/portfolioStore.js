// ============================================================
//  portfolioStore.js  →  src/store/portfolioStore.js   (v2 – trading engine)
//
//  Order types : MARKET, LIMIT, SL (stop-loss market)
//  Products    : DELIVERY (holdings)  |  INTRADAY (positions, 5x leverage,
//                can short-sell, auto square-off at 3:20 PM IST)
//  Charges     : brokerage, STT, exchange txn, SEBI, stamp duty, GST
//  Everything is stored in localStorage and shared by Markets,
//  Trade and Portfolio pages.
//
//  OLD FUNCTIONS STILL WORK (Markets / Trade pages need no change):
//     buyStock(sym, name, qty, price, sector)
//     sellStock(sym, qty, price)
// ============================================================

const KEY = "sf_portfolio";
export const START_CASH = 1000000;   // opening balance ₹10,00,000
export const LEVERAGE = 5;           // intraday margin = 20% of order value

const makeDefault = () => ({
  version: 2,
  openingBalance: START_CASH,
  cashBalance: START_CASH,
  realizedPL: 0,       // gross realised profit/loss on closed quantity
  chargesPaid: 0,      // all charges paid so far
  holdings: [],        // { sym, name, qty, avgPrice, sector }
  positions: [],       // { sym, name, qty(+long/-short), avgPrice, margin, day, realized, charges }
  orders: [],          // order book
  trades: [],          // executed trades
  ledger: [],          // funds ledger
});

export function loadPortfolio() {
  try {
    const raw = localStorage.getItem(KEY);
    const pf = raw ? { ...makeDefault(), ...JSON.parse(raw) } : makeDefault();
    delete pf.transactions; // legacy field
    return pf;
  } catch {
    return makeDefault();
  }
}

function save(pf) {
  localStorage.setItem(KEY, JSON.stringify(pf));
  window.dispatchEvent(new Event("portfolio-updated"));
}

/* ---------- helpers ---------- */
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const fail = (message) => ({ success: false, message });
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const uid = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

export const istNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
export const todayKey = () => dayKey();
const dayKey = () => { const d = istNow(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const stamp = () => istNow().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

export function marketStatus() {
  const d = istNow();
  const day = d.getDay();
  const mins = d.getHours() * 60 + d.getMinutes();
  const open = day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
  return { open, label: open ? "Market Open" : "Market Closed", time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) };
}

/* ---------- charges (Indian equity, per executed order) ---------- */
export function chargesFor(side, product, qty, price) {
  const turnover = qty * price;
  const delivery = product === "DELIVERY";
  const brokerage = r2(Math.min(20, turnover * (delivery ? 0.001 : 0.0003)));
  const stt = r2(delivery ? turnover * 0.001 : side === "SELL" ? turnover * 0.00025 : 0);
  const txn = r2(turnover * 0.0000297);
  const sebi = r2(turnover * 0.000001);
  const stamp = r2(side === "BUY" ? turnover * (delivery ? 0.00015 : 0.00003) : 0);
  const gst = r2((brokerage + txn + sebi) * 0.18);
  const total = r2(brokerage + stt + txn + sebi + stamp + gst);
  return { brokerage, stt, txn, sebi, stamp, gst, total };
}

/* margin needed to OPEN a new quantity */
export function marginFor(product, qty, price) {
  const v = qty * price;
  return product === "INTRADAY" ? r2(v / LEVERAGE) : r2(v);
}

/* ============================================================
   CORE FILL — mutates pf, returns {ok, message, trade}
   ============================================================ */
function fill(pf, order, price) {
  const { sym, name, side, product, qty } = order;
  const ch = chargesFor(side, product, qty, price);
  const value = r2(qty * price);
  const sgn = side === "BUY" ? 1 : -1;
  let pnl = 0;

  if (product === "DELIVERY") {
    const h = pf.holdings.find((x) => x.sym === sym);
    if (side === "BUY") {
      const need = value + ch.total;
      if (need > pf.cashBalance) return { ok: false, message: `Insufficient funds. Needs ${inr(need)} (incl. charges ${inr(ch.total)}) but available is ${inr(pf.cashBalance)}.` };
      pf.cashBalance = r2(pf.cashBalance - need);
      if (h) {
        const tq = h.qty + qty;
        h.avgPrice = r2((h.qty * h.avgPrice + value) / tq);
        h.qty = tq;
        h.name = name || h.name;
      } else {
        pf.holdings.push({ sym, name: name || sym, qty, avgPrice: r2(price), sector: order.sector || "Equity" });
      }
      // remember what was bought today, so Today's P&L ignores moves before the purchase
      const hh = pf.holdings.find((x) => x.sym === sym);
      if (hh.todayDay !== dayKey()) { hh.todayDay = dayKey(); hh.todayQty = 0; hh.todayCost = 0; }
      hh.todayQty += qty;
      hh.todayCost = r2(hh.todayCost + value);
    } else {
      if (!h || h.qty < qty) return { ok: false, message: `You hold ${h ? h.qty : 0} share(s) of ${sym}; cannot sell ${qty}.` };
      pnl = r2((price - h.avgPrice) * qty);
      pf.cashBalance = r2(pf.cashBalance + value - ch.total);
      pf.realizedPL = r2(pf.realizedPL + pnl);
      const oldQty = h.qty - (h.todayDay === dayKey() ? h.todayQty || 0 : 0);
      h.qty -= qty;
      if (h.todayDay === dayKey() && h.todayQty) {
        const fromToday = Math.min(h.todayQty, Math.max(0, qty - oldQty)); // oldest shares are sold first
        h.todayCost = r2(h.todayCost * (h.todayQty - fromToday) / h.todayQty);
        h.todayQty -= fromToday;
      }
      if (h.qty === 0) pf.holdings = pf.holdings.filter((x) => x.sym !== sym);
    }
  } else {
    // INTRADAY (signed positions, can short)
    let p = pf.positions.find((x) => x.sym === sym && x.day === dayKey());
    const cur = p ? p.qty : 0;
    const closing = cur * sgn < 0 ? Math.min(Math.abs(cur), qty) : 0;
    const opening = qty - closing;
    const released = closing ? r2(p.margin * (closing / Math.abs(cur))) : 0;
    const closePnl = closing ? r2((cur > 0 ? price - p.avgPrice : p.avgPrice - price) * closing) : 0;
    const marginNeed = marginFor("INTRADAY", opening, price);
    if (marginNeed + ch.total > pf.cashBalance + released + closePnl) {
      return { ok: false, message: `Insufficient margin. Needs ${inr(marginNeed + ch.total)} but available is ${inr(pf.cashBalance + released + closePnl)}.` };
    }
    if (!p) {
      p = { sym, name: name || sym, qty: 0, avgPrice: 0, margin: 0, day: dayKey(), realized: 0, charges: 0 };
      pf.positions.push(p);
    }
    if (closing) {
      pnl = closePnl;
      p.realized = r2(p.realized + closePnl);
      p.margin = r2(p.margin - released);
      pf.realizedPL = r2(pf.realizedPL + closePnl);
    }
    if (opening) {
      const same = (cur !== 0 && cur * sgn > 0);
      const baseQty = same ? Math.abs(cur) : 0;
      p.avgPrice = r2(((same ? baseQty * p.avgPrice : 0) + opening * price) / (baseQty + opening));
      p.margin = r2(p.margin + marginNeed);
    }
    p.qty = cur + sgn * qty;
    p.charges = r2((p.charges || 0) + ch.total);
    p.name = name || p.name;
    pf.cashBalance = r2(pf.cashBalance + released + closePnl - marginNeed - ch.total);
  }

  pf.chargesPaid = r2(pf.chargesPaid + ch.total);
  const trade = {
    id: uid(), orderId: order.id, sym, name: name || sym, side, product, qty,
    price: r2(price), value, charges: ch, pnl, date: stamp(), ts: Date.now(),
  };
  pf.trades.unshift(trade);
  pf.trades = pf.trades.slice(0, 500);
  pf.ledger.unshift({ id: uid(), ts: Date.now(), date: stamp(), type: side, note: `${side} ${qty} × ${sym} @ ${inr(price)}`, amount: side === "BUY" ? -(value + ch.total) : value - ch.total, balance: pf.cashBalance });
  pf.ledger = pf.ledger.slice(0, 300);
  return { ok: true, trade };
}

/* ============================================================
   PLACE ORDER
   o = { sym, name, side, type, product, qty, price, trigger, ltp, sector }
   ============================================================ */
export function placeOrder(o) {
  const side = String(o.side || "").toUpperCase();
  const type = String(o.type || "MARKET").toUpperCase();
  const product = String(o.product || "DELIVERY").toUpperCase();
  const qty = Number(o.qty);
  const ltp = Number(o.ltp);
  const limit = Number(o.price);
  const trigger = Number(o.trigger);
  const sym = String(o.sym || "").toUpperCase();

  if (!sym) return fail("Select a stock.");
  if (!["BUY", "SELL"].includes(side)) return fail("Choose Buy or Sell.");
  if (!["MARKET", "LIMIT", "SL"].includes(type)) return fail("Invalid order type.");
  if (!["DELIVERY", "INTRADAY"].includes(product)) return fail("Invalid product.");
  if (!Number.isInteger(qty) || qty < 1) return fail("Quantity must be a whole number (1 or more).");
  if (!Number.isFinite(ltp) || ltp <= 0) return fail(`Live price for ${sym} is not available right now. Make sure the backend is running.`);
  if (type === "LIMIT" && !(limit > 0)) return fail("Enter a valid limit price.");
  if (type === "SL") {
    if (!(trigger > 0)) return fail("Enter a valid trigger price.");
    if (side === "BUY" && trigger <= ltp) return fail(`Trigger price must be above the current price (${inr(ltp)}) for a Buy stop-loss.`);
    if (side === "SELL" && trigger >= ltp) return fail(`Trigger price must be below the current price (${inr(ltp)}) for a Sell stop-loss.`);
  }

  const pf = loadPortfolio();

  if (product === "DELIVERY" && side === "SELL") {
    const h = pf.holdings.find((x) => x.sym === sym);
    const pending = pf.orders.filter((x) => x.status === "OPEN" && x.sym === sym && x.side === "SELL" && x.product === "DELIVERY").reduce((a, x) => a + x.qty, 0);
    if (!h || h.qty - pending < qty) return fail(`You hold ${h ? h.qty : 0} share(s) of ${sym}${pending ? ` (${pending} already in open sell orders)` : ""}. Use Intraday to sell without holding.`);
  }

  const order = {
    id: uid(), sym, name: o.name || sym, sector: o.sector, side, type, product, qty,
    price: type === "LIMIT" ? r2(limit) : null,
    trigger: type === "SL" ? r2(trigger) : null,
    status: "OPEN", placedAt: stamp(), ts: Date.now(),
  };

  let fillPrice = null;
  if (type === "MARKET") fillPrice = ltp;
  else if (type === "LIMIT") {
    if ((side === "BUY" && limit >= ltp) || (side === "SELL" && limit <= ltp)) fillPrice = ltp;
  }

  if (fillPrice !== null) {
    const res = fill(pf, order, fillPrice);
    if (!res.ok) return fail(res.message);
    order.status = "COMPLETE";
    order.avgPrice = r2(fillPrice);
    order.filledAt = stamp();
    pf.orders.unshift(order);
    pf.orders = pf.orders.slice(0, 300);
    save(pf);
    return { success: true, message: `${side === "BUY" ? "Bought" : "Sold"} ${qty} × ${sym} @ ${inr(fillPrice)}`, order, trade: res.trade };
  }

  // pending
  pf.orders.unshift(order);
  save(pf);
  return { success: true, pending: true, message: `${type === "LIMIT" ? "Limit" : "Stop-loss"} order placed for ${qty} × ${sym}. It will execute when the price reaches ${inr(type === "LIMIT" ? limit : trigger)}.`, order };
}

export function cancelOrder(id) {
  const pf = loadPortfolio();
  const o = pf.orders.find((x) => x.id === id);
  if (!o || o.status !== "OPEN") return fail("Order cannot be cancelled.");
  o.status = "CANCELLED";
  o.reason = "Cancelled by user";
  save(pf);
  return { success: true, message: `Order for ${o.sym} cancelled.` };
}

/* square off one intraday position (or all if sym omitted) */
export function squareOff(sym, ltp) {
  const pf = loadPortfolio();
  const p = pf.positions.find((x) => x.sym === sym && x.qty !== 0 && x.day === dayKey());
  if (!p) return fail("No open position.");
  const price = Number(ltp);
  if (!(price > 0)) return fail("Live price not available.");
  const side = p.qty > 0 ? "SELL" : "BUY";
  const order = { id: uid(), sym, name: p.name, side, type: "MARKET", product: "INTRADAY", qty: Math.abs(p.qty), price: null, trigger: null, status: "OPEN", placedAt: stamp(), ts: Date.now() };
  const res = fill(pf, order, price);
  if (!res.ok) return fail(res.message);
  order.status = "COMPLETE"; order.avgPrice = r2(price); order.filledAt = stamp();
  pf.orders.unshift(order);
  save(pf);
  return { success: true, message: `Position in ${sym} squared off @ ${inr(price)}` };
}

/* ============================================================
   ENGINE — fill pending orders + auto square-off (called by hook)
   prices = { SYM: { price } }
   ============================================================ */
export function processOrders(prices) {
  const pf = loadPortfolio();
  let changed = false;

  pf.orders.filter((o) => o.status === "OPEN").forEach((o) => {
    const ltp = prices[o.sym]?.price;
    if (!(ltp > 0)) return;
    let hit = false;
    if (o.type === "LIMIT") hit = o.side === "BUY" ? ltp <= o.price : ltp >= o.price;
    if (o.type === "SL") hit = o.side === "BUY" ? ltp >= o.trigger : ltp <= o.trigger;
    if (!hit) return;
    const res = fill(pf, o, ltp);
    changed = true;
    if (res.ok) { o.status = "COMPLETE"; o.avgPrice = r2(ltp); o.filledAt = stamp(); }
    else { o.status = "REJECTED"; o.reason = res.message; }
  });

  // auto square-off: 3:20-3:30 PM IST on trading days, or positions left from an earlier day
  const d = istNow();
  const mn = d.getHours() * 60 + d.getMinutes();
  const late = d.getDay() >= 1 && d.getDay() <= 5 && mn >= 15 * 60 + 20 && mn < 15 * 60 + 30; // 3:20-3:30 PM on trading days
  pf.positions.filter((p) => p.qty !== 0).forEach((p) => {
    if (!(late || p.day !== dayKey())) return;
    const ltp = prices[p.sym]?.price;
    if (!(ltp > 0)) return;
    const side = p.qty > 0 ? "SELL" : "BUY";
    const order = { id: uid(), sym: p.sym, name: p.name, side, type: "MARKET", product: "INTRADAY", qty: Math.abs(p.qty), status: "OPEN", placedAt: stamp(), ts: Date.now(), reason: "Auto square-off" };
    // an old-day position is closed against its own record
    const prevDay = p.day;
    p.day = dayKey();
    const res = fill(pf, order, ltp);
    if (!res.ok) { p.day = prevDay; return; }
    order.status = "COMPLETE"; order.avgPrice = r2(ltp); order.filledAt = stamp();
    pf.orders.unshift(order);
    changed = true;
  });

  // keep only today's closed positions
  const before = pf.positions.length;
  pf.positions = pf.positions.filter((p) => p.qty !== 0 || p.day === dayKey());
  if (pf.positions.length !== before) changed = true;

  if (changed) save(pf);
  return changed;
}

/* ---------- funds ---------- */
export function addCash(amount) {
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter a valid amount.");
  const pf = loadPortfolio();
  pf.cashBalance = r2(pf.cashBalance + amount);
  pf.ledger.unshift({ id: uid(), ts: Date.now(), date: stamp(), type: "DEPOSIT", note: "Funds added", amount, balance: pf.cashBalance });
  save(pf);
  return { success: true, message: `Added ${inr(amount)} to your funds` };
}

export function withdrawCash(amount) {
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter a valid amount.");
  const pf = loadPortfolio();
  if (amount > pf.cashBalance) return fail(`You can withdraw up to ${inr(pf.cashBalance)}.`);
  pf.cashBalance = r2(pf.cashBalance - amount);
  pf.ledger.unshift({ id: uid(), ts: Date.now(), date: stamp(), type: "WITHDRAW", note: "Funds withdrawn", amount: -amount, balance: pf.cashBalance });
  save(pf);
  return { success: true, message: `Withdrew ${inr(amount)}` };
}

export function resetPortfolio() { save(makeDefault()); }

/* ---------- legacy API used by Markets / Trade pages ---------- */
export function buyStock(sym, name, qty, price, sector = "Equity") {
  const r = placeOrder({ sym, name, side: "BUY", type: "MARKET", product: "DELIVERY", qty, ltp: price, sector });
  return { success: r.success, message: r.message };
}
export function sellStock(sym, qty, price) {
  const r = placeOrder({ sym, side: "SELL", type: "MARKET", product: "DELIVERY", qty, ltp: price });
  return { success: r.success, message: r.message };
}