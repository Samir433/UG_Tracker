import { useState, useEffect, useCallback } from "react";

// ── Helpers ──
export const uid = () => Math.random().toString(36).slice(2, 9);
export const toKey = (d) => d.toISOString().split("T")[0];
export const todayKey = () => toKey(new Date());
export const weekKey = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
};
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

// ── Storage ──
const STORE_KEY = "ug-tracker-v3";

export const defaultState = () => ({
  profile: { name: "Student", startDate: "", currentSemester: 1 },
  semesters: {
    1: { name: "Semester 1", year: 1, goals: [], completed: false },
    2: { name: "Semester 2", year: 1, goals: [], completed: false },
    3: { name: "Semester 3", year: 2, goals: [], completed: false },
    4: { name: "Semester 4", year: 2, goals: [], completed: false },
    5: { name: "Semester 5", year: 3, goals: [], completed: false },
    6: { name: "Semester 6", year: 3, goals: [], completed: false },
    7: { name: "Semester 7", year: 4, goals: [], completed: false },
    8: { name: "Semester 8", year: 4, goals: [], completed: false },
  },
  dailyCheckins: {},
  codingLogs: [],
  skills: [
    { id: uid(), name: "C++", level: 0, category: "Language" },
    { id: uid(), name: "Python", level: 0, category: "Language" },
    { id: uid(), name: "Data Structures", level: 0, category: "Core" },
    { id: uid(), name: "Algorithms", level: 0, category: "Core" },
    { id: uid(), name: "Web Development", level: 0, category: "Domain" },
    { id: uid(), name: "Machine Learning", level: 0, category: "Domain" },
  ],
  projects: [],
  internships: [],
  reflections: [],
  exams: [],
  settings: { darkMode: false },
});

export function useAppState() {
  const [state, setState] = useState(defaultState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((ns) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(ns)); } catch {}
  }, []);

  const update = useCallback((patch) => {
    setState((s) => {
      const ns = { ...s, ...patch };
      save(ns);
      return ns;
    });
  }, [save]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ug-tracker-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      setState(data);
      save(data);
      return true;
    } catch { return false; }
  }, [save]);

  return { state, update, loaded, exportData, importData };
}

// ── Theme ──
export function useTheme(darkMode) {
  return darkMode
    ? {
        bg: "#111110", card: "#1c1c1a", border: "#2a2a28", text: "#e8e6e1",
        muted: "#777", accent: "#818cf8", accentBg: "#1e1b4b", accentLight: "#312e81",
        success: "#34d399", warning: "#fbbf24", danger: "#f87171", dm: true,
      }
    : {
        bg: "#f8f7f4", card: "#ffffff", border: "#e8e5df", text: "#1a1a1a",
        muted: "#9a9a9a", accent: "#4f46e5", accentBg: "#eef2ff", accentLight: "#e0e7ff",
        success: "#10b981", warning: "#f59e0b", danger: "#ef4444", dm: false,
      };
}

// ── Shared UI Components ──
export function Card({ children, C, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "20px 22px", cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.2s",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, C }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, C }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}>{title}</h1>
      {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted, fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

export function ProgressBar({ value, color, bg, height = 6, C }) {
  return (
    <div style={{ background: bg || (C?.dm ? "#2a2a28" : "#e5e7eb"), borderRadius: height, height, overflow: "hidden" }}>
      <div style={{ width: `${clamp(value, 0, 100)}%`, background: color || "#4f46e5", height, borderRadius: height, transition: "width 0.4s ease" }} />
    </div>
  );
}

export function Pill({ label, color = "#4f46e5", bg = "#eef2ff" }) {
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20 }}>
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, subtitle, C }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: C.text }}>{title}</div>
      <div style={{ fontSize: 12 }}>{subtitle}</div>
    </div>
  );
}

export const inputStyle = (C) => ({
  fontFamily: "'Inter', sans-serif", background: C.dm ? "#222220" : "#f5f4f1",
  border: `1px solid ${C.border}`, padding: "9px 12px", fontSize: 13,
  color: C.text, borderRadius: 8, outline: "none", width: "100%",
  transition: "border-color 0.2s",
});

export const btnPrimary = (C) => ({
  background: C.accent, color: "#fff", border: "none", padding: "9px 18px",
  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  borderRadius: 8, transition: "opacity 0.2s",
});

export const btnGhost = (C) => ({
  background: "none", border: `1px solid ${C.border}`, padding: "8px 16px",
  fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  color: C.muted, borderRadius: 8, transition: "background 0.2s",
});

// ── Nav Items ──
export const NAV_ITEMS = [
  { id: "dashboard", icon: "◫", label: "Dashboard" },
  { id: "timeline", icon: "◔", label: "Timeline" },
  { id: "coding", icon: "⌨", label: "Coding Practice" },
  { id: "skills", icon: "◈", label: "Skills" },
  { id: "projects", icon: "▦", label: "Projects" },
  { id: "internships", icon: "◉", label: "Internships" },
  { id: "reflections", icon: "✎", label: "Reflections" },
  { id: "exams", icon: "◇", label: "Exam Mode" },
  { id: "analytics", icon: "∿", label: "Analytics" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

// ── CSS Reset ──
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', sans-serif; }
  textarea, input, select, button { font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ccc8be; border-radius: 3px; }
  button:hover { opacity: 0.85; }
  button:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
  input:focus, textarea:focus, select:focus { border-color: #4f46e5 !important; }
`;
