import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
 
const stockDatabase = {
  RELIANCE: {
    name: "Reliance Industries Ltd",
    sector: "Energy / Conglomerate",
    price: "2,847.30",
    change: "+34.20",
    changePct: "+1.22%",
    up: true,
    open: "2,815.00",
    high: "2,860.50",
    low: "2,809.10",
    volume: "8.2M",
    marketCap: "₹19.2L Cr",
    pe: "28.4",
    eps: "100.3",
    week52High: "3,024.00",
    week52Low: "2,220.30",
    dividend: "9.50",
    about:
      "Reliance Industries Limited is an Indian multinational conglomerate company. Its businesses include energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/reliance-industries-ltd",
      upstox: "https://upstox.com/stocks/reliance-industries-share-price/",
    },
  },
  TCS: {
    name: "Tata Consultancy Services Ltd",
    sector: "Information Technology",
    price: "3,921.15",
    change: "+33.80",
    changePct: "+0.87%",
    up: true,
    open: "3,890.00",
    high: "3,935.00",
    low: "3,882.00",
    volume: "3.1M",
    marketCap: "₹14.2L Cr",
    pe: "31.2",
    eps: "125.7",
    week52High: "4,255.00",
    week52Low: "3,311.00",
    dividend: "28.00",
    about:
      "Tata Consultancy Services is an Indian multinational information technology company. It is a subsidiary of the Tata Group and operates in 150 locations across 46 countries.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/tata-consultancy-services-ltd",
      upstox: "https://upstox.com/stocks/tcs-share-price/",
    },
  },
  INFY: {
    name: "Infosys Ltd",
    sector: "Information Technology",
    price: "1,456.80",
    change: "-6.30",
    changePct: "-0.43%",
    up: false,
    open: "1,465.00",
    high: "1,471.20",
    low: "1,450.00",
    volume: "5.4M",
    marketCap: "₹6.0L Cr",
    pe: "24.8",
    eps: "58.7",
    week52High: "1,903.00",
    week52Low: "1,351.00",
    dividend: "21.00",
    about:
      "Infosys Limited is an Indian multinational information technology company that offers business consulting, information technology and outsourcing services. It has offices in 46 countries.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/infosys-ltd",
      upstox: "https://upstox.com/stocks/infosys-share-price/",
    },
  },
  HDFC: {
    name: "HDFC Bank Ltd",
    sector: "Banking & Finance",
    price: "1,623.55",
    change: "+33.40",
    changePct: "+2.10%",
    up: true,
    open: "1,592.00",
    high: "1,631.00",
    low: "1,589.00",
    volume: "9.7M",
    marketCap: "₹12.3L Cr",
    pe: "18.6",
    eps: "87.3",
    week52High: "1,880.00",
    week52Low: "1,363.55",
    dividend: "19.50",
    about:
      "HDFC Bank Limited is an Indian banking and financial services company. It is India's largest private sector bank by assets. The bank was incorporated in 1994 as a subsidiary of HDFC.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/hdfc-bank-ltd",
      upstox: "https://upstox.com/stocks/hdfc-bank-share-price/",
    },
  },
  WIPRO: {
    name: "Wipro Ltd",
    sector: "Information Technology",
    price: "478.90",
    change: "-4.92",
    changePct: "-1.02%",
    up: false,
    open: "484.00",
    high: "486.50",
    low: "476.00",
    volume: "4.2M",
    marketCap: "₹2.5L Cr",
    pe: "20.1",
    eps: "23.8",
    week52High: "571.90",
    week52Low: "399.00",
    dividend: "5.00",
    about:
      "Wipro Limited is an Indian multinational corporation that provides information technology, consulting and business process services. Wipro is headquartered in Bengaluru, India.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/wipro-ltd",
      upstox: "https://upstox.com/stocks/wipro-share-price/",
    },
  },
  ADANIENT: {
    name: "Adani Enterprises Ltd",
    sector: "Conglomerate",
    price: "2,340.00",
    change: "+77.85",
    changePct: "+3.45%",
    up: true,
    open: "2,265.00",
    high: "2,358.00",
    low: "2,260.00",
    volume: "2.8M",
    marketCap: "₹2.7L Cr",
    pe: "89.2",
    eps: "26.2",
    week52High: "3,743.00",
    week52Low: "2,025.00",
    dividend: "1.30",
    about:
      "Adani Enterprises Limited is an Indian multinational conglomerate. It is the flagship company of the Adani Group. Its business verticals include integrated resources management, agro commodities, edible oil, power, and more.",
    brokerLinks: {
      zerodha: "https://zerodha.com/stock-screener/",
      groww: "https://groww.in/stocks/adani-enterprises-ltd",
      upstox: "https://upstox.com/stocks/adani-enterprises-share-price/",
    },
  },
};
 
function generateChartData(basePrice, up) {
  const base = parseFloat(basePrice.replace(/,/g, ""));
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, i) => {
    const trend = up ? 1 + i * 0.015 : 1 - i * 0.008;
    const noise = (Math.random() - 0.5) * base * 0.04;
    return {
      month,
      price: Math.round((base * trend + noise) * 100) / 100,
    };
  });
}
 
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={styles.tooltip}>
        <p style={styles.tooltipLabel}>{label}</p>
        <p style={styles.tooltipValue}>₹{payload[0].value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};
 
export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const stock = stockDatabase[symbol];
 
  if (!stock) {
    return (
      <div style={styles.root}>
        <div style={styles.notFound}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
          <h2 style={{ color: "#f1f5f9", marginBottom: "8px" }}>Stock not found</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            We don't have data for "{symbol}" yet.
          </p>
          <button style={styles.backBtn} onClick={() => navigate("/")}>
            ← Back to Homepage
          </button>
        </div>
      </div>
    );
  }
 
  const chartData = generateChartData(stock.price, stock.up);
  const chartColor = stock.up ? "#22c55e" : "#ef4444";
 
  return (
    <div style={styles.root}>
      {/* NAVBAR — shared component, same on every page */}
      <Navbar />
      <div style={styles.navInner}>
        <button style={styles.backLink} onClick={() => navigate("/")}>← Back to Home</button>
        <span style={styles.navSymbol}>Viewing: {symbol}</span>
      </div>
 
      <div style={styles.container}>
 
        {/* STOCK HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.symbolBig}>{symbol}</div>
            <h1 style={styles.companyName}>{stock.name}</h1>
            <span style={styles.sectorBadge}>{stock.sector}</span>
          </div>
          <div style={styles.priceBlock}>
            <div style={styles.priceBig}>₹{stock.price}</div>
            <div style={{
              ...styles.priceChange,
              color: stock.up ? "#22c55e" : "#ef4444",
              background: stock.up ? "#052e16" : "#1f0a0a",
            }}>
              {stock.up ? "▲" : "▼"} {stock.change} ({stock.changePct})
            </div>
          </div>
        </div>
 
        {/* QUICK STATS */}
        <div style={styles.statsGrid}>
          {[
            { label: "Open", value: `₹${stock.open}` },
            { label: "Day High", value: `₹${stock.high}` },
            { label: "Day Low", value: `₹${stock.low}` },
            { label: "Volume", value: stock.volume },
            { label: "Market Cap", value: stock.marketCap },
            { label: "P/E Ratio", value: stock.pe },
            { label: "EPS", value: `₹${stock.eps}` },
            { label: "Dividend", value: `₹${stock.dividend}` },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue}>{s.value}</div>
            </div>
          ))}
        </div>
 
        {/* PRICE CHART */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h2 style={styles.chartTitle}>Price History (12 Months)</h2>
            <div style={styles.chartRange}>
              <span style={styles.rangeWeek52}>
                52W Range: ₹{stock.week52Low} – ₹{stock.week52High}
              </span>
            </div>
          </div>
          <div style={{ height: "300px", marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#1e293b" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* ABOUT + INVEST ROW */}
        <div style={styles.bottomRow}>
 
          {/* ABOUT */}
          <div style={styles.aboutCard}>
            <h2 style={styles.cardTitle}>About {stock.name.split(" ")[0]}</h2>
            <p style={styles.aboutText}>{stock.about}</p>
            <div style={styles.divider} />
            <div style={styles.peRow}>
              <div style={styles.peItem}>
                <span style={styles.peLabel}>P/E Ratio</span>
                <span style={styles.peValue}>{stock.pe}</span>
              </div>
              <div style={styles.peItem}>
                <span style={styles.peLabel}>EPS</span>
                <span style={styles.peValue}>₹{stock.eps}</span>
              </div>
              <div style={styles.peItem}>
                <span style={styles.peLabel}>Annual Dividend</span>
                <span style={styles.peValue}>₹{stock.dividend}</span>
              </div>
            </div>
          </div>
 
          {/* INVEST */}
          <div style={styles.investCard}>
            <h2 style={styles.cardTitle}>Invest in {symbol}</h2>
            <p style={styles.investSub}>Open an account with any of these trusted brokers and buy this stock directly.</p>
 
            <a href={stock.brokerLinks.zerodha} target="_blank" rel="noreferrer" style={styles.brokerBtn}>
              <div style={styles.brokerLeft}>
                <div style={styles.brokerDot("#387ed1")} />
                <span style={styles.brokerName}>Zerodha</span>
              </div>
              <span style={styles.brokerTag}>India's #1 broker</span>
            </a>
 
            <a href={stock.brokerLinks.groww} target="_blank" rel="noreferrer" style={{ ...styles.brokerBtn, marginTop: "10px" }}>
              <div style={styles.brokerLeft}>
                <div style={styles.brokerDot("#00d09c")} />
                <span style={styles.brokerName}>Groww</span>
              </div>
              <span style={styles.brokerTag}>Best for beginners</span>
            </a>
 
            <a href={stock.brokerLinks.upstox} target="_blank" rel="noreferrer" style={{ ...styles.brokerBtn, marginTop: "10px" }}>
              <div style={styles.brokerLeft}>
                <div style={styles.brokerDot("#5c67f2")} />
                <span style={styles.brokerName}>Upstox</span>
              </div>
              <span style={styles.brokerTag}>Low brokerage fees</span>
            </a>
 
            <div style={styles.disclaimer}>
              ⚠️ Stock Finder does not provide financial advice. Always research before investing.
            </div>
          </div>
        </div>
      </div>
 
      {/* FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2025 Stock Finder · Educational purposes only · Not financial advice</p>
      </footer>
    </div>
  );
}
 
const styles = {
  root: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif" },
  notFound: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem" },
  nav: { backgroundColor: "#0f172a", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "10px 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b" },
  backLink: { background: "none", border: "none", color: "#60a5fa", fontSize: "14px", cursor: "pointer", fontWeight: 500 },
  navSymbol: { fontSize: "14px", fontWeight: 600, color: "#94a3b8", backgroundColor: "#1e293b", padding: "4px 12px", borderRadius: "6px" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" },
  symbolBig: { fontSize: "13px", fontWeight: 600, color: "#60a5fa", backgroundColor: "#1e3a5f", display: "inline-block", padding: "3px 12px", borderRadius: "6px", marginBottom: "8px" },
  companyName: { fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" },
  sectorBadge: { fontSize: "12px", color: "#94a3b8", backgroundColor: "#1e293b", padding: "3px 10px", borderRadius: "999px", border: "1px solid #334155" },
  priceBlock: { textAlign: "right" },
  priceBig: { fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" },
  priceChange: { display: "inline-block", fontSize: "14px", fontWeight: 500, padding: "5px 12px", borderRadius: "8px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1.5rem" },
  statCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "12px 14px" },
  statLabel: { fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" },
  statValue: { fontSize: "15px", fontWeight: 600, color: "#f1f5f9" },
  chartCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  chartTitle: { fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 },
  chartRange: {},
  rangeWeek52: { fontSize: "12px", color: "#64748b" },
  tooltip: { backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "8px 12px" },
  tooltipLabel: { fontSize: "12px", color: "#64748b", margin: "0 0 2px" },
  tooltipValue: { fontSize: "14px", fontWeight: 600, color: "#f1f5f9", margin: 0 },
  bottomRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" },
  aboutCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "1.5rem" },
  cardTitle: { fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: "0 0 1rem" },
  aboutText: { fontSize: "14px", color: "#94a3b8", lineHeight: 1.7, margin: 0 },
  divider: { height: "1px", backgroundColor: "#334155", margin: "1.25rem 0" },
  peRow: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  peItem: { display: "flex", flexDirection: "column", gap: "3px" },
  peLabel: { fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" },
  peValue: { fontSize: "15px", fontWeight: 600, color: "#f1f5f9" },
  investCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "1.5rem" },
  investSub: { fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.6 },
  brokerBtn: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#0f172a", border: "1px solid #334155",
    borderRadius: "10px", padding: "12px 16px",
    textDecoration: "none", transition: "border-color 0.15s",
    cursor: "pointer",
  },
  brokerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  brokerDot: (color) => ({ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }),
  brokerName: { fontSize: "14px", fontWeight: 500, color: "#f1f5f9" },
  brokerTag: { fontSize: "11px", color: "#64748b", backgroundColor: "#1e293b", padding: "2px 8px", borderRadius: "999px" },
  disclaimer: { fontSize: "11px", color: "#475569", marginTop: "1.25rem", lineHeight: 1.6, padding: "10px", backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b" },
  backBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
  footer: { borderTop: "1px solid #1e293b", padding: "1.5rem", textAlign: "center", marginTop: "3rem" },
  footerText: { fontSize: "12px", color: "#334155", margin: 0 },
};