import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const startOfWeek = (d) => { const r = new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate() - ((r.getDay()+6)%7)); return r; };
const toKey = (d) => d.toISOString().split("T")[0];
const todayKey = () => toKey(new Date());
const fmt = (d, opts={month:"short",day:"numeric"}) => new Date(d).toLocaleDateString("en-IN", opts);
const fmtFull = (d) => new Date(d).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"});
const weekKey = (si, wi) => `${si}-${wi}`;
const uid = () => Math.random().toString(36).slice(2,9);
const clamp = (v,a,b) => Math.min(Math.max(v,a),b);

const SCORE_COLORS_SEM = ["#e9e5dc","#ffd5d5","#fde68a","#86efac","#22c55e","#14532d"];
const SCORE_COLORS_HOL = ["#e9e5dc","#dbeafe","#93c5fd","#3b82f6","#1d4ed8","#1e3a8a"];
const scoreColor = (score, isHol) => (isHol ? SCORE_COLORS_HOL : SCORE_COLORS_SEM)[score ?? 0];
const scoreBg = (score) => ["#f5f3ef","#fee2e2","#fef3c7","#dcfce7","#bbf7d0","#86efac"][score ?? 0];

const SEGMENTS = [
  {label:"Semester 1",sem:1,year:1,holiday:false,weeks:18},
  {label:"Winter Break",sem:null,year:1,holiday:true,weeks:4},
  {label:"Semester 2",sem:2,year:1,holiday:false,weeks:18},
  {label:"Summer Break",sem:null,year:1,holiday:true,weeks:8},
  {label:"Semester 3",sem:3,year:2,holiday:false,weeks:18},
  {label:"Winter Break",sem:null,year:2,holiday:true,weeks:4},
  {label:"Semester 4",sem:4,year:2,holiday:false,weeks:18},
  {label:"Summer Break",sem:null,year:2,holiday:true,weeks:8},
  {label:"Semester 5",sem:5,year:3,holiday:false,weeks:18},
  {label:"Winter Break",sem:null,year:3,holiday:true,weeks:4},
  {label:"Semester 6",sem:6,year:3,holiday:false,weeks:18},
  {label:"Summer Break",sem:null,year:3,holiday:true,weeks:8},
  {label:"Semester 7",sem:7,year:4,holiday:false,weeks:18},
  {label:"Winter Break",sem:null,year:4,holiday:true,weeks:4},
  {label:"Semester 8",sem:8,year:4,holiday:false,weeks:18},
];

function buildCalendar(startDate) {
  const segs = [];
  let cursor = startOfWeek(new Date(startDate));
  SEGMENTS.forEach((tmpl, si) => {
    const weeks = [];
    let wc = new Date(cursor);
    for (let w = 0; w < tmpl.weeks; w++) {
      weeks.push({ start: new Date(wc), end: addDays(wc, 6) });
      wc = addDays(wc, 7);
    }
    segs.push({ ...tmpl, si, weeks, start: new Date(cursor), end: addDays(cursor, tmpl.weeks*7-1) });
    cursor = addDays(cursor, tmpl.weeks*7);
  });
  return segs;
}

const STORE_KEY = "ug-tracker-v2";
const VISITOR_KEY = "ug-tracker-visitors";
const COUNTER_NS = "ugtracker-netlify";
const COUNTER_NAME = "visits";

// ═══════════════════════════════════════════════════════════
// VISITOR TRACKING
// ═══════════════════════════════════════════════════════════
function useVisitorStats() {
  const [stats, setStats] = useState({ total: null, today: 0, daily: [] });

  useEffect(() => {
    // Load local daily visit log
    let visitLog = {};
    try {
      const raw = localStorage.getItem(VISITOR_KEY);
      if (raw) visitLog = JSON.parse(raw);
    } catch {}

    const todayStr = todayKey();

    // Record this visit in local daily log
    const alreadyCounted = sessionStorage.getItem("ug-visit-counted");
    if (!alreadyCounted) {
      visitLog[todayStr] = (visitLog[todayStr] || 0) + 1;
      try {
        localStorage.setItem(VISITOR_KEY, JSON.stringify(visitLog));
        sessionStorage.setItem("ug-visit-counted", "1");
      } catch {}
    }

    // Build last 7 days data
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = toKey(d);
      daily.push({ day: d.toLocaleDateString("en-IN", { weekday: "short" }), count: visitLog[dk] || 0 });
    }

    const todayCount = visitLog[todayStr] || 0;

    // Fetch + increment global counter (once per session)
    const endpoint = alreadyCounted
      ? `https://api.counterapi.dev/v1/${COUNTER_NS}/${COUNTER_NAME}`
      : `https://api.counterapi.dev/v1/${COUNTER_NS}/${COUNTER_NAME}/up`;

    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        setStats({ total: data.count || 0, today: todayCount, daily });
      })
      .catch(() => {
        // Fallback: just use local data
        const allTimeLocal = Object.values(visitLog).reduce((a, b) => a + b, 0);
        setStats({ total: allTimeLocal, today: todayCount, daily });
      });
  }, []);

  return stats;
}
const QUOTES = [
  { text: "The question is not whether you'll be distracted. The question is whether you'll notice, and what you'll do next.", author: "Oliver Burkeman" },
  { text: "You don't rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
];

const NAV_ITEMS = [
  { id:"dashboard", icon:"⬛", label:"Dashboard" },
  { id:"tasks", icon:"✓", label:"Daily Tasks" },
  { id:"weekly", icon:"≋", label:"Weekly Planner" },
  { id:"milestones", icon:"◎", label:"Monthly Milestones" },
  { id:"semester", icon:"◑", label:"Semester Planner" },
  { id:"timeline", icon:"▤", label:"UG Timeline" },
  { id:"analytics", icon:"∿", label:"Analytics" },
  { id:"journal", icon:"✎", label:"Journal" },
  { id:"settings", icon:"⚙", label:"Settings" },
];

// ═══════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════
const defaultState = () => ({
  startDate: null,
  scores: {},       // weekKey -> 1-5
  tasks: {},        // dateKey -> Task[]
  weekly: {},       // weekKey -> { goals, reflection, score }
  milestones: [],   // Milestone[]
  semesters: {},    // si -> { subjects, gpa, goals, assignments, exams, skills }
  journal: [],      // Entry[]
  habits: {},       // dateKey -> { coding, workout, reading, meditation }
  settings: { darkMode: false, name: "Student" },
});

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');`;

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [state, setState] = useState(defaultState());
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setState(s => ({ ...s, ...JSON.parse(raw) }));
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((newState) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(newState)); } catch {}
  }, []);

  const update = useCallback((patch) => {
    setState(s => {
      const ns = { ...s, ...patch };
      save(ns);
      return ns;
    });
  }, [save]);

  const dm = state.settings.darkMode;
  const bg = dm ? "#0f0f0f" : "#eeeae2";
  const card = dm ? "#1a1a1a" : "#ffffff";
  const border = dm ? "#2a2a2a" : "#e2ddd4";
  const text = dm ? "#e8e4dc" : "#1a1a1a";
  const muted = dm ? "#666" : "#888";
  const accent = "#2d7a36";
  const accentLight = dm ? "#1a3d1e" : "#f0faf1";

  const C = { bg, card, border, text, muted, accent, accentLight, dm };

  const segments = state.startDate ? buildCalendar(state.startDate) : null;
  const today = startOfWeek(new Date());

  if (!loaded) return <div style={{ background: bg, height: "100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", color: text }}>Loading…</div>;

  const pageProps = { state, update, segments, today, C };

  return (
    <div style={{ display:"flex", height:"100vh", background: bg, fontFamily:"'IBM Plex Mono', monospace", color: text, overflow:"hidden" }}>
      <style>{FONTS}{CSS}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 220 : 56,
        minWidth: sidebarOpen ? 220 : 56,
        background: dm ? "#111" : "#f5f2ea",
        borderRight: `1px solid ${border}`,
        display:"flex", flexDirection:"column",
        transition:"width 0.2s, min-width 0.2s",
        overflow:"hidden",
        zIndex: 10,
      }}>
        <div style={{ padding: sidebarOpen ? "24px 20px 16px" : "24px 12px 16px", borderBottom: `1px solid ${border}` }}>
          {sidebarOpen ? (
            <div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:16, lineHeight:1.2 }}>UG Life</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontStyle:"italic", fontSize:13, color: accent }}>Tracker</div>
            </div>
          ) : (
            <div style={{ fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:14 }}>UG</div>
          )}
        </div>
        <nav style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display:"flex", alignItems:"center", gap:10,
              width:"100%", padding: sidebarOpen ? "9px 20px" : "9px 16px",
              background: page===item.id ? accentLight : "none",
              border:"none", cursor:"pointer",
              color: page===item.id ? accent : text,
              fontFamily:"'IBM Plex Mono', monospace", fontSize:11,
              letterSpacing:"0.04em",
              borderLeft: page===item.id ? `2px solid ${accent}` : "2px solid transparent",
              textAlign:"left",
              transition:"background 0.15s",
            }}>
              <span style={{ fontSize:13, opacity:0.8, minWidth:16 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px", borderTop:`1px solid ${border}` }}>
          <button onClick={() => setSidebarOpen(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", color: muted, fontFamily:"monospace", fontSize:12 }}>
            {sidebarOpen ? "◂ collapse" : "▸"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {page==="dashboard"   && <Dashboard {...pageProps} />}
        {page==="tasks"       && <DailyTasks {...pageProps} />}
        {page==="weekly"      && <WeeklyPlanner {...pageProps} />}
        {page==="milestones"  && <MonthlyMilestones {...pageProps} />}
        {page==="semester"    && <SemesterPlanner {...pageProps} />}
        {page==="timeline"    && <UGTimeline {...pageProps} />}
        {page==="analytics"   && <Analytics {...pageProps} />}
        {page==="journal"     && <Journal {...pageProps} />}
        {page==="settings"    && <Settings {...pageProps} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
function PageHeader({ title, subtitle, C }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin:0, fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:26 }}>{title}</h1>
      {subtitle && <p style={{ margin:"6px 0 0", fontSize:11, color:C.muted, letterSpacing:"0.06em" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, C, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border:`1px solid ${C.border}`,
      borderRadius: 8, padding:"18px 20px",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, C }) {
  return (
    <Card C={C} style={{ textAlign:"center" }}>
      <div style={{ fontSize:30, fontWeight:300, color: color||C.accent, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted, marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{sub}</div>}
    </Card>
  );
}

function ProgressBar({ value, color="#2d7a36", bg="#e5e7eb", height=6 }) {
  return (
    <div style={{ background:bg, borderRadius:height, height, overflow:"hidden" }}>
      <div style={{ width:`${clamp(value,0,100)}%`, background:color, height, borderRadius:height, transition:"width 0.3s" }} />
    </div>
  );
}

function Pill({ label, color="#2d7a36", bg="#f0faf1" }) {
  return <span style={{ background:bg, color, fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", padding:"2px 8px", borderRadius:20, fontWeight:500 }}>{label}</span>;
}

// ═══════════════════════════════════════════════════════════
// DAILY HEATMAP
// ═══════════════════════════════════════════════════════════
const DAY_COMPLETION_COLORS = [
  { min: 0,   max: 0,   bg: null },           // no tasks
  { min: 1,   max: 24,  bg: "#d1fae5" },      // 1-24%
  { min: 25,  max: 49,  bg: "#86efac" },      // 25-49%
  { min: 50,  max: 74,  bg: "#22c55e" },      // 50-74%
  { min: 75,  max: 99,  bg: "#15803d" },      // 75-99%
  { min: 100, max: 100, bg: "#14532d" },      // 100%
];

function getDayColor(pct, hasTasks) {
  if (!hasTasks) return null;
  return DAY_COMPLETION_COLORS.find(c => pct >= c.min && pct <= c.max)?.bg || null;
}

function DailyHeatmap({ tasks, C }) {
  const [tooltip, setTooltip] = useState(null);

  // Build last 52 weeks (364 days) grid, starting from Monday
  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const gridStart = new Date(todayD);
  // go back to nearest Monday 52 weeks ago
  gridStart.setDate(gridStart.getDate() - 363);
  const dayOfWeek = (gridStart.getDay() + 6) % 7; // 0=Mon
  gridStart.setDate(gridStart.getDate() - dayOfWeek);

  // Build 7 rows × N cols grid
  const totalDays = Math.ceil((todayD - gridStart) / 86400000) + 1;
  const numCols = Math.ceil(totalDays / 7);

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Pre-compute completion for every date key
  const compMap = {};
  Object.entries(tasks).forEach(([dk, ts]) => {
    if (!ts.length) return;
    const pct = Math.round(ts.filter(t=>t.done).length / ts.length * 100);
    compMap[dk] = { pct, done: ts.filter(t=>t.done).length, total: ts.length };
  });

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", gap:6, overflowX:"auto", paddingBottom:4 }}>
        {/* Day labels */}
        <div style={{ display:"flex", flexDirection:"column", gap:2, paddingTop:18 }}>
          {DAYS.map((d,i) => (
            <div key={d} style={{ height:13, fontSize:8, color:C.muted, letterSpacing:"0.06em", lineHeight:"13px", opacity: i%2===0?1:0 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex:1 }}>
          {/* Month labels */}
          <div style={{ display:"flex", gap:2, marginBottom:3, height:14 }}>
            {Array.from({length: numCols}).map((_,ci) => {
              const d = new Date(gridStart);
              d.setDate(d.getDate() + ci*7);
              const isFirstOfMonth = d.getDate() <= 7;
              return (
                <div key={ci} style={{ width:13, fontSize:8, color:C.muted, letterSpacing:"0.04em", overflow:"visible", whiteSpace:"nowrap" }}>
                  {isFirstOfMonth ? d.toLocaleDateString("en-IN",{month:"short"}) : ""}
                </div>
              );
            })}
          </div>

          {/* Squares grid — cols of 7 rows */}
          <div style={{ display:"flex", gap:2 }}>
            {Array.from({length: numCols}).map((_,ci) => (
              <div key={ci} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {Array.from({length:7}).map((_,ri) => {
                  const d = new Date(gridStart);
                  d.setDate(d.getDate() + ci*7 + ri);
                  if (d > todayD) return <div key={ri} style={{width:13,height:13}}/>;
                  const dk = toKey(d);
                  const comp = compMap[dk];
                  const isToday = dk === toKey(todayD);
                  const color = comp ? getDayColor(comp.pct, true) : null;

                  return (
                    <div
                      key={ri}
                      style={{
                        width:13, height:13, borderRadius:2,
                        background: color || (C.dm?"#222":"#e5e2d9"),
                        border: isToday ? "1.5px solid #1a1a1a" : `1px solid ${C.border}`,
                        cursor: comp ? "pointer" : "default",
                        position:"relative",
                        transition:"transform 0.1s",
                        flexShrink:0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "scale(1.5)";
                        setTooltip({ dk, comp, isToday, rect: e.currentTarget.getBoundingClientRect() });
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "scale(1)";
                        setTooltip(null);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, fontSize:9, color:C.muted }}>
        <span>Less</span>
        <div style={{width:13,height:13,borderRadius:2,background:C.dm?"#222":"#e5e2d9",border:`1px solid ${C.border}`}}/>
        {["#d1fae5","#86efac","#22c55e","#15803d","#14532d"].map(c=>(
          <div key={c} style={{width:13,height:13,borderRadius:2,background:c,border:`1px solid ${C.border}`}}/>
        ))}
        <span>More</span>
        <span style={{marginLeft:8,opacity:0.6}}>— based on daily task completion %</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"fixed",
          top: (tooltip.rect?.top||0) - 60,
          left: (tooltip.rect?.left||0) - 30,
          background:"#1a1a1a", color:"#fff",
          padding:"6px 10px", borderRadius:4, fontSize:10,
          pointerEvents:"none", zIndex:9999,
          fontFamily:"'IBM Plex Mono', monospace",
          whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,0.3)",
        }}>
          <div style={{marginBottom:2, opacity:0.7}}>{new Date(tooltip.dk).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>
          {tooltip.comp
            ? <div><strong>{tooltip.comp.done}/{tooltip.comp.total}</strong> tasks · <strong style={{color:"#86efac"}}>{tooltip.comp.pct}%</strong> done</div>
            : <div style={{opacity:0.6}}>No tasks</div>
          }
          {tooltip.isToday && <div style={{color:"#fbbf24",marginTop:2}}>← today</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function Dashboard({ state, update, segments, today, C }) {
  const [scoringWk, setScoringWk] = useState(null);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const visitorStats = useVisitorStats();

  let elapsed=0, total=0, scored=0, scoreSum=0, currentSem=null;
  if (segments) {
    segments.forEach((seg, si) => {
      seg.weeks.forEach((wk, wi) => {
        total++;
        if (wk.start <= today) {
          elapsed++;
          if (wk.start.getTime()===today.getTime() && !seg.holiday && seg.sem) currentSem = seg.label;
        }
        const s = state.scores[weekKey(si,wi)];
        if (s) { scored++; scoreSum+=s; }
      });
    });
  }
  const avg = scored>0 ? (scoreSum/scored).toFixed(1) : "—";
  const todayTasks = (state.tasks[todayKey()]||[]).slice(0,5);
  const doneTasks = todayTasks.filter(t=>t.done).length;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", fontStyle:"italic", fontSize:13, color:C.muted, marginBottom:4 }}>
          {fmt(new Date(), {weekday:"long",month:"long",day:"numeric",year:"numeric"})}
        </div>
        <h1 style={{ margin:0, fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:28 }}>
          Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {state.settings.name}.
        </h1>
      </div>

      {!state.startDate && (
        <Card C={C} style={{ marginBottom:24, border:`1.5px dashed ${C.accent}`, background:C.accentLight }}>
          <div style={{ fontSize:11, color:C.accent, letterSpacing:"0.08em" }}>
            ⚙ Go to <strong>Settings</strong> to set your UG start date and begin tracking your journey.
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="Weeks Completed" value={elapsed||"—"} C={C} />
        <StatCard label="Weeks Remaining" value={total-elapsed||"—"} C={C} />
        <StatCard label="Avg Productivity" value={avg} C={C} color="#2d7a36" />
        <StatCard label="Current Semester" value={currentSem?.replace("Semester ","")||"—"} sub={currentSem} C={C} />
      </div>

      {/* Heatmap */}
      {segments && (
        <Card C={C} style={{ marginBottom:24 }}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>
            4-Year Productivity Heatmap
          </div>
          <MiniHeatmap segments={segments} today={today} scores={state.scores} onScore={(si,wi)=>setScoringWk({si,wi})} C={C} />
          <div style={{ marginTop:10, display:"flex", gap:16, alignItems:"center", fontSize:"9px", color:C.muted, flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:3, alignItems:"center" }}>
              {[0,1,2,3,4,5].map(s=><div key={s} style={{width:11,height:11,background:scoreColor(s,false),border:`1px solid ${C.border}`,borderRadius:2}}/>)}
              <span style={{marginLeft:4}}>Semester (score 0–5)</span>
            </div>
            <div style={{ display:"flex", gap:3, alignItems:"center" }}>
              {[0,1,2,3,4,5].map(s=><div key={s} style={{width:11,height:11,background:scoreColor(s,true),border:`1px solid ${C.border}`,borderRadius:2}}/>)}
              <span style={{marginLeft:4}}>Holiday</span>
            </div>
          </div>
        </Card>
      )}

      {/* Daily Heatmap */}
      <Card C={C} style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted }}>
            Daily Task Completion — Last 52 Weeks
          </div>
          {(() => {
            const dk = todayKey();
            const ts = state.tasks[dk]||[];
            const done = ts.filter(t=>t.done).length;
            const pct = ts.length>0 ? Math.round(done/ts.length*100) : null;
            return pct!==null ? (
              <div style={{ fontSize:10, color:C.accent, fontWeight:500 }}>
                Today: {done}/{ts.length} · {pct}%
              </div>
            ) : null;
          })()}
        </div>
        <DailyHeatmap tasks={state.tasks} C={C} />
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        {/* Today's Tasks */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>
            Today's Tasks
          </div>
          {todayTasks.length===0 ? (
            <div style={{ fontSize:11, color:C.muted }}>No tasks for today. Add some!</div>
          ) : (
            <>
              {todayTasks.map(t => (
                <div key={t.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:t.done?"#22c55e":t.priority==="high"?"#ef4444":t.priority==="medium"?"#f59e0b":"#94a3b8", flexShrink:0 }} />
                  <span style={{ fontSize:11, color:t.done?C.muted:C.text, textDecoration:t.done?"line-through":"none", flex:1 }}>{t.title}</span>
                </div>
              ))}
              <div style={{ marginTop:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.muted, marginBottom:4 }}>
                  <span>{doneTasks}/{todayTasks.length} done</span>
                  <span>{todayTasks.length>0?Math.round(doneTasks/todayTasks.length*100):0}%</span>
                </div>
                <ProgressBar value={todayTasks.length>0?doneTasks/todayTasks.length*100:0} />
              </div>
            </>
          )}
        </Card>

        {/* Milestones */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>
            Active Milestones
          </div>
          {state.milestones.filter(m=>m.progress<100).slice(0,4).map(m => (
            <div key={m.id} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:11 }}>{m.title}</span>
                <span style={{ fontSize:10, color:C.accent }}>{m.progress}%</span>
              </div>
              <ProgressBar value={m.progress} />
            </div>
          ))}
          {state.milestones.filter(m=>m.progress<100).length===0 && (
            <div style={{ fontSize:11, color:C.muted }}>No active milestones yet.</div>
          )}
        </Card>
      </div>

      {/* Site Visitors */}
      <Card C={C} style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>
          Site Analytics
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:16, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:300, color:C.accent, lineHeight:1 }}>
              {visitorStats.total !== null ? visitorStats.total : "…"}
            </div>
            <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted, marginTop:6 }}>Total Visits</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:300, color:"#2563eb", lineHeight:1 }}>
              {visitorStats.today}
            </div>
            <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted, marginTop:6 }}>Today</div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:48 }}>
            {visitorStats.daily.map((d, i) => {
              const maxCount = Math.max(...visitorStats.daily.map(x => x.count), 1);
              const h = Math.max((d.count / maxCount) * 40, 3);
              return (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{
                    width:18, height:h, background: i === 6 ? C.accent : (C.dm ? "#333" : "#d1d5db"),
                    borderRadius:2, transition:"height 0.3s",
                  }} title={`${d.day}: ${d.count} visits`} />
                  <div style={{ fontSize:7, color:C.muted, marginTop:3 }}>{d.day.slice(0,2)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize:9, color:C.muted, marginTop:12, opacity:0.6 }}>
          Last 7 days · Tracked per browser session
        </div>
      </Card>

      {/* Quote */}
      <Card C={C} style={{ textAlign:"center", background: C.dm?"#111":C.accentLight, borderColor: C.dm?"#1a3d1e":"#bbf7d0" }}>
        <div style={{ fontFamily:"'Playfair Display', serif", fontStyle:"italic", fontSize:15, lineHeight:1.7, color:C.text, marginBottom:8 }}>
          "{quote.text}"
        </div>
        <div style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:C.muted }}>— {quote.author}</div>
      </Card>

      {/* Score modal */}
      {scoringWk && segments && (
        <ScoreModal si={scoringWk.si} wi={scoringWk.wi} segments={segments} scores={state.scores}
          onScore={(si,wi,s)=>{ update({scores:{...state.scores,[weekKey(si,wi)]:s}}); setScoringWk(null); }}
          onClear={(si,wi)=>{ const sc={...state.scores}; delete sc[weekKey(si,wi)]; update({scores:sc}); setScoringWk(null); }}
          onClose={()=>setScoringWk(null)} C={C} />
      )}
    </div>
  );
}

function MiniHeatmap({ segments, today, scores, onScore, C }) {
  return (
    <div>
      {segments.map((seg, si) => (
        <div key={si} style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, color:seg.holiday?"#7987c8":C.accent, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>
            {seg.label}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
            {seg.weeks.map((wk, wi) => {
              const s = scores[weekKey(si,wi)] ?? null;
              const isCur = wk.start.getTime()===today.getTime();
              const isPast = wk.start <= today;
              const col = isCur?"#1a1a1a":scoreColor(s, seg.holiday);
              return (
                <div key={wi}
                  title={`${seg.label} W${wi+1} • ${fmt(wk.start)} ${s?"• Score "+s:""}`}
                  onClick={() => isPast && onScore(si,wi)}
                  style={{
                    width:13, height:13, background:col, borderRadius:2,
                    border:`1px solid ${isCur?"#000":C.border}`,
                    cursor: isPast?"pointer":"default",
                    opacity: !isPast&&!isCur?0.35:1,
                    transition:"transform 0.1s",
                  }}
                  onMouseEnter={e=>{ if(isPast) e.target.style.transform="scale(1.4)"; }}
                  onMouseLeave={e=>{ e.target.style.transform="scale(1)"; }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreModal({ si, wi, segments, scores, onScore, onClear, onClose, C }) {
  const seg = segments[si]; const wk = seg?.weeks[wi];
  if (!seg||!wk) return null;
  const cur = scores[weekKey(si,wi)];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:`1.5px solid #1a1a1a`, padding:"24px 28px", borderRadius:8, boxShadow:"4px 4px 0 #1a1a1a", minWidth:280 }}>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Score This Week</div>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{seg.label} · Week {wi+1}</div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:18 }}>{fmt(wk.start)} – {fmt(wk.end)}</div>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[1,2,3,4,5].map(s=>(
            <button key={s} onClick={()=>onScore(si,wi,s)} style={{
              width:40, height:40, background:scoreColor(s,seg.holiday), border:`2px solid ${cur===s?"#1a1a1a":C.border}`,
              borderRadius:4, cursor:"pointer", fontSize:13, fontFamily:"'IBM Plex Mono', monospace", fontWeight:500,
              outline: cur===s?"2px solid #ff6b35":"none", outlineOffset:2,
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {cur && <button onClick={()=>onClear(si,wi)} style={ghostBtn(C)}>Clear</button>}
          <button onClick={onClose} style={ghostBtn(C)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const ghostBtn = (C) => ({
  background:"none", border:`1px solid ${C.border}`, padding:"5px 12px",
  fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase",
  cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace", color:C.muted, borderRadius:4,
});
const primaryBtn = (C) => ({
  background:"#1a1a1a", color:"#fff", border:"none", padding:"8px 16px",
  fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
  cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace", borderRadius:4,
});
const inputStyle = (C) => ({
  fontFamily:"'IBM Plex Mono', monospace", background:C.bg, border:`1px solid ${C.border}`,
  padding:"7px 10px", fontSize:11, color:C.text, borderRadius:4, outline:"none", width:"100%",
});

// ═══════════════════════════════════════════════════════════
// DAILY TASKS
// ═══════════════════════════════════════════════════════════
function DailyTasks({ state, update, C }) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newTime, setNewTime] = useState("");
  const [viewDate, setViewDate] = useState(todayKey());

  const tasks = state.tasks[viewDate] || [];
  const done = tasks.filter(t=>t.done).length;
  const pct = tasks.length>0 ? Math.round(done/tasks.length*100) : 0;

  const addTask = () => {
    if (!newTitle.trim()) return;
    const t = { id:uid(), title:newTitle.trim(), priority:newPriority, time:newTime, done:false, created:Date.now() };
    const newTasks = { ...state.tasks, [viewDate]: [...tasks, t] };
    update({ tasks: newTasks });
    setNewTitle(""); setNewTime("");
  };
  const toggleTask = (id) => {
    const newTasks = { ...state.tasks, [viewDate]: tasks.map(t=>t.id===id?{...t,done:!t.done}:t) };
    update({ tasks: newTasks });
  };
  const deleteTask = (id) => {
    const newTasks = { ...state.tasks, [viewDate]: tasks.filter(t=>t.id!==id) };
    update({ tasks: newTasks });
  };

  const PRIORITY_COLOR = { high:"#ef4444", medium:"#f59e0b", low:"#94a3b8" };

  return (
    <div>
      <PageHeader title="Daily Tasks" subtitle="Track what you do each day." C={C} />

      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <input type="date" value={viewDate} onChange={e=>setViewDate(e.target.value)}
          style={{ ...inputStyle(C), width:"auto" }} />
        <span style={{ fontSize:11, color:C.muted }}>{tasks.length} tasks · {pct}% done</span>
      </div>

      {tasks.length>0 && (
        <Card C={C} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:10, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Daily Progress</span>
            <span style={{ fontSize:11, color:C.accent, fontWeight:500 }}>{done}/{tasks.length}</span>
          </div>
          <ProgressBar value={pct} height={8} />
        </Card>
      )}

      {/* Add task */}
      <Card C={C} style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>Add Task</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <input placeholder="Task title…" value={newTitle} onChange={e=>setNewTitle(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addTask()}
            style={{ ...inputStyle(C), flex:2, minWidth:180 }} />
          <select value={newPriority} onChange={e=>setNewPriority(e.target.value)}
            style={{ ...inputStyle(C), width:"auto" }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input placeholder="Time est." value={newTime} onChange={e=>setNewTime(e.target.value)}
            style={{ ...inputStyle(C), width:100 }} />
          <button onClick={addTask} style={primaryBtn(C)}>+ Add</button>
        </div>
      </Card>

      {/* Task list */}
      <Card C={C}>
        {tasks.length===0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:C.muted, fontSize:12 }}>No tasks for this day. Add one above!</div>
        ) : (
          tasks.map(t => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 0",
              borderBottom:`1px solid ${C.border}`,
            }}>
              <button onClick={()=>toggleTask(t.id)} style={{
                width:18, height:18, borderRadius:"50%", border:`2px solid ${t.done?"#22c55e":PRIORITY_COLOR[t.priority]}`,
                background:t.done?"#22c55e":"none", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {t.done && <span style={{ color:"#fff", fontSize:10, lineHeight:1 }}>✓</span>}
              </button>
              <span style={{ flex:1, fontSize:12, color:t.done?C.muted:C.text, textDecoration:t.done?"line-through":"none" }}>{t.title}</span>
              {t.time && <span style={{ fontSize:9, color:C.muted, letterSpacing:"0.06em" }}>{t.time}</span>}
              <Pill label={t.priority} color={PRIORITY_COLOR[t.priority]} bg={t.priority==="high"?"#fee2e2":t.priority==="medium"?"#fef3c7":"#f1f5f9"} />
              <button onClick={()=>deleteTask(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:14 }}>×</button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WEEKLY PLANNER
// ═══════════════════════════════════════════════════════════
function WeeklyPlanner({ state, update, segments, today, C }) {
  const [si, setSi] = useState(0);
  const [wi, setWi] = useState(0);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!segments) return;
    for (let s=0;s<segments.length;s++) {
      for (let w=0;w<segments[s].weeks.length;w++) {
        if (segments[s].weeks[w].start.getTime()===today.getTime()) { setSi(s); setWi(w); return; }
      }
    }
  }, [segments]);

  const key = weekKey(si, wi);
  const wkData = state.weekly[key] || { goals:"", reflection:"", whatWentWell:"", improve:"", lessons:"", score:null };
  const seg = segments?.[si]; const wk = seg?.weeks[wi];

  const save = () => {
    update({ weekly: { ...state.weekly, [key]: draft } });
    setDraft(null);
  };
  const d = draft || wkData;
  const set = (k,v) => setDraft(dd => ({ ...(dd||wkData), [k]:v }));

  return (
    <div>
      <PageHeader title="Weekly Planner" subtitle="Plan and reflect on each week of your UG." C={C} />

      {!segments ? (
        <Card C={C}><div style={{color:C.muted, fontSize:12}}>Set your start date in Settings first.</div></Card>
      ) : (
        <>
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <select value={si} onChange={e=>{ setSi(+e.target.value); setWi(0); setDraft(null); }}
              style={{ ...inputStyle(C), width:"auto" }}>
              {segments.map((s,i) => <option key={i} value={i}>{s.label}</option>)}
            </select>
            <select value={wi} onChange={e=>{ setWi(+e.target.value); setDraft(null); }}
              style={{ ...inputStyle(C), width:"auto" }}>
              {(segments[si]?.weeks||[]).map((_,i) => (
                <option key={i} value={i}>Week {i+1} · {fmt(segments[si].weeks[i].start)}</option>
              ))}
            </select>
            {wk && <span style={{fontSize:10,color:C.muted}}>{fmt(wk.start)} – {fmt(wk.end)}</span>}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <Card C={C} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>Weekly Goals</div>
                <textarea value={d.goals} onChange={e=>set("goals",e.target.value)}
                  placeholder="What do you want to accomplish this week?"
                  style={{ ...inputStyle(C), minHeight:100, resize:"vertical" }} />
              </Card>
              <Card C={C} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>Productivity Score</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onClick={()=>set("score",s)} style={{
                      width:40, height:40, background:d.score===s?scoreColor(s,seg?.holiday):C.bg,
                      border:`1.5px solid ${d.score===s?"#1a1a1a":C.border}`,
                      borderRadius:4, cursor:"pointer", fontSize:13, fontFamily:"'IBM Plex Mono', monospace",
                    }}>{s}</button>
                  ))}
                </div>
              </Card>
            </div>
            <div>
              <Card C={C} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>What Went Well?</div>
                <textarea value={d.whatWentWell} onChange={e=>set("whatWentWell",e.target.value)}
                  placeholder="Wins and positives from this week…"
                  style={{ ...inputStyle(C), minHeight:80, resize:"vertical" }} />
              </Card>
              <Card C={C} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>What Could Be Improved?</div>
                <textarea value={d.improve} onChange={e=>set("improve",e.target.value)}
                  placeholder="What held you back? What would you change?"
                  style={{ ...inputStyle(C), minHeight:80, resize:"vertical" }} />
              </Card>
              <Card C={C} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>Lessons Learned</div>
                <textarea value={d.lessons} onChange={e=>set("lessons",e.target.value)}
                  placeholder="Key takeaways…"
                  style={{ ...inputStyle(C), minHeight:80, resize:"vertical" }} />
              </Card>
            </div>
          </div>
          {draft && (
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={save} style={primaryBtn(C)}>Save Week</button>
              <button onClick={()=>setDraft(null)} style={ghostBtn(C)}>Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MONTHLY MILESTONES
// ═══════════════════════════════════════════════════════════
function MonthlyMilestones({ state, update, C }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title:"", category:"Study", deadline:"", progress:0 });

  const add = () => {
    if (!form.title.trim()) return;
    update({ milestones: [...state.milestones, { ...form, id:uid(), progress:+form.progress }] });
    setForm({ title:"", category:"Study", deadline:"", progress:0 }); setAdding(false);
  };
  const updateProgress = (id, p) => {
    update({ milestones: state.milestones.map(m=>m.id===id?{...m,progress:+p}:m) });
  };
  const del = (id) => update({ milestones: state.milestones.filter(m=>m.id!==id) });

  const CAT_COLOR = { Study:"#2d7a36", Project:"#2563eb", Health:"#dc2626", Career:"#d97706" };

  return (
    <div>
      <PageHeader title="Monthly Milestones" subtitle="Set and track your big monthly goals." C={C} />

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
        <button onClick={()=>setAdding(v=>!v)} style={primaryBtn(C)}>+ Add Milestone</button>
      </div>

      {adding && (
        <Card C={C} style={{ marginBottom:20, border:`1.5px dashed ${C.accent}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Title</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                placeholder="e.g. Finish DSA course" style={{ ...inputStyle(C), marginTop:4 }} />
            </div>
            <div>
              <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                style={{ ...inputStyle(C), marginTop:4 }}>
                {["Study","Project","Health","Career"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}
                style={{ ...inputStyle(C), marginTop:4 }} />
            </div>
            <div>
              <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Progress ({form.progress}%)</label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e=>setForm(f=>({...f,progress:e.target.value}))}
                style={{ marginTop:8, width:"100%", accentColor:C.accent }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={primaryBtn(C)}>Add</button>
            <button onClick={()=>setAdding(false)} style={ghostBtn(C)}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {state.milestones.map(m => (
          <Card key={m.id} C={C}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{m.title}</div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Pill label={m.category} color={CAT_COLOR[m.category]||C.accent} bg={CAT_COLOR[m.category]+"22"||C.accentLight} />
                  {m.deadline && <span style={{ fontSize:9, color:C.muted }}>Due {fmt(m.deadline)}</span>}
                </div>
              </div>
              <button onClick={()=>del(m.id)} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16 }}>×</button>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:10 }}>
              <span style={{ color:C.muted }}>Progress</span>
              <span style={{ color:m.progress>=100?C.accent:C.text, fontWeight:500 }}>{m.progress}%</span>
            </div>
            <ProgressBar value={m.progress} color={CAT_COLOR[m.category]||C.accent} />
            <input type="range" min={0} max={100} value={m.progress} onChange={e=>updateProgress(m.id,e.target.value)}
              style={{ width:"100%", marginTop:8, accentColor:CAT_COLOR[m.category]||C.accent }} />
          </Card>
        ))}
        {state.milestones.length===0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"48px 0", color:C.muted, fontSize:12 }}>
            No milestones yet. Add your first one!
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SEMESTER PLANNER
// ═══════════════════════════════════════════════════════════
function SemesterPlanner({ state, update, C, segments }) {
  const semSegs = (segments||[]).filter(s=>!s.holiday);
  const [sel, setSel] = useState(0);

  const semIdx = semSegs[sel]?.si ?? 0;
  const semData = state.semesters[semIdx] || { subjects:[], gpa:"", goals:"", assignments:[], exams:[], skills:[] };

  const upd = (patch) => update({ semesters: { ...state.semesters, [semIdx]: { ...semData, ...patch } } });

  const addItem = (field, item) => upd({ [field]: [...(semData[field]||[]), { id:uid(), ...item }] });
  const delItem = (field, id) => upd({ [field]: semData[field].filter(x=>x.id!==id) });
  const toggleItem = (field, id) => upd({ [field]: semData[field].map(x=>x.id===id?{...x,done:!x.done}:x) });

  const [newSubj, setNewSubj] = useState("");
  const [newSkill, setNewSkill] = useState({ name:"", level:0 });
  const [newAssign, setNewAssign] = useState({ title:"", due:"", done:false });
  const [newExam, setNewExam] = useState({ subject:"", date:"", done:false });

  return (
    <div>
      <PageHeader title="Semester Planner" subtitle="Plan each semester in detail." C={C} />

      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {semSegs.map((s,i) => (
          <button key={i} onClick={()=>setSel(i)} style={{
            padding:"6px 14px", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
            background: sel===i?C.accent:"none", color:sel===i?"#fff":C.text,
            border:`1px solid ${sel===i?C.accent:C.border}`, borderRadius:4, cursor:"pointer",
            fontFamily:"'IBM Plex Mono', monospace",
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Subjects + GPA */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>Subjects & Target GPA</div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <input placeholder="Subject name…" value={newSubj} onChange={e=>setNewSubj(e.target.value)}
              style={{ ...inputStyle(C), flex:1 }} />
            <button onClick={()=>{ if(newSubj.trim()) { addItem("subjects",{name:newSubj.trim()}); setNewSubj(""); }}} style={primaryBtn(C)}>+</button>
          </div>
          {semData.subjects.map(s=>(
            <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
              <span>{s.name}</span>
              <button onClick={()=>delItem("subjects",s.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>×</button>
            </div>
          ))}
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Target GPA</label>
            <input value={semData.gpa} onChange={e=>upd({gpa:e.target.value})}
              placeholder="e.g. 9.0" style={{ ...inputStyle(C), marginTop:4, width:"100px" }} />
          </div>
        </Card>

        {/* Goals */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:10 }}>Semester Goals</div>
          <textarea value={semData.goals} onChange={e=>upd({goals:e.target.value})}
            placeholder="What do you want to achieve this semester?"
            style={{ ...inputStyle(C), minHeight:140, resize:"vertical" }} />
        </Card>

        {/* Assignments */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>Assignment Tracker</div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <input placeholder="Assignment…" value={newAssign.title} onChange={e=>setNewAssign(a=>({...a,title:e.target.value}))}
              style={{ ...inputStyle(C), flex:1 }} />
            <input type="date" value={newAssign.due} onChange={e=>setNewAssign(a=>({...a,due:e.target.value}))}
              style={{ ...inputStyle(C), width:130 }} />
            <button onClick={()=>{ if(newAssign.title.trim()){ addItem("assignments",{...newAssign,done:false}); setNewAssign({title:"",due:"",done:false}); }}} style={primaryBtn(C)}>+</button>
          </div>
          {semData.assignments.map(a=>(
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
              <input type="checkbox" checked={a.done} onChange={()=>toggleItem("assignments",a.id)} style={{accentColor:C.accent}} />
              <span style={{ flex:1, fontSize:11, textDecoration:a.done?"line-through":"none", color:a.done?C.muted:C.text }}>{a.title}</span>
              {a.due && <span style={{ fontSize:9, color:C.muted }}>{fmt(a.due)}</span>}
              <button onClick={()=>delItem("assignments",a.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>×</button>
            </div>
          ))}
        </Card>

        {/* Skills */}
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:12 }}>Skill Goals</div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <input placeholder="Skill…" value={newSkill.name} onChange={e=>setNewSkill(s=>({...s,name:e.target.value}))}
              style={{ ...inputStyle(C), flex:1 }} />
            <button onClick={()=>{ if(newSkill.name.trim()){ addItem("skills",{name:newSkill.name.trim(),level:0}); setNewSkill({name:"",level:0}); }}} style={primaryBtn(C)}>+</button>
          </div>
          {semData.skills.map(sk=>(
            <div key={sk.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11 }}>{sk.name}</span>
                <div style={{ display:"flex", gap:4 }}>
                  {[1,2,3,4,5].map(l=>(
                    <button key={l} onClick={()=>upd({skills:semData.skills.map(s=>s.id===sk.id?{...s,level:l}:s)})} style={{
                      width:14, height:14, background:l<=sk.level?C.accent:C.bg,
                      border:`1px solid ${C.border}`, borderRadius:2, cursor:"pointer", padding:0,
                    }}/>
                  ))}
                  <button onClick={()=>delItem("skills",sk.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12}}>×</button>
                </div>
              </div>
              <ProgressBar value={sk.level*20} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UG TIMELINE
// ═══════════════════════════════════════════════════════════
function UGTimeline({ state, update, segments, today, C }) {
  const [scoringWk, setScoringWk] = useState(null);
  if (!segments) return (
    <div>
      <PageHeader title="UG Timeline" subtitle="Your 4-year journey at a glance." C={C} />
      <Card C={C}><div style={{color:C.muted,fontSize:12}}>Set your start date in Settings first.</div></Card>
    </div>
  );

  const byYear = [1,2,3,4].map(yr => ({
    yr,
    segs: segments.filter(s=>s.year===yr),
  }));

  return (
    <div>
      <PageHeader title="UG Timeline" subtitle="Every week of your 4-year degree." C={C} />
      {byYear.map(({ yr, segs }) => (
        <div key={yr} style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:C.muted, marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
            <span>Year {yr}</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          {segs.map(seg => {
            const si = seg.si;
            const allScored = seg.weeks.filter((_,wi)=>state.scores[weekKey(si,wi)]);
            const avgSeg = allScored.length>0 ? (allScored.reduce((a,_,wi)=>{
              const s=state.scores[weekKey(si,wi)]; return s?a+s:a;
            },0)/allScored.length).toFixed(1) : null;
            return (
              <div key={si} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:500, color:seg.holiday?"#7987c8":C.accent, letterSpacing:"0.06em" }}>{seg.label}</span>
                    <span style={{ fontSize:9, color:C.muted, marginLeft:10 }}>{fmtFull(seg.start)} – {fmtFull(seg.end)}</span>
                  </div>
                  {avgSeg && <span style={{ fontSize:10, color:C.muted }}>avg {avgSeg}</span>}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                  {seg.weeks.map((wk, wi) => {
                    const s = state.scores[weekKey(si,wi)] ?? null;
                    const isCur = wk.start.getTime()===today.getTime();
                    const isPast = wk.start <= today;
                    return (
                      <div key={wi}
                        title={`${seg.label} W${wi+1} · ${fmtFull(wk.start)}${s?" · Score "+s:""}`}
                        onClick={() => isPast && setScoringWk({si,wi})}
                        style={{
                          width:16, height:16, borderRadius:3,
                          background: isCur?"#1a1a1a":scoreColor(s,seg.holiday),
                          border:`1.5px solid ${isCur?"#000":C.border}`,
                          cursor:isPast?"pointer":"default",
                          opacity:!isPast&&!isCur?0.3:1,
                          transition:"transform 0.1s",
                        }}
                        onMouseEnter={e=>{ if(isPast) e.target.style.transform="scale(1.3)"; }}
                        onMouseLeave={e=>{ e.target.style.transform="scale(1)"; }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {scoringWk && (
        <ScoreModal si={scoringWk.si} wi={scoringWk.wi} segments={segments} scores={state.scores}
          onScore={(si,wi,s)=>{ update({scores:{...state.scores,[weekKey(si,wi)]:s}}); setScoringWk(null); }}
          onClear={(si,wi)=>{ const sc={...state.scores}; delete sc[weekKey(si,wi)]; update({scores:sc}); setScoringWk(null); }}
          onClose={()=>setScoringWk(null)} C={C} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════
function Analytics({ state, segments, today, C }) {
  if (!segments) return (
    <div>
      <PageHeader title="Analytics" subtitle="Visual insights into your UG journey." C={C} />
      <Card C={C}><div style={{color:C.muted,fontSize:12}}>Set your start date in Settings first.</div></Card>
    </div>
  );

  // Build trend data — last 20 scored weeks
  const weeklyTrend = [];
  segments.forEach((seg, si) => {
    seg.weeks.forEach((wk, wi) => {
      const s = state.scores[weekKey(si,wi)];
      if (s && wk.start <= today) {
        weeklyTrend.push({ label:`W${weeklyTrend.length+1}`, score:s, seg:seg.label });
      }
    });
  });
  const trendData = weeklyTrend.slice(-20);

  // Task completion by month
  const monthlyTasks = {};
  Object.entries(state.tasks).forEach(([dk, ts]) => {
    const m = dk.slice(0,7);
    if (!monthlyTasks[m]) monthlyTasks[m] = { total:0, done:0 };
    monthlyTasks[m].total += ts.length;
    monthlyTasks[m].done += ts.filter(t=>t.done).length;
  });
  const taskData = Object.entries(monthlyTasks).sort().slice(-8).map(([m,v]) => ({
    month: m.slice(5),
    pct: v.total>0?Math.round(v.done/v.total*100):0,
    done: v.done, total: v.total,
  }));

  // Score distribution
  const dist = [0,0,0,0,0,0];
  Object.values(state.scores).forEach(s => { if(s>=1&&s<=5) dist[s]++; });
  const distData = [1,2,3,4,5].map(s=>({ score:"Score "+s, count:dist[s], fill:scoreColor(s,false) }));

  const CHART_STYLE = { fontSize:10, fontFamily:"'IBM Plex Mono', monospace", fill:C.muted };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Visual insights into your UG journey." C={C} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <Card C={C} style={{ gridColumn:"1/-1" }}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Weekly Productivity Trend</div>
          {trendData.length>1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={CHART_STYLE} />
                <YAxis domain={[0,5]} ticks={[1,2,3,4,5]} tick={CHART_STYLE} />
                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, fontFamily:"'IBM Plex Mono', monospace", fontSize:11 }} />
                <Line type="monotone" dataKey="score" stroke={C.accent} strokeWidth={2} dot={{ fill:C.accent, r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:11 }}>
              Not enough data yet. Keep scoring your weeks!
            </div>
          )}
        </Card>

        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Monthly Task Completion (%)</div>
          {taskData.length>0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={CHART_STYLE} />
                <YAxis domain={[0,100]} tick={CHART_STYLE} />
                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, fontFamily:"'IBM Plex Mono', monospace", fontSize:11 }} />
                <Bar dataKey="pct" fill={C.accent} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:11 }}>No task data yet.</div>
          )}
        </Card>

        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Score Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="score" tick={CHART_STYLE} />
              <YAxis allowDecimals={false} tick={CHART_STYLE} />
              <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, fontFamily:"'IBM Plex Mono', monospace", fontSize:11 }} />
              <Bar dataKey="count" radius={[3,3,0,0]}>
                {distData.map((d,i)=><Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Milestones summary */}
      <Card C={C}>
        <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Milestone Overview</div>
        {state.milestones.length===0 ? (
          <div style={{ color:C.muted, fontSize:11 }}>No milestones set yet.</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {state.milestones.map(m => (
              <div key={m.id}>
                <div style={{ fontSize:10, marginBottom:3, display:"flex", justifyContent:"space-between" }}>
                  <span>{m.title.length>22?m.title.slice(0,22)+"…":m.title}</span>
                  <span style={{ color:C.accent }}>{m.progress}%</span>
                </div>
                <ProgressBar value={m.progress} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════════
function Journal({ state, update, C }) {
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ title:"", body:"", prompt:"" });
  const [viewing, setViewing] = useState(null);

  const PROMPTS = [
    "What did I learn this month?",
    "What mistakes did I make and what did they teach me?",
    "What should I improve next month?",
    "What am I most proud of lately?",
    "How have I grown since starting my UG?",
    "What would I tell my past self?",
  ];

  const add = () => {
    if (!form.body.trim()) return;
    const entry = { id:uid(), date:new Date().toISOString(), title:form.title||"Untitled", body:form.body, prompt:form.prompt };
    update({ journal: [entry, ...state.journal] });
    setForm({ title:"", body:"", prompt:"" }); setWriting(false);
  };
  const del = (id) => { update({ journal: state.journal.filter(e=>e.id!==id) }); if(viewing?.id===id) setViewing(null); };

  return (
    <div>
      <PageHeader title="Journal & Reflection" subtitle="Write. Reflect. Grow." C={C} />

      {viewing ? (
        <div>
          <button onClick={()=>setViewing(null)} style={{ ...ghostBtn(C), marginBottom:16 }}>← Back</button>
          <Card C={C}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", marginBottom:6 }}>{fmtFull(viewing.date)}</div>
            {viewing.prompt && <div style={{ fontSize:11, color:C.accent, fontStyle:"italic", marginBottom:10 }}>"{viewing.prompt}"</div>}
            <h2 style={{ margin:"0 0 16px", fontFamily:"'Playfair Display', serif", fontSize:20 }}>{viewing.title}</h2>
            <div style={{ fontSize:12, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{viewing.body}</div>
          </Card>
        </div>
      ) : writing ? (
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>New Entry</div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Prompt (optional)</label>
            <select value={form.prompt} onChange={e=>setForm(f=>({...f,prompt:e.target.value}))}
              style={{ ...inputStyle(C), marginTop:4 }}>
              <option value="">— None —</option>
              {PROMPTS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {form.prompt && <div style={{ fontSize:11, color:C.accent, fontStyle:"italic", marginBottom:14 }}>"{form.prompt}"</div>}
          <div style={{ marginBottom:10 }}>
            <input placeholder="Title…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              style={{ ...inputStyle(C) }} />
          </div>
          <textarea placeholder="Write your reflection…" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
            style={{ ...inputStyle(C), minHeight:200, resize:"vertical", marginBottom:14 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={primaryBtn(C)}>Save Entry</button>
            <button onClick={()=>setWriting(false)} style={ghostBtn(C)}>Cancel</button>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
            <button onClick={()=>setWriting(true)} style={primaryBtn(C)}>+ New Entry</button>
          </div>
          {state.journal.length===0 ? (
            <Card C={C} style={{ textAlign:"center", padding:"48px 20px" }}>
              <div style={{ fontFamily:"'Playfair Display', serif", fontStyle:"italic", fontSize:18, color:C.muted, marginBottom:8 }}>Your journal is empty.</div>
              <div style={{ fontSize:11, color:C.muted }}>Start writing. The record is yours alone.</div>
            </Card>
          ) : (
            <div style={{ display:"grid", gap:12 }}>
              {state.journal.map(e => (
                <Card key={e.id} C={C} onClick={()=>setViewing(e)} style={{ cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.08em", marginBottom:4 }}>{fmtFull(e.date)}</div>
                      <div style={{ fontSize:13, fontWeight:500, fontFamily:"'Playfair Display', serif" }}>{e.title}</div>
                      {e.prompt && <div style={{ fontSize:10, color:C.accent, fontStyle:"italic", marginTop:3 }}>"{e.prompt}"</div>}
                      <div style={{ fontSize:11, color:C.muted, marginTop:6, lineHeight:1.5 }}>
                        {e.body.slice(0,120)}{e.body.length>120?"…":""}
                      </div>
                    </div>
                    <button onClick={ev=>{ ev.stopPropagation(); del(e.id); }} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginLeft:12 }}>×</button>
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

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function Settings({ state, update, C }) {
  const [startInput, setStartInput] = useState(state.startDate ? new Date(state.startDate).toISOString().split("T")[0] : "");
  const [name, setName] = useState(state.settings.name);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your UG Life Tracker." C={C} />

      <div style={{ display:"grid", gap:16, maxWidth:520 }}>
        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Profile</div>
          <label style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Your Name</label>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <input value={name} onChange={e=>setName(e.target.value)} style={{ ...inputStyle(C), flex:1 }} />
            <button onClick={()=>update({settings:{...state.settings,name}})} style={primaryBtn(C)}>Save</button>
          </div>
        </Card>

        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>UG Start Date</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>
            This is the first day of your undergraduate program. All semesters and weeks are calculated from here.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="date" value={startInput} onChange={e=>setStartInput(e.target.value)}
              style={{ ...inputStyle(C), flex:1 }} />
            <button onClick={()=>{ if(startInput) update({startDate:startInput}); }} style={primaryBtn(C)}>
              {state.startDate?"Update":"Set Start"}
            </button>
          </div>
          {state.startDate && <div style={{ fontSize:10, color:C.accent, marginTop:8 }}>✓ Started: {fmtFull(state.startDate)}</div>}
        </Card>

        <Card C={C}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Appearance</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12 }}>Dark Mode</span>
            <button onClick={()=>update({settings:{...state.settings,darkMode:!state.settings.darkMode}})} style={{
              width:48, height:26, borderRadius:13,
              background:state.settings.darkMode?C.accent:"#ccc",
              border:"none", cursor:"pointer", position:"relative",
              transition:"background 0.2s",
            }}>
              <div style={{
                width:20, height:20, borderRadius:"50%", background:"#fff",
                position:"absolute", top:3, left:state.settings.darkMode?25:3,
                transition:"left 0.2s",
              }} />
            </button>
          </div>
        </Card>

        <Card C={C} style={{ border:`1px solid #ef4444` }}>
          <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"#ef4444", marginBottom:10 }}>Danger Zone</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>Reset all data. This cannot be undone.</div>
          <button onClick={()=>{ if(window.confirm("Reset ALL data? This cannot be undone.")) { update({ ...defaultState(), settings:state.settings }); }}} style={{
            background:"#ef4444", color:"#fff", border:"none", padding:"7px 14px",
            fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
            cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace", borderRadius:4,
          }}>Reset All Data</button>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
  textarea, input, select { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ccc8be; border-radius: 3px; }
  button:focus-visible { outline: 2px solid #2d7a36; outline-offset: 2px; }
`;