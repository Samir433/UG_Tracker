import { useState } from "react";
import { Card, SectionTitle, PageHeader, EmptyState, uid, weekKey, fmtDate, inputStyle, btnPrimary, btnGhost } from "../shared";

const PROMPTS = [
  "What did I learn this week?",
  "What went well?",
  "What needs improvement next week?",
];

export default function Reflections({ state, update, C }) {
  const [writing, setWriting] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ learned: "", wentWell: "", improve: "" });

  const currentWeek = weekKey();
  const existing = state.reflections.find(r => r.weekKey === currentWeek);

  const saveReflection = () => {
    if (!form.learned.trim() && !form.wentWell.trim() && !form.improve.trim()) return;
    const entry = { id: existing?.id || uid(), weekKey: currentWeek, date: new Date().toISOString(), ...form };
    const updated = existing
      ? state.reflections.map(r => r.id === entry.id ? entry : r)
      : [entry, ...state.reflections];
    update({ reflections: updated });
    setWriting(false);
  };

  const deleteReflection = (id) => {
    update({ reflections: state.reflections.filter(r => r.id !== id) });
    if (viewing?.id === id) setViewing(null);
  };

  const startWriting = () => {
    if (existing) {
      setForm({ learned: existing.learned || "", wentWell: existing.wentWell || "", improve: existing.improve || "" });
    } else {
      setForm({ learned: "", wentWell: "", improve: "" });
    }
    setWriting(true);
  };

  const sorted = [...state.reflections].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Weekly Reflections" subtitle="Pause, reflect, and grow each week" C={C} />

      {/* Viewing a specific entry */}
      {viewing ? (
        <div>
          <button onClick={() => setViewing(null)} style={{ ...btnGhost(C), marginBottom: 16 }}>← Back</button>
          <Card C={C}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{fmtDate(viewing.date)} · {viewing.weekKey}</div>
            {[
              { label: PROMPTS[0], value: viewing.learned },
              { label: PROMPTS[1], value: viewing.wentWell },
              { label: PROMPTS[2], value: viewing.improve },
            ].map((item, i) => item.value && (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: C.text }}>{item.value}</div>
              </div>
            ))}
          </Card>
        </div>
      ) : writing ? (
        /* Writing form */
        <Card C={C}>
          <SectionTitle C={C}>{existing ? "Update" : "New"} Reflection — {currentWeek}</SectionTitle>
          {PROMPTS.map((prompt, i) => {
            const key = ["learned", "wentWell", "improve"][i];
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.accent, display: "block", marginBottom: 6 }}>{prompt}</label>
                <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="Write your thoughts…"
                  style={{ ...inputStyle(C), minHeight: 80, resize: "vertical" }} />
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveReflection} style={btnPrimary(C)}>Save Reflection</button>
            <button onClick={() => setWriting(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      ) : (
        /* List view */
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.muted }}>
              {sorted.length} reflection{sorted.length !== 1 ? "s" : ""} recorded
            </div>
            <button onClick={startWriting} style={btnPrimary(C)}>
              {existing ? "✎ Edit This Week" : "+ New Reflection"}
            </button>
          </div>

          {sorted.length === 0 ? (
            <Card C={C}>
              <EmptyState icon="✎" title="No reflections yet" subtitle="Start your first weekly reflection to build a growth habit!" C={C} />
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {sorted.map(r => (
                <Card key={r.id} C={C} onClick={() => setViewing(r)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.weekKey}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(r.date)}</span>
                      </div>
                      {r.learned && (
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                          <strong style={{ color: C.text }}>Learned:</strong> {r.learned.slice(0, 100)}{r.learned.length > 100 ? "…" : ""}
                        </div>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteReflection(r.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, marginLeft: 12 }}>×</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
