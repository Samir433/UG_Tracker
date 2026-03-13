import { useState } from "react";
import { Card, SectionTitle, PageHeader, Pill, EmptyState, uid, fmtDate, todayKey, inputStyle, btnPrimary, btnGhost } from "../shared";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_COLORS = { Applied: "#4f46e5", Interview: "#f59e0b", Offer: "#10b981", Rejected: "#ef4444" };
const STATUS_BG = { Applied: "#eef2ff", Interview: "#fef3c7", Offer: "#d1fae5", Rejected: "#fee2e2" };

export default function Internships({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", date: todayKey(), status: "Applied" });

  const addInternship = () => {
    if (!form.company.trim()) return;
    update({ internships: [...state.internships, { id: uid(), ...form }] });
    setForm({ company: "", role: "", date: todayKey(), status: "Applied" }); setAdding(false);
  };

  const updateStatus = (id, status) => {
    update({ internships: state.internships.map(i => i.id === id ? { ...i, status } : i) });
  };

  const deleteInternship = (id) => update({ internships: state.internships.filter(i => i.id !== id) });

  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? state.internships : state.internships.filter(i => i.status === filter);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const counts = {};
  STATUS_OPTIONS.forEach(s => { counts[s] = state.internships.filter(i => i.status === s).length; });

  return (
    <div>
      <PageHeader title="Internship Tracker" subtitle="Track your internship applications" C={C} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {STATUS_OPTIONS.map(s => (
          <Card key={s} C={C} style={{ textAlign: "center", padding: "14px", cursor: "pointer", border: filter === s ? `2px solid ${STATUS_COLORS[s]}` : undefined }}
            onClick={() => setFilter(f => f === s ? "All" : s)}>
            <div style={{ fontSize: 24, fontWeight: 300, color: STATUS_COLORS[s] }}>{counts[s]}</div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>{s}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setAdding(v => !v)} style={btnPrimary(C)}>+ Add Application</button>
      </div>

      {adding && (
        <Card C={C} style={{ marginBottom: 20, border: `2px dashed ${C.accent}` }}>
          <SectionTitle C={C}>New Application</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Google" style={{ ...inputStyle(C), marginTop: 4 }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Role</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="SDE Intern" style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Application Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addInternship} style={btnPrimary(C)}>Save</button>
            <button onClick={() => setAdding(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card C={C}>
        <SectionTitle C={C}>Applications {filter !== "All" && `· ${filter}`}</SectionTitle>
        {sorted.length === 0 ? (
          <EmptyState icon="◉" title="No applications yet" subtitle="Start applying and track your progress!" C={C} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Company", "Role", "Date", "Status", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(i => (
                  <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{i.company}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{i.role || "—"}</td>
                    <td style={{ padding: "10px 12px", color: C.muted, fontSize: 12 }}>{fmtDate(i.date)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                        style={{ ...inputStyle(C), width: "auto", fontSize: 11, padding: "4px 8px", background: C.dm ? STATUS_COLORS[i.status] + "33" : STATUS_BG[i.status], color: STATUS_COLORS[i.status], fontWeight: 600, border: "none" }}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => deleteInternship(i.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
