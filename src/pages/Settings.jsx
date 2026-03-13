import { useState, useRef } from "react";
import { Card, SectionTitle, PageHeader, inputStyle, btnPrimary, btnGhost, defaultState } from "../shared";

export default function Settings({ state, update, exportData, importData, C }) {
  const [name, setName] = useState(state.profile.name);
  const [semester, setSemester] = useState(state.profile.currentSemester || 1);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef(null);

  const saveName = () => update({ profile: { ...state.profile, name } });
  const saveSemester = () => update({ profile: { ...state.profile, currentSemester: +semester } });

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = importData(ev.target.result);
      setImportMsg(success ? "✓ Data imported successfully!" : "✕ Invalid JSON file");
      setTimeout(() => setImportMsg(""), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your UG Tracker" C={C} />

      <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
        {/* Profile */}
        <Card C={C}>
          <SectionTitle C={C}>Profile</SectionTitle>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Your Name</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle(C), flex: 1 }} />
              <button onClick={saveName} style={btnPrimary(C)}>Save</button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Current Semester</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <select value={semester} onChange={e => setSemester(e.target.value)} style={{ ...inputStyle(C), flex: 1 }}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <button onClick={saveSemester} style={btnPrimary(C)}>Save</button>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card C={C}>
          <SectionTitle C={C}>Appearance</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Dark Mode</span>
            <button onClick={() => update({ settings: { ...state.settings, darkMode: !state.settings.darkMode } })} style={{
              width: 48, height: 26, borderRadius: 13,
              background: state.settings.darkMode ? C.accent : "#ccc",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.2s",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: state.settings.darkMode ? 25 : 3,
                transition: "left 0.2s",
              }} />
            </button>
          </div>
        </Card>

        {/* Data */}
        <Card C={C}>
          <SectionTitle C={C}>Data Management</SectionTitle>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
            All your data is stored locally in your browser. Export a backup or import from a previous export.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={exportData} style={btnPrimary(C)}>⬇ Export JSON</button>
            <button onClick={() => fileRef.current?.click()} style={btnGhost(C)}>⬆ Import JSON</button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </div>
          {importMsg && (
            <div style={{ fontSize: 12, color: importMsg.startsWith("✓") ? C.success : C.danger, fontWeight: 500 }}>
              {importMsg}
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card C={C} style={{ border: `1px solid ${C.danger}` }}>
          <SectionTitle C={C}>
            <span style={{ color: C.danger }}>Danger Zone</span>
          </SectionTitle>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            This will permanently reset all your data. Consider exporting a backup first.
          </div>
          <button onClick={() => {
            if (window.confirm("Reset ALL data? This action cannot be undone.")) {
              const fresh = defaultState();
              fresh.settings = state.settings; // keep dark mode
              update(fresh);
            }
          }} style={{
            background: C.danger, color: "#fff", border: "none", padding: "9px 18px",
            fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 8,
          }}>Reset All Data</button>
        </Card>
      </div>
    </div>
  );
}
