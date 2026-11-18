import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";

/* Admin page: see everyone who applied for a demat account.  URL: /admin-demat
   You must type your secret key (the DEMAT_ADMIN_KEY you set before starting the backend). */
const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");
const KEY = "sf_admin_key";

export default function AdminDemat() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } });
  const [input, setInput] = useState("");
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState("");

  const load = async (k = key) => {
    setErr("");
    try {
      const r = await fetch(API + "/demat/admin/applications", { headers: { "X-Admin-Key": k } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || "Failed");
      setRows(j.applications);
      try { sessionStorage.setItem(KEY, k); } catch { /* ignore */ }
      setKey(k);
    } catch (e) {
      setRows(null); setKey("");
      setErr(/Failed to fetch/.test(e.message) ? "Cannot reach the backend. Is it running?" : e.message);
    }
  };
  useEffect(() => { if (key) load(key); /* eslint-disable-next-line */ }, []);

  const act = async (id, what) => {
    setBusy(id);
    try {
      const r = await fetch(`${API}/demat/admin/${id}/${what}`, { method: "POST", headers: { "X-Admin-Key": key } });
      if (!r.ok) throw new Error((await r.json()).detail);
      await load();
    } catch (e) { setErr(e.message); }
    setBusy("");
  };

  const shown = (rows || []).filter((r) => filter === "ALL" || r.status === filter);
  const count = (st) => (rows || []).filter((r) => r.status === st).length;

  return (
    <div style={s.root}>
      <Navbar />
      <div style={s.wrap}>
        <h1 style={s.h1}>Demat applications (admin)</h1>

        {!rows && (
          <div style={s.card}>
            <p style={s.p}>Type your secret key to see the applications.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={s.input} type="password" placeholder="Secret key" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(input)} />
              <button style={s.btn} onClick={() => load(input)}>Open</button>
            </div>
            {err && <div style={s.err}>{err}</div>}
          </div>
        )}

        {rows && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
              {[["ALL", `All (${rows.length})`], ["UNDER_REVIEW", `Under review (${count("UNDER_REVIEW")})`], ["APPROVED", `Approved (${count("APPROVED")})`], ["REJECTED", `Rejected (${count("REJECTED")})`]].map(([k, l]) => (
                <button key={k} style={{ ...s.tab, ...(filter === k ? s.tabOn : null) }} onClick={() => setFilter(k)}>{l}</button>))}
              <button style={{ ...s.tab, marginLeft: "auto" }} onClick={() => load()}>↻ Refresh</button>
              <button style={s.tab} onClick={() => { setRows(null); setKey(""); try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }}>Lock</button>
            </div>
            {err && <div style={s.err}>{err}</div>}
            <div style={{ overflowX: "auto" }}>
              <table style={s.tbl}>
                <thead><tr>{["Applied", "Application ID", "Name", "Mobile", "Email", "PAN", "Client ID", "Status", "Action"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td style={s.td}>{r.created_at.replace("T", " ")}</td>
                      <td style={{ ...s.td, fontFamily: "monospace" }}>{r.id}</td>
                      <td style={s.td}><b>{r.name}</b></td>
                      <td style={s.td}>{r.mobile}</td>
                      <td style={s.td}>{r.email}</td>
                      <td style={{ ...s.td, fontFamily: "monospace" }}>{r.pan_masked}</td>
                      <td style={{ ...s.td, fontFamily: "monospace" }}>{r.client_id || "—"}</td>
                      <td style={s.td}><span style={{ ...s.pill, ...(r.status === "APPROVED" ? s.ok : r.status === "REJECTED" ? s.bad : s.wait) }}>{r.status.replace("_", " ")}</span></td>
                      <td style={s.td}>
                        {r.status !== "APPROVED" && <button style={{ ...s.mini, background: "#16a34a" }} disabled={busy === r.id} onClick={() => act(r.id, "approve")}>Approve</button>}{" "}
                        {r.status !== "REJECTED" && <button style={{ ...s.mini, background: "#dc2626" }} disabled={busy === r.id} onClick={() => act(r.id, "reject")}>Reject</button>}
                      </td>
                    </tr>))}
                  {!shown.length && <tr><td style={{ ...s.td, textAlign: "center", color: "#64748b" }} colSpan={9}>No applications yet</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ ...s.p, marginTop: 14 }}>Full PAN, Aadhaar and bank numbers are never stored, so you only see masked values here.</p>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter',sans-serif" },
  wrap: { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" },
  h1: { fontSize: 22, fontWeight: 800, fontFamily: "'Sora',sans-serif", margin: "0 0 18px" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: 22, maxWidth: 460 },
  p: { fontSize: 13, color: "#94a3b8", margin: "0 0 12px", lineHeight: 1.6 },
  input: { flex: 1, minWidth: 180, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 14 },
  btn: { background: "#3b82f6", color: "#fff", border: 0, borderRadius: 8, padding: "10px 22px", fontWeight: 700, cursor: "pointer" },
  err: { background: "#450a0a", border: "1px solid #991b1b", color: "#fca5a5", fontSize: 12, padding: "9px 12px", borderRadius: 8, marginTop: 12 },
  tab: { background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  tabOn: { background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" },
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: 12.5, background: "#1e293b", borderRadius: 10, overflow: "hidden" },
  th: { textAlign: "left", padding: "10px 12px", background: "#16233d", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", borderBottom: "1px solid #273449", whiteSpace: "nowrap" },
  pill: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 },
  ok: { background: "#14532d", color: "#86efac" }, bad: { background: "#450a0a", color: "#fca5a5" }, wait: { background: "#422006", color: "#fcd34d" },
  mini: { color: "#fff", border: 0, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
};
