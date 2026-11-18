// ============================================================
//  NavbarLiveIndices.jsx  →  src/comxonents/NavbarLiveIndices.jsx
//  Live NIFTY + SENSEX chips from your backend (GET /indices).
//  Refreshes every 30s. Keeps last known value if API is down.
// ============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");
const GREEN = "#00b386", RED = "#e5314a";

function useIndices() {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_indices")) || {}; } catch { return {}; }
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API}/indices`, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        const list = j.indices || [];
        const up = (x) => String(x.name || "").toUpperCase();
        const nifty = list.find((x) => /^NIFTY( ?50)?$/.test(up(x))) ||
                      list.find((x) => up(x).includes("NIFTY") && !up(x).includes("BANK"));
        const sensex = list.find((x) => up(x).includes("SENSEX"));
        const next = { nifty, sensex };
        if (!alive || (!nifty && !sensex)) return;
        setData(next);
        try { localStorage.setItem("sf_indices", JSON.stringify(next)); } catch {}
      } catch (e) {
        console.warn("[Navbar] /indices failed:", e.message);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return data;
}

const FONT = { fontFamily: "'Inter', system-ui, sans-serif", lineHeight: "16px", letterSpacing: "normal" };
const f2 = (v) => Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Chip({ label, idx, tv, title }) {
  const navigate = useNavigate();
  const has = !!idx;
  const up = has ? idx.change >= 0 : true;
  const color = has ? (up ? GREEN : RED) : "#787b86";
  const sgn = up ? "+" : "-";
  return (
    <div
      role="button"
      onClick={() => navigate("/tradeone", { state: { tv, label: title } })}
      style={{ ...FONT, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, whiteSpace: "nowrap" }}
      title="Open chart"
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <b style={{ fontSize: 14, color }}>{has ? f2(idx.value) : "--"}</b>
        {has && <span style={{ fontSize: 10, color }}>{up ? "▲" : "▼"}</span>}
        {has && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {sgn}{f2(idx.change)} ({sgn}{f2(idx.change_pct)}%)
          </span>
        )}
      </span>
    </div>
  );
}

export default function NavbarLiveIndices() {
  const { nifty, sensex } = useIndices();
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
         <Chip label="NIFTY" idx={nifty} tv="BSE:NIFTYBEES" title="NIFTY 50" />
      <div style={{ width: 1, height: 30, background: "#2a2e3d" }} />
      <Chip label="SENSEX" idx={sensex} tv="BSE:SENSEX" title="SENSEX" />
    </div>
  );
}