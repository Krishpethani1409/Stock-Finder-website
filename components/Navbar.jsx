// ============================================================
//  Navbar.jsx  →  src/components/Navbar.jsx   (REPLACE old file)
//  Self-contained: pins font, size, spacing and width so it looks
//  IDENTICAL on every page (Home, Markets, Tradeone, Portfolio,
//  Screener, Calculator...). Live NIFTY/SENSEX chips included.
//  Also shows the LIVE ticker tape under the navbar on EVERY page.
//  Needs: ./Logo.jsx, ./NavbarLiveIndices.jsx, ./TickerTape.jsx
// ============================================================
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";
import NavbarLiveIndices from "./NavbarLiveIndices.jsx";
import TickerTape from "./TickerTape.jsx";
import useOrderEngine from "../store/useOrderEngine.js";

const LINKS = [
  { label: "Home",       to: "/" },
  { label: "Markets",    to: "/markets" },
  { label: "Tradeone",   to: "/tradeone" },
  { label: "Portfolio",  to: "/Portfolio" },
  { label: "Screener",   to: "/screener" },
  { label: "Calculator", to: "/calculator" },
];

// Everything text-related is set here, so no page can change it.
const FONT = {
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "20px",
  letterSpacing: "normal",
  textTransform: "none",
  textAlign: "left",
  whiteSpace: "nowrap",
};

export default function Navbar() {
  useOrderEngine(); // fills pending orders + auto square-off on every page
  const navigate = useNavigate();
  const path = useLocation().pathname.toLowerCase();

  const isActive = (to) =>
    to === "/" ? path === "/" : path === to.toLowerCase() || path.startsWith(to.toLowerCase() + "/");

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
    <nav className="sf-nav" style={s.nav}>
      <div style={s.inner}>
        <div style={s.logo} onClick={() => navigate("/")}>
          <Logo size={30} />
        </div>

        <div style={s.links}>
          {LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => navigate(l.to)}
              style={{ ...s.link, ...(isActive(l.to) ? s.active : null) }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div style={s.right}>
          <NavbarLiveIndices />
        </div>
      </div>
    </nav>
    <TickerTape />
    </header>
  );
}

const s = {
  nav: {
    ...FONT,
    width: "100%", height: 56, boxSizing: "border-box",
    background: "#0a0f1e", borderBottom: "1px solid #1e293b",
  },
  inner: {
    boxSizing: "border-box", width: "100%", maxWidth: 1400, height: 56,
    margin: "0 auto", padding: "0 24px",
    display: "flex", alignItems: "center", gap: 32,
  },
  logo: { cursor: "pointer", flexShrink: 0, width: 170 },
  links: { display: "flex", gap: 4, flex: 1, minWidth: 0, justifyContent: "flex-start" },
  link: {
    ...FONT,
    background: "none", border: "none", color: "#64748b",
    padding: "6px 14px", margin: 0, borderRadius: 6, cursor: "pointer",
    boxSizing: "border-box", height: 32,
  },
  active: { background: "#1e293b", color: "#f1f5f9" },
  right: { flexShrink: 0, width: 430, display: "flex", justifyContent: "flex-end" },
};