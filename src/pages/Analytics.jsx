import { Card, SectionTitle, PageHeader, ProgressBar, toKey, EmptyState } from "../shared";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Analytics({ state, C }) {
  const codingLogs = state.codingLogs || [];
  const totalProblems = codingLogs.reduce((a, l) => a + (l.count || 0), 0);

  // Weekly coding chart — last 12 weeks
  const weeklyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const ws = toKey(weekStart), we = toKey(weekEnd);
    const count = codingLogs.filter(l => l.date >= ws && l.date <= we).reduce((a, l) => a + l.count, 0);
    weeklyData.push({ week: `W${12 - i}`, count });
  }

  // Daily activity heatmap — last 90 days
  const activityMap = {};
  codingLogs.forEach(l => { activityMap[l.date] = (activityMap[l.date] || 0) + l.count; });
  Object.keys(state.dailyCheckins || {}).forEach(dk => {
    const c = state.dailyCheckins[dk];
    const score = [c.coding, c.study, c.project, c.health].filter(Boolean).length;
    activityMap[dk] = (activityMap[dk] || 0) + score;
  });

  const heatmapDays = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dk = toKey(d);
    heatmapDays.push({ date: dk, count: activityMap[dk] || 0, dayName: d.toLocaleDateString("en-IN", { weekday: "narrow" }) });
  }
  const maxActivity = Math.max(...heatmapDays.map(d => d.count), 1);

  const getHeatColor = (count) => {
    if (count === 0) return C.dm ? "#222220" : "#eeedea";
    const ratio = count / maxActivity;
    if (ratio < 0.25) return C.dm ? "#1e3a5f" : "#dbeafe";
    if (ratio < 0.5) return C.dm ? "#1e40af" : "#93c5fd";
    if (ratio < 0.75) return "#3b82f6";
    return "#1d4ed8";
  };

  // Skill growth
  const skillData = (state.skills || []).map(s => ({ name: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name, level: s.level }));

  // Goals per semester
  const semGoalData = Object.entries(state.semesters || {}).map(([id, sem]) => {
    const total = (sem.goals || []).length;
    const done = (sem.goals || []).filter(g => g.done).length;
    return { name: `S${id}`, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  // Checkin streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dk = toKey(d);
    const c = state.dailyCheckins?.[dk];
    if (c && (c.coding || c.study || c.project || c.health)) streak++;
    else break;
  }

  const CHART_TICK = { fontSize: 10, fill: C.muted };
  const TT_STYLE = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Visual insights into your engineering journey" C={C} />

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Problems Solved", value: totalProblems, color: C.accent },
          { label: "Projects", value: (state.projects || []).length, color: C.success },
          { label: "Reflections", value: (state.reflections || []).length, color: "#8b5cf6" },
          { label: "Day Streak", value: streak, color: C.warning },
        ].map((s, i) => (
          <Card key={i} C={C} style={{ textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: 24, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginTop: 6 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Weekly Coding */}
      <Card C={C} style={{ marginBottom: 16 }}>
        <SectionTitle C={C}>Coding Problems per Week</SectionTitle>
        {totalProblems > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={CHART_TICK} />
              <YAxis allowDecimals={false} tick={CHART_TICK} />
              <Tooltip contentStyle={TT_STYLE} />
              <Bar dataKey="count" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>No coding data yet</div>
        )}
      </Card>

      {/* Activity Heatmap */}
      <Card C={C} style={{ marginBottom: 16 }}>
        <SectionTitle C={C}>Activity Heatmap — Last 90 Days</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {heatmapDays.map((d, i) => (
            <div key={i} title={`${d.date}: ${d.count} activities`} style={{
              width: 12, height: 12, borderRadius: 2, background: getHeatColor(d.count),
              border: `1px solid ${C.border}`,
            }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 9, color: C.muted }}>
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: getHeatColor(r * maxActivity || (i === 0 ? 0 : 1)) }} />
          ))}
          <span>More</span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Skill Levels */}
        <Card C={C}>
          <SectionTitle C={C}>Skill Levels</SectionTitle>
          {skillData.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {skillData.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span>{s.name}</span><span style={{ color: C.accent, fontWeight: 600 }}>{s.level}%</span>
                  </div>
                  <ProgressBar value={s.level} C={C} height={5} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>No skills tracked</div>
          )}
        </Card>

        {/* Goals per semester */}
        <Card C={C}>
          <SectionTitle C={C}>Goals Completed by Semester</SectionTitle>
          {semGoalData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={semGoalData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={CHART_TICK} />
                <YAxis allowDecimals={false} tick={CHART_TICK} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="done" fill={C.success} radius={[4, 4, 0, 0]} name="Done" />
                <Bar dataKey="total" fill={C.dm ? "#333" : "#e5e7eb"} radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Add goals in Timeline first</div>
          )}
        </Card>
      </div>
    </div>
  );
}
