import { useNavigate } from "react-router-dom";
import { useLiveState } from "../hooks/useLiveState.js";
import { TRACKS, WEATHER_INFO } from "../config/tracks.js";

export default function Home() {
  const navigate = useNavigate();
  const { connected, state } = useLiveState();
  const activeAlerts = state.alerts.filter(a => !a.resolved && Date.now() - a.timestamp < 30000).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Grid bg */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(ellipse,rgba(59,130,246,0.08),transparent 70%)" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 0 20px rgba(59,130,246,0.4)", fontSize: 18 }}>🚂</div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: 4 }}>
            <span style={{ color: "#fff" }}>NEXUS</span><span style={{ color: "#3b82f6" }}> RAIL</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, border: `1px solid ${connected ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, background: connected ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#10b981" : "#ef4444", animation: connected ? "pulse 2s infinite" : "none" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: connected ? "#10b981" : "#ef4444" }}>{connected ? "ONLINE" : "OFFLINE"}</span>
        </div>
      </header>

      {/* Hero */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 680 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)", fontSize: 11, color: "#3b82f6", letterSpacing: 3, fontFamily: "monospace", marginBottom: 24 }}>
            📡 REAL-TIME COLLISION DETECTION
          </div>
          <h1 style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 16, letterSpacing: -1 }}>
            <span style={{ color: "#fff" }}>Smart </span>
            <span style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rail</span>
            <br />
            <span style={{ color: "#fff" }}>Safety </span>
            <span style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>System</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            QR codes at km-marks. Phones as trains. Real-time collision detection across 4 tracks.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, width: "100%", maxWidth: 780 }}>
          {[
            { label: "I'm a Train",       sub: "Use on a phone. Scan QR codes at each km-mark to report your live position.", cta: "Open Scanner →",   path: "/scanner",   color: "#3b82f6", emoji: "🚂" },
            { label: "Monitoring Screen", sub: "Use on a laptop. Watch all 4 tracks with live collision warnings and alerts.", cta: "Open Dashboard →", path: "/dashboard", color: "#8b5cf6", emoji: "🖥️" },
            { label: "Print QR Codes",    sub: "Generate and print 28 QR codes — 7 positions on each of the 4 tracks.", cta: "View Codes →",      path: "/qrcodes",   color: "#10b981", emoji: "📋" },
          ].map(({ label, sub, cta, path, color, emoji }) => (
            <button key={path} onClick={() => navigate(path)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20, padding: 24, borderRadius: 20, textAlign: "left", cursor: "pointer", background: `linear-gradient(135deg,${color}0d,${color}05)`, border: `1px solid ${color}33`, boxShadow: `0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)`, transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${color}22,inset 0 1px 0 rgba(255,255,255,0.06)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)`; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `${color}1a`, border: `1px solid ${color}40`, boxShadow: `0 0 16px ${color}33` }}>{emoji}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{sub}</p>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color }}>{cta}</p>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, width: "100%", maxWidth: 780 }}>
          {[
            { label: "Active Trains", value: state.trains.length, color: "#3b82f6", icon: "🚂" },
            { label: "Active Alerts", value: activeAlerts, color: activeAlerts > 0 ? "#ef4444" : "#10b981", icon: "🛡️" },
            { label: "Tracks Online", value: `${TRACKS.length}/4`, color: "#10b981", icon: "⚡" },
            { label: "Weather", value: WEATHER_INFO[state.weatherMode]?.label ?? state.weatherMode, color: "#a855f7", icon: "📡" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
              <p style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color }}>{value}</p>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 16, fontSize: 10, color: "rgba(100,116,139,0.4)", letterSpacing: 4, fontFamily: "monospace" }}>
        NEXUS RAIL © 2025 — REAL-TIME QR COLLISION DETECTION
      </footer>
    </div>
  );
}
