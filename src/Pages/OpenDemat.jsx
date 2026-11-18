import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

/* ───────── Open Demat Account — full application flow ─────────
   Backend: stock-backend/demat_api.py   (POST /demat/otp/send, /otp/verify, /apply, GET /status)
   Set DEMO_MODE = false only when you are a registered broker / have a broker partner. */
const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");
const DEMO_MODE = true;

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry"];
const OCCUPATIONS = ["Salaried","Self-employed / Business","Student","Homemaker","Retired","Professional","Other"];
const INCOMES = ["Below ₹1 Lakh","₹1 - 5 Lakh","₹5 - 10 Lakh","₹10 - 25 Lakh","Above ₹25 Lakh"];
const RELATIONS = ["Father","Mother","Spouse","Son","Daughter","Brother","Sister","Other"];
const SEGMENTS = [
  { k: "EQUITY", t: "Equity (Cash)", d: "Buy & sell shares, ETFs", locked: true },
  { k: "MF_IPO", t: "Mutual Funds & IPO", d: "SIPs, direct funds, IPO applications" },
  { k: "FNO", t: "Futures & Options", d: "Needs income proof. Higher risk." },
  { k: "CURRENCY", t: "Currency", d: "USD-INR and other pairs" },
  { k: "COMMODITY", t: "Commodity", d: "Gold, silver, crude" },
];
const STEPS = ["Personal", "KYC", "Bank", "Nominee & Segments", "Review & Sign"];

const benefits = [
  { icon: "⚡", title: "Quick application", desc: "Five short steps. Fill it in about five minutes." },
  { icon: "💸", title: "Zero account charges", desc: "No account opening fee and no yearly maintenance charge." },
  { icon: "🔒", title: "Your data stays masked", desc: "We keep only the last 4 digits of Aadhaar and your bank account." },
  { icon: "📈", title: "One account, many options", desc: "Stocks, mutual funds, ETFs and IPOs from one place." },
];
const howItWorks = [
  { num: "1", title: "Verify your mobile", desc: "Get a 6-digit OTP and confirm it." },
  { num: "2", title: "Fill your details", desc: "Personal, PAN & Aadhaar, bank and nominee." },
  { num: "3", title: "E-sign", desc: "Sign digitally by typing your name." },
  { num: "4", title: "Get your Client ID", desc: "Start trading from your Portfolio page." },
];

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ageOf = (iso) => { const d = new Date(iso); if (isNaN(d)) return -1; const t = new Date(); let a = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const fmtAadhaar = (v) => v.replace(/\D/g, "").slice(0, 12).replace(/(.{4})/g, "$1 ").trim();
const errText = (d) => (Array.isArray(d) ? d.map((x) => x.msg).join("; ") : d) || "Something went wrong";

async function api(path, opts) {
  let r;
  try { r = await fetch(API + path, { signal: AbortSignal.timeout(20000), ...opts }); }
  catch { throw new Error("Cannot reach the server. Start the backend: uvicorn main:app --reload"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(errText(j.detail));
  return j;
}
const post = (path, body) => api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const EMPTY = {
  name: "", email: "", dob: "", gender: "", marital: "", father: "", occupation: "", income: "",
  line1: "", line2: "", city: "", state: "", pincode: "",
  pan: "", aadhaar: "", pep: false,
  ifsc: "", bankName: "", branch: "", acct: "", acct2: "", acctType: "SAVINGS",
  hasNominee: true, nName: "", nRel: "", nDob: "",
  segments: ["EQUITY"], esign: "", terms: false, risk: false,
};

/* Form fields live OUTSIDE the page component so React keeps the same input on every keystroke
   (defining them inside made the input lose focus after each letter). */
const FormCtx = createContext(null);
function Field({ k, label, type = "text", ph, upper, max, children }) {
  const { f, errs, set } = useContext(FormCtx);
  return (
    <div style={s.fld}>
      <label style={s.label}>{label}</label>
      {children || (
        <input className="od-input" style={{ ...s.input, ...(errs[k] ? s.inputErr : null) }} type={type} placeholder={ph} maxLength={max} value={f[k]}
          onChange={(e) => set(k, upper ? e.target.value.toUpperCase() : e.target.value)} />
      )}
      {errs[k] && <span style={s.err}>{errs[k]}</span>}
    </div>
  );
}
function Sel({ k, label, opts }) {
  const { f, errs, set } = useContext(FormCtx);
  return (
    <Field k={k} label={label}>
      <select className="od-input" style={{ ...s.input, ...(errs[k] ? s.inputErr : null) }} value={f[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">Select</option>{opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}

export default function OpenDemat() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("landing");          // landing | wizard | done
  const [step, setStep] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [token, setToken] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [cool, setCool] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);
  const [stId, setStId] = useState(""); const [stMobile, setStMobile] = useState(""); const [stRes, setStRes] = useState(null); const [stErr, setStErr] = useState("");
  const top = useRef(null);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrs((p) => ({ ...p, [k]: undefined })); };

  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);
  useEffect(() => { top.current && top.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [step, phase]);

  // bank name / branch from IFSC (free public lookup; optional)
  useEffect(() => {
    const code = f.ifsc.toUpperCase();
    if (!IFSC_RE.test(code)) return;
    let alive = true;
    fetch(`https://ifsc.razorpay.com/${code}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (alive && j && j.BANK) setF((p) => ({ ...p, bankName: j.BANK, branch: j.BRANCH || "" }));
    }).catch(() => {});
    return () => { alive = false; };
  }, [f.ifsc]);

  /* ── OTP ── */
  const sendOtp = async () => {
    setMsg("");
    if (!/^[6-9]\d{9}$/.test(mobile)) { setMsg("Enter a valid 10-digit mobile number"); return; }
    setBusy(true);
    try {
      const r = await post("/demat/otp/send", { mobile });
      setOtpSent(true); setCool(30); setOtp(""); setDemoOtp(r.demo_otp || "");
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  const verifyOtp = async () => {
    setMsg("");
    if (!/^\d{6}$/.test(otp)) { setMsg("Enter the 6-digit OTP"); return; }
    setBusy(true);
    try {
      const r = await post("/demat/otp/verify", { mobile, otp });
      setToken(r.token); setPhase("wizard"); setStep(0);
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  /* ── step validation ── */
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (f.name.trim().length < 3) e.name = "Enter your full name as on PAN";
      if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email";
      if (!f.dob) e.dob = "Select your date of birth"; else if (ageOf(f.dob) < 18) e.dob = "You must be 18 or older";
      if (!f.gender) e.gender = "Select one";
      if (f.father.trim().length < 3) e.father = "Enter your father's name";
      if (!f.occupation) e.occupation = "Select one";
      if (!f.income) e.income = "Select one";
      if (f.line1.trim().length < 3) e.line1 = "Enter your address";
      if (f.city.trim().length < 2) e.city = "Enter your city";
      if (!f.state) e.state = "Select your state";
      if (!/^[1-9]\d{5}$/.test(f.pincode)) e.pincode = "6-digit pincode";
    }
    if (s === 1) {
      if (!PAN_RE.test(f.pan.toUpperCase())) e.pan = "Format: ABCDE1234F";
      if (f.aadhaar.replace(/\D/g, "").length !== 12) e.aadhaar = "Aadhaar must be 12 digits";
    }
    if (s === 2) {
      if (!IFSC_RE.test(f.ifsc.toUpperCase())) e.ifsc = "Format: HDFC0001234";
      if (f.bankName.trim().length < 2) e.bankName = "Enter your bank name";
      if (!/^\d{9,18}$/.test(f.acct)) e.acct = "9 to 18 digits";
      if (f.acct2 !== f.acct) e.acct2 = "Account numbers do not match";
    }
    if (s === 3 && f.hasNominee) {
      if (f.nName.trim().length < 3) e.nName = "Enter nominee name";
      if (!f.nRel) e.nRel = "Select relation";
      if (!f.nDob || ageOf(f.nDob) < 0) e.nDob = "Enter nominee date of birth";
    }
    if (s === 4) {
      if (f.esign.trim().toLowerCase() !== f.name.trim().toLowerCase()) e.esign = "Type your full name exactly as entered in Step 1";
      if (!f.terms) e.terms = "Please accept the terms";
      if (!f.risk) e.risk = "Please accept the risk disclosure";
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };
  const next = () => { if (validate(step)) setStep(step + 1); };
  const back = () => { setErrs({}); setStep(step - 1); };

  /* ── submit ── */
  const submit = async () => {
    if (!validate(4)) return;
    setBusy(true); setMsg("");
    try {
      const r = await post("/demat/apply", {
        token, name: f.name.trim(), email: f.email.trim(), dob: f.dob, gender: f.gender, marital_status: f.marital,
        father_name: f.father.trim(), occupation: f.occupation, income: f.income,
        address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
        pan: f.pan.toUpperCase(), aadhaar: f.aadhaar.replace(/\D/g, ""), pep: f.pep,
        bank: { ifsc: f.ifsc.toUpperCase(), bank_name: f.bankName, branch: f.branch, account_number: f.acct, account_type: f.acctType },
        nominee: f.hasNominee ? { name: f.nName, relation: f.nRel, dob: f.nDob } : null,
        segments: f.segments, esign_name: f.esign, accept_terms: f.terms, accept_risk: f.risk,
      });
      setResult(r); setPhase("done");
      if (r.client_id) { try { localStorage.setItem("sf_demat_account", JSON.stringify({ clientId: r.client_id, appId: r.application_id, name: r.name })); } catch { /* ignore */ } }
      setF(EMPTY);
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const checkStatus = async () => {
    setStErr(""); setStRes(null);
    if (!stId.trim() || !/^\d{10}$/.test(stMobile)) { setStErr("Enter your Application ID and 10-digit mobile"); return; }
    try { setStRes(await api(`/demat/status/${encodeURIComponent(stId.trim())}?mobile=${stMobile}`)); }
    catch (e) { setStErr(e.message); }
  };

  const Banner = () => DEMO_MODE ? (
    <div style={s.demo}>
      <b>Demo mode.</b> Stock Finder is a learning project and is not a SEBI-registered broker. No real demat account is opened.
      Please do not enter your real Aadhaar number or bank account number. Use dummy values.
    </div>
  ) : null;

  const review = [
    ["Name", f.name], ["Email", f.email], ["Mobile", mobile], ["Date of birth", f.dob], ["Gender", f.gender],
    ["Father's name", f.father], ["Occupation", f.occupation], ["Annual income", f.income],
    ["Address", [f.line1, f.line2, f.city, f.state, f.pincode].filter(Boolean).join(", ")],
    ["PAN", f.pan.toUpperCase().replace(/^(.{2}).{5}(.*)$/, "$1XXXXX$2")], ["Aadhaar", "XXXX XXXX " + f.aadhaar.replace(/\D/g, "").slice(-4)],
    ["Bank", `${f.bankName}${f.branch ? " · " + f.branch : ""}`], ["IFSC", f.ifsc.toUpperCase()],
    ["Account", "XXXXXXXX" + f.acct.slice(-4) + " (" + f.acctType.toLowerCase() + ")"],
    ["Nominee", f.hasNominee ? `${f.nName} (${f.nRel})` : "Not adding a nominee"],
    ["Segments", f.segments.map((k) => SEGMENTS.find((x) => x.k === k).t).join(", ")],
  ];

  return (
    <div style={s.root}>
      <style>{`.od-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.od-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:2.5rem;align-items:start;margin-bottom:3.5rem}
        @media(max-width:820px){.od-hero{grid-template-columns:1fr}.od-grid{grid-template-columns:1fr}.od-stepper span.t{display:none}}
        .od-input:focus{border-color:#3b82f6 !important;outline:none}`}</style>
      <Navbar />
      <div style={{ ...s.container, scrollMarginTop: 150 }} ref={top}>

        {phase === "landing" && (
          <>
            <Banner />
            <div className="od-hero">
              <div style={s.heroLeft}>
                <span style={s.badge}>🔒 Secure · 100% Digital</span>
                <h1 style={s.heroTitle}>Open a Free Demat Account in Minutes</h1>
                <p style={s.heroSub}>Verify your mobile, fill five short steps, e-sign online and get your Client ID. No paperwork and no account opening charges.</p>
                <div style={s.trustRow}>
                  <div><span style={s.trustVal}>₹0</span><span style={s.trustLbl}>Account opening</span></div>
                  <div><span style={s.trustVal}>5 steps</span><span style={s.trustLbl}>Short form</span></div>
                  <div><span style={s.trustVal}>~5 min</span><span style={s.trustLbl}>Setup time</span></div>
                </div>
              </div>
              <div style={s.formCard}>
                <h2 style={s.formTitle}>Get Started — It's Free</h2>
                <label style={s.label}>Mobile number</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={s.prefix}>+91</span>
                  <input className="od-input" style={{ ...s.input, flex: 1 }} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={mobile}
                    disabled={otpSent} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
                </div>
                {!otpSent ? (
                  <button style={s.submitBtn} disabled={busy} onClick={sendOtp}>{busy ? "Sending…" : "Get OTP"}</button>
                ) : (
                  <>
                    <label style={s.label}>Enter 6-digit OTP</label>
                    <input className="od-input" style={{ ...s.input, letterSpacing: 6, fontSize: 18, textAlign: "center" }} inputMode="numeric" maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                    {demoOtp && <div style={s.demoOtp}>Demo mode: your OTP is <b>{demoOtp}</b> <button style={s.link} onClick={() => setOtp(demoOtp)}>Fill it</button></div>}
                    <button style={s.submitBtn} disabled={busy} onClick={verifyOtp}>{busy ? "Verifying…" : "Verify & Continue →"}</button>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
                      <button style={s.link} onClick={() => { setOtpSent(false); setOtp(""); setDemoOtp(""); setMsg(""); }}>Change number</button>
                      <button style={{ ...s.link, opacity: cool ? 0.5 : 1 }} disabled={cool > 0 || busy} onClick={sendOtp}>{cool ? `Resend in ${cool}s` : "Resend OTP"}</button>
                    </div>
                  </>
                )}
                {msg && <div style={s.errBox}>{msg}</div>}
                <div style={s.formNote}>By continuing you agree to our Terms and Privacy Policy.</div>
              </div>
            </div>

            <h2 style={s.sectionTitle}>Why open an account with Stock Finder?</h2>
            <div style={s.grid}>{benefits.map((b) => (
              <div key={b.title} style={s.card}><div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div><h3 style={s.cTitle}>{b.title}</h3><p style={s.cDesc}>{b.desc}</p></div>))}</div>

            <h2 style={s.sectionTitle}>How it works</h2>
            <div style={s.grid}>{howItWorks.map((h) => (
              <div key={h.num} style={s.card}><div style={s.stepNum}>{h.num}</div><h3 style={s.cTitle}>{h.title}</h3><p style={s.cDesc}>{h.desc}</p></div>))}</div>

            <h2 style={s.sectionTitle}>Already applied? Check your status</h2>
            <div style={{ ...s.formCard, maxWidth: 560, marginBottom: "2.5rem" }}>
              <div className="od-grid">
                <div style={s.fld}><label style={s.label}>Application ID</label><input className="od-input" style={s.input} placeholder="SF2611…" value={stId} onChange={(e) => setStId(e.target.value.toUpperCase())} /></div>
                <div style={s.fld}><label style={s.label}>Mobile number</label><input className="od-input" style={s.input} inputMode="numeric" maxLength={10} value={stMobile} onChange={(e) => setStMobile(e.target.value.replace(/\D/g, ""))} /></div>
              </div>
              <button style={{ ...s.submitBtn, marginTop: 14 }} onClick={checkStatus}>Check status</button>
              {stErr && <div style={s.errBox}>{stErr}</div>}
              {stRes && (
                <div style={s.statusBox}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><b>{stRes.name}</b><span style={{ ...s.pill, ...(stRes.status === "APPROVED" ? s.pillOk : stRes.status === "REJECTED" ? s.pillBad : s.pillWait) }}>{stRes.status.replace("_", " ")}</span></div>
                  <div style={s.kv}><span>Application ID</span><b>{stRes.application_id}</b></div>
                  {stRes.client_id && <div style={s.kv}><span>Client ID</span><b>{stRes.client_id}</b></div>}
                  <div style={s.kv}><span>PAN</span><b>{stRes.pan}</b></div>
                  <div style={s.kv}><span>Bank account</span><b>{stRes.bank}</b></div>
                </div>
              )}
            </div>
            <p style={s.disclaimer}>Stock Finder is for learning and analysis. Not investment advice. Investments in securities are subject to market risk.</p>
          </>
        )}

        {phase === "wizard" && (
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <Banner />
            <div className="od-stepper" style={s.stepper}>
              {STEPS.map((t, i) => (
                <div key={t} style={{ ...s.stp, opacity: i <= step ? 1 : 0.45 }}>
                  <span style={{ ...s.dot, ...(i < step ? s.dotDone : i === step ? s.dotNow : null) }}>{i < step ? "✓" : i + 1}</span>
                  <span className="t" style={{ fontSize: 12, color: i === step ? "#f1f5f9" : "#94a3b8" }}>{t}</span>
                </div>))}
            </div>
            <FormCtx.Provider value={{ f, errs, set }}>
            <div style={s.formCard}>
              <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 10 }}>✓ Mobile verified: +91 {mobile}</div>

              {step === 0 && (<>
                <h2 style={s.formTitle}>Personal details</h2>
                <div className="od-grid">
                  <Field k="name" label="Full name (as on PAN)" ph="Rahul Kumar Sharma" />
                  <Field k="email" label="Email" type="email" ph="you@example.com" />
                  <Field k="dob" label="Date of birth" type="date" />
                  <Sel k="gender" label="Gender" opts={["Male", "Female", "Other"]} />
                  <Field k="father" label="Father's name" />
                  <Sel k="marital" label="Marital status (optional)" opts={["Single", "Married", "Other"]} />
                  <Sel k="occupation" label="Occupation" opts={OCCUPATIONS} />
                  <Sel k="income" label="Annual income" opts={INCOMES} />
                </div>
                <h3 style={{ ...s.cTitle, margin: "18px 0 0" }}>Residential address (India)</h3>
                <div className="od-grid">
                  <Field k="line1" label="Address line 1" />
                  <Field k="line2" label="Address line 2 (optional)" />
                  <Field k="city" label="City" />
                  <Sel k="state" label="State" opts={STATES} />
                  <Field k="pincode" label="Pincode" max={6} ph="395001" />
                </div>
              </>)}

              {step === 1 && (<>
                <h2 style={s.formTitle}>KYC details</h2>
                <div className="od-grid">
                  <Field k="pan" label="PAN number" upper max={10} ph="ABCDE1234F" />
                  <Field k="aadhaar" label="Aadhaar number">
                    <input className="od-input" style={{ ...s.input, ...(errs.aadhaar ? s.inputErr : null) }} inputMode="numeric" placeholder="1234 5678 9012" value={f.aadhaar} onChange={(e) => set("aadhaar", fmtAadhaar(e.target.value))} />
                  </Field>
                </div>
                <p style={s.hint}>We store only the last 4 digits of your Aadhaar. Your full PAN is never saved. We keep a masked copy.</p>
                <label style={s.check}><input type="checkbox" checked={f.pep} onChange={(e) => set("pep", e.target.checked)} /> I am a politically exposed person (or related to one)</label>
              </>)}

              {step === 2 && (<>
                <h2 style={s.formTitle}>Bank account</h2>
                <div className="od-grid">
                  <Field k="ifsc" label="IFSC code" upper max={11} ph="HDFC0001234" />
                  <Field k="bankName" label="Bank name" ph="Filled automatically from IFSC" />
                  <Field k="acct" label="Account number"><input className="od-input" style={{ ...s.input, ...(errs.acct ? s.inputErr : null) }} inputMode="numeric" maxLength={18} value={f.acct} onChange={(e) => set("acct", e.target.value.replace(/\D/g, ""))} /></Field>
                  <Field k="acct2" label="Confirm account number"><input className="od-input" style={{ ...s.input, ...(errs.acct2 ? s.inputErr : null) }} inputMode="numeric" maxLength={18} value={f.acct2} onChange={(e) => set("acct2", e.target.value.replace(/\D/g, ""))} /></Field>
                  <Sel k="acctType" label="Account type" opts={["SAVINGS", "CURRENT"]} />
                </div>
                {f.branch && <p style={s.hint}>Branch: {f.branch}</p>}
                <p style={s.hint}>Only the last 4 digits of the account number are stored.</p>
              </>)}

              {step === 3 && (<>
                <h2 style={s.formTitle}>Nominee</h2>
                <label style={s.check}><input type="checkbox" checked={f.hasNominee} onChange={(e) => set("hasNominee", e.target.checked)} /> Add a nominee (recommended)</label>
                {f.hasNominee && (
                  <div className="od-grid">
                    <Field k="nName" label="Nominee name" />
                    <Sel k="nRel" label="Relationship" opts={RELATIONS} />
                    <Field k="nDob" label="Nominee date of birth" type="date" />
                  </div>)}
                <h2 style={{ ...s.formTitle, marginTop: 22 }}>Trading segments</h2>
                {SEGMENTS.map((g) => (
                  <label key={g.k} style={{ ...s.seg, borderColor: f.segments.includes(g.k) ? "#3b82f6" : "#334155" }}>
                    <input type="checkbox" disabled={g.locked} checked={f.segments.includes(g.k)}
                      onChange={(e) => set("segments", e.target.checked ? [...f.segments, g.k] : f.segments.filter((x) => x !== g.k))} />
                    <span><b style={{ color: "#f1f5f9" }}>{g.t}</b><br /><span style={{ fontSize: 12, color: "#94a3b8" }}>{g.d}</span></span>
                  </label>))}
              </>)}

              {step === 4 && (<>
                <h2 style={s.formTitle}>Review & e-sign</h2>
                <div style={s.reviewBox}>{review.map(([k, v]) => (<div key={k} style={s.kv}><span>{k}</span><b style={{ textAlign: "right" }}>{v || "—"}</b></div>))}</div>
                <button style={s.link} onClick={() => setStep(0)}>Edit details</button>
                <Field k="esign" label={`E-sign: type your full name "${f.name}"`} />
                <label style={s.check}><input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} /> I confirm the details are correct and accept the account terms and conditions.</label>
                {errs.terms && <span style={s.err}>{errs.terms}</span>}
                <label style={s.check}><input type="checkbox" checked={f.risk} onChange={(e) => set("risk", e.target.checked)} /> I have read the risk disclosure. Investments in securities are subject to market risk.</label>
                {errs.risk && <span style={s.err}>{errs.risk}</span>}
              </>)}

              {msg && <div style={s.errBox}>{msg}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, gap: 10 }}>
                {step > 0 ? <button style={s.backBtn} onClick={back}>← Back</button> : <button style={s.backBtn} onClick={() => { setPhase("landing"); setOtpSent(false); setOtp(""); }}>Cancel</button>}
                {step < 4 ? <button style={{ ...s.submitBtn, width: "auto", padding: "12px 34px", marginTop: 0 }} onClick={next}>Continue →</button>
                  : <button style={{ ...s.submitBtn, width: "auto", padding: "12px 34px", marginTop: 0 }} disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit Application"}</button>}
              </div>
            </div>
            </FormCtx.Provider>
          </div>
        )}

        {phase === "done" && result && (
          <div style={{ maxWidth: 560, margin: "2rem auto" }}>
            <div style={{ ...s.formCard, textAlign: "center" }}>
              <div style={{ fontSize: 46 }}>{result.status === "APPROVED" ? "🎉" : "⏳"}</div>
              <h2 style={{ ...s.formTitle, fontSize: "1.3rem" }}>{result.status === "APPROVED" ? "Your account is ready!" : "Application received"}</h2>
              <p style={{ ...s.cDesc, marginBottom: 16 }}>{result.status === "APPROVED" ? `Welcome, ${result.name}.` : "We are reviewing your details. Check the status any time with your Application ID and mobile number."}</p>
              <div style={s.reviewBox}>
                <div style={s.kv}><span>Application ID</span><b>{result.application_id}</b></div>
                {result.client_id && <div style={s.kv}><span>Client ID</span><b>{result.client_id}</b></div>}
                <div style={s.kv}><span>Status</span><b>{result.status.replace("_", " ")}</b></div>
              </div>
              <p style={s.hint}>Save your Application ID. You need it with your mobile number to check status.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                <button style={{ ...s.submitBtn, width: "auto", padding: "11px 26px", marginTop: 0 }} onClick={() => navigate("/portfolio")}>Go to Portfolio →</button>
                <button style={s.backBtn} onClick={() => navigate("/")}>Home</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter',-apple-system,sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem 3rem" },
  demo: { background: "#422006", border: "1px solid #92400e", color: "#fcd34d", fontSize: 12, lineHeight: 1.6, padding: "10px 14px", borderRadius: 10, marginBottom: 20 },
  heroLeft: { display: "flex", flexDirection: "column", gap: "1rem" },
  badge: { display: "inline-block", alignSelf: "flex-start", backgroundColor: "#1e3a5f", color: "#60a5fa", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 999 },
  heroTitle: { fontSize: "clamp(1.7rem,4vw,2.4rem)", fontWeight: 800, color: "#f1f5f9", fontFamily: "'Sora',sans-serif", lineHeight: 1.2, margin: 0 },
  heroSub: { fontSize: 14, color: "#94a3b8", lineHeight: 1.7, margin: 0 },
  trustRow: { display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" },
  trustVal: { display: "block", fontSize: "1.4rem", fontWeight: 800, color: "#3b82f6", fontFamily: "'Sora',sans-serif" },
  trustLbl: { display: "block", fontSize: 11, color: "#64748b", marginTop: 2 },
  formCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "1.75rem" },
  formTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 1rem" },
  fld: { display: "flex", flexDirection: "column", marginTop: 14, minWidth: 0 },
  label: { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit" },
  inputErr: { border: "1px solid #ef4444" },
  prefix: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#94a3b8" },
  err: { color: "#f87171", fontSize: 11, marginTop: 4 },
  errBox: { background: "#450a0a", border: "1px solid #991b1b", color: "#fca5a5", fontSize: 12, padding: "9px 12px", borderRadius: 8, marginTop: 12 },
  submitBtn: { width: "100%", backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 },
  backBtn: { backgroundColor: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "11px 22px", borderRadius: 10, fontSize: 13, cursor: "pointer" },
  link: { background: "none", border: "none", color: "#60a5fa", fontSize: 12, cursor: "pointer", padding: 0, marginTop: 8 },
  formNote: { fontSize: 11, color: "#475569", textAlign: "center", marginTop: 10 },
  demoOtp: { background: "#0f172a", border: "1px dashed #3b82f6", color: "#93c5fd", fontSize: 12, padding: "8px 10px", borderRadius: 8, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  hint: { fontSize: 11.5, color: "#64748b", lineHeight: 1.6, margin: "10px 0 0" },
  check: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#cbd5e1", marginTop: 14, lineHeight: 1.5 },
  seg: { display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid #334155", borderRadius: 10, padding: "11px 14px", marginTop: 10, cursor: "pointer", fontSize: 13 },
  stepper: { display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 6 },
  stp: { display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  dot: { width: 26, height: 26, borderRadius: "50%", background: "#334155", color: "#cbd5e1", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  dotNow: { background: "#3b82f6", color: "#fff" }, dotDone: { background: "#22c55e", color: "#fff" },
  reviewBox: { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "6px 14px", marginBottom: 8 },
  kv: { display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: 13, color: "#94a3b8" },
  statusBox: { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", marginTop: 14 },
  pill: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 },
  pillOk: { background: "#14532d", color: "#86efac" }, pillBad: { background: "#450a0a", color: "#fca5a5" }, pillWait: { background: "#422006", color: "#fcd34d" },
  sectionTitle: { fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Sora',sans-serif", margin: "0 0 1.25rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginBottom: "3rem" },
  card: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "1.25rem" },
  cTitle: { fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" },
  cDesc: { fontSize: 12.5, color: "#64748b", lineHeight: 1.6, margin: 0 },
  stepNum: { width: 30, height: 30, borderRadius: "50%", backgroundColor: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  disclaimer: { fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.6 },
};