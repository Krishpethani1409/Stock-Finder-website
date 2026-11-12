// ============================================================
//  useOrderEngine.js  →  src/store/useOrderEngine.js
//  Runs in the background on EVERY page (mounted in Navbar):
//   - fills pending Limit / Stop-loss orders when price is hit
//   - auto square-off of intraday positions (3:20 PM IST)
//  Needs the backend:  GET /quotes?symbols=A,B,C
// ============================================================
import { useEffect } from "react";
import { loadPortfolio, processOrders } from "./portfolioStore.js";

const API = "http://localhost:8000";

export default function useOrderEngine() {
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const pf = loadPortfolio();
        const syms = new Set();
        pf.orders.filter((o) => o.status === "OPEN").forEach((o) => syms.add(o.sym));
        pf.positions.filter((p) => p.qty !== 0).forEach((p) => syms.add(p.sym));
        if (!syms.size) return;
        const r = await fetch(`${API}/quotes?symbols=${[...syms].join(",")}`, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) return;
        const j = await r.json();
        if (alive) processOrders(j.quotes || {});
      } catch { /* backend offline – try again next tick */ }
    };
    tick();
    const t = setInterval(tick, 15000);
    const onChange = () => tick();
    window.addEventListener("portfolio-updated", onChange);
    return () => { alive = false; clearInterval(t); window.removeEventListener("portfolio-updated", onChange); };
  }, []);
}