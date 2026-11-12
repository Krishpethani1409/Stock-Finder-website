import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
 
const benefits = [
  { icon: "⚡", title: "Open in 10 Minutes",   desc: "100% digital with PAN & Aadhaar — no paperwork, no branch visits." },
  { icon: "💸", title: "Zero Account Charges", desc: "Free account opening and zero annual maintenance charges." },
  { icon: "🔒", title: "Bank-Grade Security",  desc: "Your holdings stay safe with SEBI-regulated depositories (NSDL/CDSL)." },
  { icon: "📈", title: "Invest in Everything", desc: "Stocks, Mutual Funds, ETFs, IPOs & Bonds — all from one account." },
];
 
const steps = [
  { num: "1", title: "Enter your details",   desc: "Share your name, mobile number, and PAN to get started." },
  { num: "2", title: "Complete e-KYC",       desc: "Verify instantly using Aadhaar OTP — no physical signature needed." },
  { num: "3", title: "E-sign the agreement", desc: "Digitally sign your account opening form in a few taps." },
  { num: "4", title: "Start investing",      desc: "Your demat & trading account is ready — start investing today." },
];
 
export default function OpenDemat() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", mobile: "", pan: "" });
  const [submitted, setSubmitted] = useState(false);
 
  const handleChange = (field, value) => setForm({ ...form, [field]: value });
 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.pan) return;
    setSubmitted(true);
  };
 
  return (
    <div style={s.root}>
      <Navbar />
 
      <div style={s.container}>
 
        {/* HERO ROW */}
        <div style={s.heroRow}>
          <div style={s.heroLeft}>
            <span style={s.badge}>🇮🇳 SEBI Registered · 100% Digital</span>
            <h1 style={s.heroTitle}>Open a Free Demat Account in Minutes</h1>
            <p style={s.heroSub}>
              Join thousands of investors using Stock Finder to start their investing
              journey — zero paperwork, zero account charges, fully online.
            </p>
            <div style={s.trustRow}>
              <div><span style={s.trustVal}>10Mn+</span><span style={s.trustLbl}>Investors</span></div>
              <div><span style={s.trustVal}>₹0</span><span style={s.trustLbl}>Account Opening</span></div>
              <div><span style={s.trustVal}>10 min</span><span style={s.trustLbl}>Setup Time</span></div>
            </div>
          </div>
 
          {/* SIGNUP FORM CARD */}
          <div style={s.formCard}>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <h2 style={s.formTitle}>Get Started — It's Free</h2>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.input}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
                <label style={s.label}>Mobile Number</label>
                <input
                  style={s.input}
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  maxLength={10}
                  required
                />
                <label style={s.label}>PAN Number</label>
                <input
                  style={s.input}
                  placeholder="ABCDE1234F"
                  value={form.pan}
                  onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
                <button type="submit" style={s.submitBtn}>Open Free Demat Account →</button>
                <p style={s.formNote}>By proceeding you agree to our Terms & Privacy Policy.</p>
              </form>
            ) : (
              <div style={s.successBox}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
                <h2 style={{ color: "#f1f5f9", margin: "0 0 8px" }}>Request Received!</h2>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "1.25rem" }}>
                  Thanks {form.name.split(" ")[0]}! This is a demo form for your portfolio —
                  no real account was created.
                </p>
                <button style={s.backBtn} onClick={() => navigate("/")}>← Back to Home</button>
              </div>
            )}
          </div>
        </div>
 
        {/* BENEFITS GRID */}
        <h2 style={s.sectionTitle}>Why Open a Demat Account with Stock Finder?</h2>
        <div style={s.benefitsGrid}>
          {benefits.map((b) => (
            <div key={b.title} style={s.benefitCard}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>{b.icon}</div>
              <h3 style={s.benefitTitle}>{b.title}</h3>
              <p style={s.benefitDesc}>{b.desc}</p>
            </div>
          ))}
        </div>
 
        {/* STEPS */}
        <h2 style={s.sectionTitle}>How It Works</h2>
        <div style={s.stepsRow}>
          {steps.map((st) => (
            <div key={st.num} style={s.stepCard}>
              <div style={s.stepNum}>{st.num}</div>
              <h3 style={s.stepTitle}>{st.title}</h3>
              <p style={s.stepDesc}>{st.desc}</p>
            </div>
          ))}
        </div>
 
        <p style={s.disclaimer}>
          ⚠️ This is a demonstration page built for a student portfolio project. No real
          brokerage account, KYC, or financial service is provided.
        </p>
      </div>
    </div>
  );
}
 
const s = {
  root:        { minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter',-apple-system,sans-serif" },
  container:   { maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.25rem" },
 
  heroRow:     { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2.5rem", alignItems: "start", marginBottom: "3.5rem" },
  heroLeft:    { display: "flex", flexDirection: "column", gap: "1rem" },
  badge:       { display: "inline-block", backgroundColor: "#1e3a5f", color: "#60a5fa", fontSize: "12px", fontWeight: 600, padding: "5px 14px", borderRadius: "999px", width: "fit-content" },
  heroTitle:   { fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 800, color: "#f1f5f9", fontFamily: "'Sora',sans-serif", lineHeight: 1.2, margin: 0 },
  heroSub:     { fontSize: "14px", color: "#94a3b8", lineHeight: 1.7, margin: 0 },
  trustRow:    { display: "flex", gap: "2rem", marginTop: "1rem" },
  trustVal:    { display: "block", fontSize: "1.4rem", fontWeight: 800, color: "#3b82f6", fontFamily: "'Sora',sans-serif" },
  trustLbl:    { display: "block", fontSize: "11px", color: "#64748b", marginTop: "2px" },
 
  formCard:    { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "1.75rem" },
  formTitle:   { fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 1.25rem" },
  label:       { display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", marginTop: "14px" },
  input:       { width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", color: "#f1f5f9", fontSize: "14px", outline: "none" },
  submitBtn:   { width: "100%", backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "1.5rem" },
  formNote:    { fontSize: "11px", color: "#475569", textAlign: "center", marginTop: "10px" },
  successBox:  { textAlign: "center", padding: "1rem 0" },
  backBtn:     { backgroundColor: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "9px 20px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" },
 
  sectionTitle:{ fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Sora',sans-serif", marginBottom: "1.25rem" },
  benefitsGrid:{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem", marginBottom: "3rem" },
  benefitCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "1.25rem" },
  benefitTitle:{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" },
  benefitDesc: { fontSize: "12.5px", color: "#64748b", lineHeight: 1.6, margin: 0 },
 
  stepsRow:    { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem", marginBottom: "2.5rem" },
  stepCard:    { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "1.25rem", position: "relative" },
  stepNum:     { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#3b82f6", color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" },
  stepTitle:   { fontSize: "13.5px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" },
  stepDesc:    { fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 },
 
  disclaimer:  { fontSize: "11px", color: "#475569", textAlign: "center", lineHeight: 1.6 },
};