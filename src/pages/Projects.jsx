import { useState } from "react";
import { Card, SectionTitle, PageHeader, Pill, EmptyState, uid, inputStyle, btnPrimary, btnGhost } from "../shared";

const STATUSES = ["Planned", "In Progress", "Completed"];
const STATUS_COLORS = { Planned: "#6b7280", "In Progress": "#f59e0b", Completed: "#10b981" };
const STATUS_BG = { Planned: "#f3f4f6", "In Progress": "#fef3c7", Completed: "#d1fae5" };

export default function Projects({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", tech: "", semester: "1", status: "Planned", githubUrl: "" });

  const addProject = () => {
    if (!form.name.trim()) return;
    update({ projects: [...state.projects, { id: uid(), ...form }] });
    setForm({ name: "", desc: "", tech: "", semester: "1", status: "Planned", githubUrl: "" }); setAdding(false);
  };

  const updateProject = (id, patch) => {
    update({ projects: state.projects.map(p => p.id === id ? { ...p, ...patch } : p) });
  };

  const deleteProject = (id) => update({ projects: state.projects.filter(p => p.id !== id) });

  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? state.projects : state.projects.filter(p => p.status === filter);

  return (
    <div>
      <PageHeader title="Project Portfolio" subtitle="Showcase your academic and personal projects" C={C} />

      {/* Filter + Add */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 500, borderRadius: 20,
              border: `1px solid ${filter === s ? C.accent : C.border}`,
              background: filter === s ? C.accentBg : "none", color: filter === s ? C.accent : C.muted,
              cursor: "pointer",
            }}>{s}</button>
          ))}
        </div>
        <button onClick={() => setAdding(v => !v)} style={btnPrimary(C)}>+ Add Project</button>
      </div>

      {/* Add Form */}
      {adding && (
        <Card C={C} style={{ marginBottom: 20, border: `2px dashed ${C.accent}` }}>
          <SectionTitle C={C}>New Project</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Project Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. AI Chatbot" style={{ ...inputStyle(C), marginTop: 4 }} autoFocus />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Description</label>
              <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                placeholder="Brief description of the project…" style={{ ...inputStyle(C), marginTop: 4, minHeight: 60, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Technology</label>
              <input value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))}
                placeholder="React, Python, Flask…" style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Semester</label>
              <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>GitHub URL (optional)</label>
              <input value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                placeholder="https://github.com/…" style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addProject} style={btnPrimary(C)}>Save</button>
            <button onClick={() => setAdding(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Project Cards */}
      {filtered.length === 0 ? (
        <Card C={C}><EmptyState icon="▦" title="No projects yet" subtitle="Start building and add your first project!" C={C} /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(p => (
            <Card key={p.id} C={C}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  {p.desc && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>{p.desc}</div>}
                </div>
                <button onClick={() => deleteProject(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <Pill label={p.status} color={STATUS_COLORS[p.status]} bg={C.dm ? STATUS_COLORS[p.status] + "33" : STATUS_BG[p.status]} />
                <Pill label={`Sem ${p.semester}`} color={C.accent} bg={C.accentBg} />
              </div>
              {p.tech && (
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  <strong>Tech:</strong> {p.tech}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={p.status} onChange={e => updateProject(p.id, { status: e.target.value })}
                  style={{ ...inputStyle(C), width: "auto", fontSize: 11, padding: "4px 8px" }}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.accent, fontWeight: 500, textDecoration: "none" }}>
                    GitHub ↗
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
