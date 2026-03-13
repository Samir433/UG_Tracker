import { useState } from "react";
import { Card, SectionTitle, PageHeader, EmptyState, Pill, uid, toKey, todayKey, fmtDate, inputStyle, btnPrimary, btnGhost } from "../shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PLATFORMS = ["LeetCode", "Codeforces", "HackerRank", "GeeksForGeeks", "Other"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFF_COLORS = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

export default function CodingPractice({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ platform: "LeetCode", difficulty: "Medium", count: 1, notes: "", date: todayKey() });

  const addLog = () => {
    if (form.count < 1) return;
    const log = { id: uid(), ...form, count: +form.count };
    update({ codingLogs: [...state.codingLogs, log] });
    setForm({ platform: "LeetCode", difficulty: "Medium", count: 1, notes: "", date: todayKey() });
    setAdding(false);
  };

  const deleteLog = (id) => update({ codingLogs: state.codingLogs.filter(l => l.id !== id) });

  const logs = [...state.codingLogs].sort((a, b) => b.date.localeCompare(a.date));
  const totalProblems = logs.reduce((a, l) => a + l.count, 0);

  // Weekly chart data — last 8 weeks
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const ws = toKey(weekStart), we = toKey(weekEnd);
    const count = logs.filter(l => l.date >= ws && l.date <= we).reduce((a, l) => a + l.count, 0);
    weeklyData.push({ week: `W${8 - i}`, count });
  }

  // Platform breakdown
  const platformCounts = {};
  logs.forEach(l => { platformCounts[l.platform] = (platformCounts[l.platform] || 0) + l.count; });

  return (
    <div>
      <PageHeader title="Coding Practice" subtitle="Track your problem-solving journey" C={C} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: C.accent }}>{totalProblems}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Total Problems</div>
        </Card>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: C.success }}>{logs.length}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Sessions</div>
        </Card>
        <Card C={C} style={{ textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 24, fontWeight: 300, color: C.warning }}>{logs.length > 0 ? (totalProblems / logs.length).toFixed(1) : "—"}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 4 }}>Avg/Session</div>
        </Card>
      </div>

      {/* Chart */}
      <Card C={C} style={{ marginBottom: 20 }}>
        <SectionTitle C={C}>Weekly Activity</SectionTitle>
        {totalProblems > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Start logging to see your chart!</div>
        )}
      </Card>

      {/* Add Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setAdding(v => !v)} style={btnPrimary(C)}>+ Log Practice</button>
      </div>

      {/* Add Form */}
      {adding && (
        <Card C={C} style={{ marginBottom: 20, border: `2px dashed ${C.accent}` }}>
          <SectionTitle C={C}>Log Coding Practice</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Problems Solved</label>
              <input type="number" min={1} value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle(C), marginTop: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Topics covered, approaches learned…"
              style={{ ...inputStyle(C), marginTop: 4, minHeight: 60, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addLog} style={btnPrimary(C)}>Save</button>
            <button onClick={() => setAdding(false)} style={btnGhost(C)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Log entries */}
      <Card C={C}>
        <SectionTitle C={C}>Practice Log</SectionTitle>
        {logs.length === 0 ? (
          <EmptyState icon="⌨" title="No practice logged" subtitle="Start solving and track your progress!" C={C} />
        ) : (
          logs.slice(0, 20).map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.accent }}>
                {l.count}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.platform}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(l.date)}{l.notes ? ` · ${l.notes.slice(0, 40)}` : ""}</div>
              </div>
              <Pill label={l.difficulty} color={DIFF_COLORS[l.difficulty]} bg={DIFF_COLORS[l.difficulty] + "22"} />
              <button onClick={() => deleteLog(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>×</button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
