import { useState } from "react";
import { Card, SectionTitle, PageHeader, ProgressBar, EmptyState, uid, fmtDate, inputStyle, btnPrimary, btnGhost } from "../shared";

export default function ExamMode({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subject: "", date: "", topicsStr: "" });
  const [selected, setSelected] = useState(null);

  const addExam = () => {
    if (!form.subject.trim()) return;
    const topics = form.topicsStr.split("\n").map(t => t.trim()).filter(Boolean).map(name => ({ id: uid(), name, done: false }));
    const exam = { id: uid(), subject: form.subject.trim(), date: form.date, topics };
    update({ exams: [...state.exams, exam] });
    setForm({ subject: "", date: "", topicsStr: "" }); setAdding(false);
  };

  const toggleTopic = (examId, topicId) => {
    update({
      exams: state.exams.map(e =>
        e.id === examId ? { ...e, topics: e.topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t) } : e
      ),
    });
  };

  const addTopic = (examId, name) => {
    if (!name.trim()) return;
    update({
      exams: state.exams.map(e =>
        e.id === examId ? { ...e, topics: [...e.topics, { id: uid(), name: name.trim(), done: false }] } : e
      ),
    });
  };

  const deleteTopic = (examId, topicId) => {
    update({
      exams: state.exams.map(e =>
        e.id === examId ? { ...e, topics: e.topics.filter(t => t.id !== topicId) } : e
      ),
    });
  };

  const deleteExam = (id) => {
    update({ exams: state.exams.filter(e => e.id !== id) });
    if (selected?.id === id) setSelected(null);
  };

  const [newTopic, setNewTopic] = useState("");

  // Sort by date (upcoming first)
  const sorted = [...state.exams].sort((a, b) => (a.date || "z").localeCompare(b.date || "z"));

  return (
    <div>
      <PageHeader title="Exam Mode" subtitle="Track your exam preparation and syllabus completion" C={C} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setAdding(v => !v)} style={btnPrimary(C)}>+ Add Exam</button>
      </div>

      {adding && (
        <Card C={C} style={{ marginBottom: 20, border: `2px dashed ${C.accent}` }}>
          <SectionTitle C={C}>Add Exam</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Data Structures" style={{ ...inputStyle(C), marginTop: 4 }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Exam Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Topics / Units (one per line)</label>
            <textarea value={form.topicsStr} onChange={e => setForm(f => ({ ...f, topicsStr: e.target.value }))}
              placeholder={"Unit 1: Arrays & Linked Lists\nUnit 2: Trees & Graphs\nUnit 3: Sorting & Searching"}
              style={{ ...inputStyle(C), marginTop: 4, minHeight: 100, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addExam} style={btnPrimary(C)}>Add Exam</button>
            <button onClick={() => setAdding(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Selected exam detail */}
      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} style={{ ...btnGhost(C), marginBottom: 16 }}>← Back to exams</button>
          <Card C={C}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.subject}</div>
                {selected.date && <div style={{ fontSize: 12, color: C.muted }}>Exam: {fmtDate(selected.date)}</div>}
              </div>
              <button onClick={() => deleteExam(selected.id)} style={{ ...btnGhost(C), color: C.danger, borderColor: C.danger, fontSize: 11 }}>Delete</button>
            </div>

            {/* Progress */}
            {(() => {
              const exam = state.exams.find(e => e.id === selected.id) || selected;
              const done = exam.topics.filter(t => t.done).length;
              const total = exam.topics.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Syllabus Completion</span>
                    <span style={{ color: C.accent, fontWeight: 600 }}>{done}/{total} · {pct}%</span>
                  </div>
                  <ProgressBar value={pct} C={C} height={10} color={pct === 100 ? C.success : C.accent} />
                </div>
              );
            })()}

            {/* Topics */}
            <SectionTitle C={C}>Topics</SectionTitle>
            {(state.exams.find(e => e.id === selected.id)?.topics || []).map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTopic(selected.id, t.id)}
                  style={{ accentColor: C.accent, width: 16, height: 16 }} />
                <span style={{ flex: 1, fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.muted : C.text }}>{t.name}</span>
                <button onClick={() => deleteTopic(selected.id, t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14 }}>×</button>
              </div>
            ))}

            {/* Add topic inline */}
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { addTopic(selected.id, newTopic); setNewTopic(""); } }}
                placeholder="Add a topic…" style={{ ...inputStyle(C), flex: 1, fontSize: 12 }} />
              <button onClick={() => { addTopic(selected.id, newTopic); setNewTopic(""); }}
                style={{ ...btnPrimary(C), padding: "6px 12px", fontSize: 11 }}>+</button>
            </div>
          </Card>
        </div>
      ) : (
        /* Exam cards */
        sorted.length === 0 ? (
          <Card C={C}><EmptyState icon="◇" title="No exams added" subtitle="Add your first exam and start tracking preparation!" C={C} /></Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {sorted.map(exam => {
              const done = exam.topics.filter(t => t.done).length;
              const total = exam.topics.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const daysLeft = exam.date ? Math.ceil((new Date(exam.date) - new Date()) / 86400000) : null;
              return (
                <Card key={exam.id} C={C} onClick={() => setSelected(exam)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{exam.subject}</div>
                    {daysLeft !== null && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: daysLeft <= 3 ? C.danger : daysLeft <= 7 ? C.warning : C.muted }}>
                        {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Today!" : "Past"}
                      </span>
                    )}
                  </div>
                  {exam.date && <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{fmtDate(exam.date)}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: C.muted }}>{done}/{total} topics</span>
                    <span style={{ color: pct === 100 ? C.success : C.accent, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} C={C} height={6} color={pct === 100 ? C.success : C.accent} />
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
