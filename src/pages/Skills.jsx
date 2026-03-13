import { useState } from "react";
import { Card, SectionTitle, PageHeader, ProgressBar, EmptyState, uid, inputStyle, btnPrimary, btnGhost } from "../shared";

export default function Skills({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Language" });

  const addSkill = () => {
    if (!form.name.trim()) return;
    update({ skills: [...state.skills, { id: uid(), name: form.name.trim(), level: 0, category: form.category }] });
    setForm({ name: "", category: "Language" }); setAdding(false);
  };

  const updateLevel = (id, level) => {
    update({ skills: state.skills.map(s => s.id === id ? { ...s, level: Math.max(0, Math.min(100, +level)) } : s) });
  };

  const deleteSkill = (id) => update({ skills: state.skills.filter(s => s.id !== id) });

  const categories = ["Language", "Core", "Domain", "Tool", "Other"];
  const CATEGORY_COLORS = { Language: "#4f46e5", Core: "#10b981", Domain: "#8b5cf6", Tool: "#f59e0b", Other: "#6b7280" };

  const grouped = {};
  state.skills.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const avgLevel = state.skills.length > 0
    ? Math.round(state.skills.reduce((a, s) => a + s.level, 0) / state.skills.length) : 0;

  return (
    <div>
      <PageHeader title="Skill Development" subtitle="Track your engineering skill growth" C={C} />

      {/* Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: C.accent }}>{state.skills.length}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Skills Tracked</div>
        </Card>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: C.success }}>{avgLevel}%</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Avg Proficiency</div>
        </Card>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: "#8b5cf6" }}>{state.skills.filter(s => s.level >= 80).length}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Advanced</div>
        </Card>
      </div>

      {/* Add */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setAdding(v => !v)} style={btnPrimary(C)}>+ Add Skill</button>
      </div>

      {adding && (
        <Card C={C} style={{ marginBottom: 20, border: `2px dashed ${C.accent}` }}>
          <SectionTitle C={C}>Add Custom Skill</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Skill Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="e.g. React, Docker, SQL…" style={{ ...inputStyle(C), marginTop: 4 }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addSkill} style={btnPrimary(C)}>Add</button>
            <button onClick={() => setAdding(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Skills by category */}
      {Object.entries(grouped).map(([cat, skills]) => (
        <Card key={cat} C={C} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[cat] || C.accent }} />
            <SectionTitle C={C}>{cat}</SectionTitle>
          </div>
          {skills.map(skill => (
            <div key={skill.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{skill.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: CATEGORY_COLORS[cat] || C.accent }}>{skill.level}%</span>
                  <button onClick={() => deleteSkill(skill.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14 }}>×</button>
                </div>
              </div>
              <input type="range" min={0} max={100} value={skill.level}
                onChange={e => updateLevel(skill.id, e.target.value)}
                style={{ width: "100%", accentColor: CATEGORY_COLORS[cat] || C.accent }} />
              <ProgressBar value={skill.level} color={CATEGORY_COLORS[cat] || C.accent} C={C} height={4} />
            </div>
          ))}
        </Card>
      ))}

      {state.skills.length === 0 && (
        <Card C={C}>
          <EmptyState icon="◈" title="No skills tracked" subtitle="Add your first skill to start tracking!" C={C} />
        </Card>
      )}
    </div>
  );
}
