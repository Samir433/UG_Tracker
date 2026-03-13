import { useState } from "react";
import { Card, SectionTitle, PageHeader, ProgressBar, Pill, uid, inputStyle, btnPrimary, btnGhost } from "../shared";

export default function Timeline({ state, update, C }) {
  const [addingGoal, setAddingGoal] = useState(null);
  const [goalInput, setGoalInput] = useState("");

  const completedSems = Object.values(state.semesters).filter(s => s.completed).length;
  const currentSem = state.profile.currentSemester || 1;

  const toggleSemester = (id) => {
    const sem = state.semesters[id];
    update({
      semesters: { ...state.semesters, [id]: { ...sem, completed: !sem.completed } },
    });
  };

  const addGoal = (semId) => {
    if (!goalInput.trim()) return;
    const sem = state.semesters[semId];
    const goals = [...(sem.goals || []), { id: uid(), text: goalInput.trim(), done: false }];
    update({ semesters: { ...state.semesters, [semId]: { ...sem, goals } } });
    setGoalInput(""); setAddingGoal(null);
  };

  const toggleGoal = (semId, goalId) => {
    const sem = state.semesters[semId];
    const goals = sem.goals.map(g => g.id === goalId ? { ...g, done: !g.done } : g);
    update({ semesters: { ...state.semesters, [semId]: { ...sem, goals } } });
  };

  const deleteGoal = (semId, goalId) => {
    const sem = state.semesters[semId];
    update({ semesters: { ...state.semesters, [semId]: { ...sem, goals: sem.goals.filter(g => g.id !== goalId) } } });
  };

  const years = [
    { yr: 1, label: "Year 1 — Foundation", sems: [1, 2] },
    { yr: 2, label: "Year 2 — Core", sems: [3, 4] },
    { yr: 3, label: "Year 3 — Specialization", sems: [5, 6] },
    { yr: 4, label: "Year 4 — Capstone", sems: [7, 8] },
  ];

  return (
    <div>
      <PageHeader title="Academic Timeline" subtitle="Your 4-year engineering journey" C={C} />

      {/* Overall progress */}
      <Card C={C} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Overall Progress</span>
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>{completedSems}/8 semesters</span>
        </div>
        <ProgressBar value={(completedSems / 8) * 100} C={C} height={10} />
      </Card>

      {/* Years */}
      {years.map(({ yr, label, sems }) => (
        <div key={yr} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: C.accentBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: C.accent,
            }}>{yr}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {sems.filter(s => state.semesters[s]?.completed).length}/2 complete
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {sems.map(semId => {
              const sem = state.semesters[semId];
              const goalsDone = (sem.goals || []).filter(g => g.done).length;
              const goalsTotal = (sem.goals || []).length;
              const isCurrent = semId === currentSem;

              return (
                <Card key={semId} C={C} style={{
                  border: isCurrent ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  position: "relative",
                }}>
                  {isCurrent && (
                    <Pill label="Current" color={C.accent} bg={C.accentBg} />
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: isCurrent ? 10 : 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{sem.name}</div>
                    <button onClick={() => toggleSemester(semId)} style={{
                      width: 28, height: 28, borderRadius: "50%",
                      border: `2px solid ${sem.completed ? C.success : C.border}`,
                      background: sem.completed ? C.success : "none",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sem.completed && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                    </button>
                  </div>

                  {/* Goals */}
                  {(sem.goals || []).length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                        Goals ({goalsDone}/{goalsTotal})
                      </div>
                      {sem.goals.map(g => (
                        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <input type="checkbox" checked={g.done} onChange={() => toggleGoal(semId, g.id)}
                            style={{ accentColor: C.accent }} />
                          <span style={{ fontSize: 12, flex: 1, textDecoration: g.done ? "line-through" : "none", color: g.done ? C.muted : C.text }}>
                            {g.text}
                          </span>
                          <button onClick={() => deleteGoal(semId, g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add goal */}
                  {addingGoal === semId ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addGoal(semId)}
                        placeholder="e.g. Complete DSA course" style={{ ...inputStyle(C), flex: 1, fontSize: 12, padding: "6px 10px" }} autoFocus />
                      <button onClick={() => addGoal(semId)} style={{ ...btnPrimary(C), padding: "6px 12px", fontSize: 11 }}>+</button>
                      <button onClick={() => { setAddingGoal(null); setGoalInput(""); }} style={{ ...btnGhost(C), padding: "6px 10px", fontSize: 11 }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingGoal(semId)} style={{
                      background: "none", border: "none", cursor: "pointer", color: C.accent,
                      fontSize: 11, fontWeight: 500, marginTop: 10, padding: 0,
                    }}>+ Add goal</button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
