import { useState } from "react";
import { Card, SectionTitle, PageHeader, ProgressBar, Pill, todayKey, fmtDate, uid, inputStyle, btnPrimary } from "../shared";

export default function Dashboard({ state, update, C }) {
  const dk = todayKey();
  const checkin = state.dailyCheckins[dk] || { coding: false, study: false, project: false, health: false };
  const completedSems = Object.values(state.semesters).filter(s => s.completed).length;
  const degreeProgress = Math.round((completedSems / 8) * 100);
  const currentSem = state.profile.currentSemester || 1;

  const toggleCheckin = (field) => {
    const updated = { ...checkin, [field]: !checkin[field] };
    update({ dailyCheckins: { ...state.dailyCheckins, [dk]: updated } });
  };

  const checkinItems = [
    { key: "coding", label: "Coding Practice", icon: "⌨" },
    { key: "study", label: "Study Session", icon: "📖" },
    { key: "project", label: "Project Work", icon: "🔧" },
    { key: "health", label: "Health / Gym", icon: "💪" },
  ];
  const checkinDone = checkinItems.filter(c => checkin[c.key]).length;

  // Recent coding
  const recentCoding = state.codingLogs.slice(-7);
  const totalProblems = state.codingLogs.reduce((a, l) => a + (l.count || 0), 0);
  const activeProjects = state.projects.filter(p => p.status === "In Progress").length;
  const pendingInternships = state.internships.filter(i => i.status === "Applied" || i.status === "Interview").length;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
          {fmtDate(new Date())}
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {state.profile.name}.
        </h1>
      </div>

      {/* Degree Progress */}
      <Card C={C} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <SectionTitle C={C}>Degree Progress</SectionTitle>
            <div style={{ fontSize: 13, color: C.text, marginTop: -8 }}>
              Semester <strong>{currentSem}</strong> of 8 · Year {Math.ceil(currentSem / 2)}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, color: C.accent }}>{degreeProgress}%</div>
        </div>
        <ProgressBar value={degreeProgress} C={C} height={8} />
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {[1,2,3,4,5,6,7,8].map(s => (
            <div key={s} style={{
              width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              background: state.semesters[s]?.completed ? C.accent : s === currentSem ? C.accentBg : (C.dm ? "#222" : "#f0efec"),
              color: state.semesters[s]?.completed ? "#fff" : s === currentSem ? C.accent : C.muted,
              border: s === currentSem ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
            }}>S{s}</div>
          ))}
        </div>
      </Card>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Problems Solved", value: totalProblems, color: C.accent },
          { label: "Active Projects", value: activeProjects, color: C.success },
          { label: "Pending Apps", value: pendingInternships, color: C.warning },
          { label: "Skills Tracked", value: state.skills.length, color: "#8b5cf6" },
        ].map((s, i) => (
          <Card key={i} C={C} style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 26, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginTop: 6 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Quick Actions */}
        <Card C={C}>
          <SectionTitle C={C}>Quick Actions</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Log Coding", page: "coding", icon: "⌨" },
              { label: "Add Project", page: "projects", icon: "▦" },
              { label: "Weekly Reflection", page: "reflections", icon: "✎" },
              { label: "Add Internship", page: "internships", icon: "◉" },
            ].map((action, i) => (
              <button key={i} onClick={() => window.__setPage?.(action.page)} style={{
                background: C.dm ? "#222220" : "#f9f8f5", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "12px", cursor: "pointer", textAlign: "left",
                transition: "background 0.2s", color: C.text,
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{action.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{action.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Today's Check-in */}
        <Card C={C}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionTitle C={C}>Today's Check-in</SectionTitle>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{checkinDone}/4</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {checkinItems.map(item => (
              <label key={item.key} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: checkin[item.key] ? (C.dm ? "#1a2e1a" : "#f0fdf4") : (C.dm ? "#1c1c1a" : "#fafaf8"),
                borderRadius: 8, cursor: "pointer", border: `1px solid ${checkin[item.key] ? C.success : C.border}`,
                transition: "all 0.2s",
              }}>
                <input type="checkbox" checked={checkin[item.key]} onChange={() => toggleCheckin(item.key)}
                  style={{ accentColor: C.success, width: 16, height: 16 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: checkin[item.key] ? C.success : C.text }}>
                  {item.icon} {item.label}
                </span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card C={C}>
        <SectionTitle C={C}>Recent Coding Activity</SectionTitle>
        {recentCoding.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, padding: "16px 0" }}>No coding practice logged yet. Start logging!</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {recentCoding.map((log, i) => {
              const maxC = Math.max(...recentCoding.map(l => l.count || 1), 1);
              const h = Math.max(((log.count || 1) / maxC) * 50, 4);
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: h, background: C.accent, borderRadius: 4, marginBottom: 4, transition: "height 0.3s" }}
                    title={`${log.count} problems on ${log.platform}`} />
                  <div style={{ fontSize: 8, color: C.muted }}>{fmtDate(log.date).split(" ").slice(0, 2).join(" ")}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
