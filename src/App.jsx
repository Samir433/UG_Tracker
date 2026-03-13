import { useState, useEffect } from "react";
import { useAppState, useTheme, NAV_ITEMS, GLOBAL_CSS } from "./shared";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import CodingPractice from "./pages/CodingPractice";
import Skills from "./pages/Skills";
import Projects from "./pages/Projects";
import Internships from "./pages/Internships";
import Reflections from "./pages/Reflections";
import ExamMode from "./pages/ExamMode";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { state, update, loaded, exportData, importData } = useAppState();
  const C = useTheme(state.settings.darkMode);

  // Allow Dashboard quick actions to navigate
  useEffect(() => { window.__setPage = setPage; return () => { delete window.__setPage; }; }, []);

  if (!loaded) return (
    <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading UG Tracker…</div>
      </div>
    </div>
  );

  const pageProps = { state, update, C };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text, overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 230 : 60,
        minWidth: sidebarOpen ? 230 : 60,
        background: C.dm ? "#161614" : "#f5f3ef",
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? "22px 20px 18px" : "22px 14px 18px", borderBottom: `1px solid ${C.border}` }}>
          {sidebarOpen ? (
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>UG Tracker</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Engineering Dashboard</div>
            </div>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center" }}>🎓</div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: sidebarOpen ? "9px 20px" : "9px 18px",
                background: active ? C.accentBg : "transparent",
                border: "none", cursor: "pointer",
                color: active ? C.accent : C.text,
                fontSize: 13, fontWeight: active ? 600 : 400,
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
                borderRadius: 0,
              }}>
                <span style={{ fontSize: 14, opacity: 0.8, minWidth: 18, textAlign: "center" }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500, padding: "4px 0",
          }}>
            {sidebarOpen ? "◂ Collapse" : "▸"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        {page === "dashboard" && <Dashboard {...pageProps} />}
        {page === "timeline" && <Timeline {...pageProps} />}
        {page === "coding" && <CodingPractice {...pageProps} />}
        {page === "skills" && <Skills {...pageProps} />}
        {page === "projects" && <Projects {...pageProps} />}
        {page === "internships" && <Internships {...pageProps} />}
        {page === "reflections" && <Reflections {...pageProps} />}
        {page === "exams" && <ExamMode {...pageProps} />}
        {page === "analytics" && <Analytics {...pageProps} />}
        {page === "settings" && <Settings {...pageProps} exportData={exportData} importData={importData} />}
      </main>
    </div>
  );
}