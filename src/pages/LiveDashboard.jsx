import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveState } from "../hooks/useLiveState.js";
import { TRACKS, WEATHER_INFO } from "../config/tracks.js";

const STATUS = {
  normal:    { color: "#10b981", glow: "rgba(16,185,129,0.5)",  label: "Normal"    },
  warning:   { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  label: "Warning"   },
  critical:  { color: "#ef4444", glow: "rgba(239,68,68,0.6)",   label: "Critical"  },
  emergency: { color: "#ef4444", glow: "rgba(239,68,68,0.8)",   label: "Emergency" },
};

function RailwaySvg({ color }) {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
      <line x1="0" y1="30%" x2="100%" y2="30%" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
      <line x1="0" y1="70%" x2="100%" y2="70%" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
      {Array.from({ length: 28 }, (_, i) => (
        <line key={i} x1={`${(i / 27) * 100}%`} y1="18%" x2={`${(i / 27) * 100}%`} y2="82%" stroke={color} strokeWidth="3" strokeOpacity="0.15" />
      ))}
    </svg>
  );
}

function TrainMarker({ train, trackLength }) {
  const pct = Math.min(100, Math.max(0, (train.position / trackLength) * 100));
  const { color, glow } = STATUS[train.status] ?? STATUS.normal;
  const isCritical = train.status === "critical" || train.status === "emergency";
  return (
    <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", transition: "left 0.8s cubic-bezier(0.25,0.46,0.45,0.94)", zIndex: 20 }}>
      {isCritical && <div style={{ position: "absolute", width: 40, height: 40, top: -8, left: -8, borderRadius: "50%", background: glow, opacity: 0.45, animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />}
      <div style={{ position: "absolute", width: 32, height: 32, top: -6, left: -6, borderRadius: "50%", background: `radial-gradient(circle,${glow},transparent 70%)`, filter: "blur(6px)" }} />
      <div style={{ position: "relative", width: 26, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: `linear-gradient(135deg,${color}33,${color}18)`, border: `1.5px solid ${color}`, boxShadow: `0 0 10px ${glow},0 0 20px ${glow}55,inset 0 1px 0 ${color}44` }}>🚂</div>
      <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, whiteSpace: "nowrap", padding: "1px 5px", borderRadius: 999, color, background: `${color}18`, border: `1px solid ${color}30`, boxShadow: `0 0 6px ${glow}` }}>
        {train.name.split(" ")[0]}
      </div>
    </div>
  );
}

function DistanceBridge({ a, b, trackLength, thresholds }) {
  const pctA = Math.min(100, Math.max(0, (a.position / trackLength) * 100));
  const pctB = Math.min(100, Math.max(0, (b.position / trackLength) * 100));
  const left = Math.min(pctA, pctB), width = Math.abs(pctA - pctB);
  const dist = Math.abs(a.position - b.position);
  const color = dist <= thresholds.critical ? "#ef4444" : dist <= thresholds.warning ? "#f59e0b" : "#10b981";
  return (
    <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }}>
      <div style={{ position: "relative", width: "100%", height: 1, background: `linear-gradient(90deg,transparent,${color}90,${color}90,transparent)`, boxShadow: `0 0 4px ${color}60` }}>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: -16, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", padding: "1px 5px", borderRadius: 6, color, background: `${color}18`, border: `1px solid ${color}40`, boxShadow: `0 0 8px ${color}40` }}>
          {dist.toFixed(1)} km
        </div>
      </div>
    </div>
  );
}

function TrackCard({ track, trains, emergency, thresholds, onBrake, onClear }) {
  const sorted = [...trains].sort((a, b) => a.position - b.position);
  const hasCritical = trains.some(t => t.status === "critical" || t.status === "emergency");
  const hasWarning  = trains.some(t => t.status === "warning");
  const borderColor = emergency || hasCritical ? "rgba(239,68,68,0.5)" : hasWarning ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)";
  const glowColor   = emergency || hasCritical ? "rgba(239,68,68,0.15)" : hasWarning ? "rgba(245,158,11,0.08)" : "transparent";

  return (
    <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${borderColor}`, background: "linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))", boxShadow: `0 4px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.03),inset 0 1px 0 rgba(255,255,255,0.05),0 0 40px ${glowColor}`, transition: "box-shadow 0.5s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: track.color, boxShadow: `0 0 8px ${track.color}` }} />
          <span style={{ fontWeight: 700, fontSize: 13 }}>{track.name}</span>
          {(emergency || hasCritical) && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: "#ef4444", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", animation: "pulse 1.5s infinite" }}>{emergency ? "EMERGENCY" : "CRITICAL"}</span>}
          {hasWarning && !hasCritical && !emergency && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>WARNING</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{trains.length} / track</span>
          {emergency
            ? <button onClick={onClear} style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 8, cursor: "pointer", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>CLEAR</button>
            : <button onClick={onBrake} style={{ fontSize: 14, padding: "2px 7px", borderRadius: 8, cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.5)", border: "1px solid rgba(239,68,68,0.12)" }}>⚡</button>}
        </div>
      </div>

      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ position: "relative", height: 52, borderRadius: 8, overflow: "visible", background: `linear-gradient(90deg,${track.color}08,${track.color}14,${track.color}08)`, border: `1px solid ${track.color}20` }}>
          <RailwaySvg color={track.color} />
          {track.positions.map(pos => (
            <div key={pos} style={{ position: "absolute", top: 0, bottom: 0, left: `${(pos / track.length) * 100}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ width: 1, height: 8, marginBottom: 2, background: track.color, opacity: 0.35 }} />
            </div>
          ))}
          {sorted.length >= 2 && sorted.map((t, i) => i < sorted.length - 1 ? <DistanceBridge key={`${t.id}-${sorted[i+1].id}`} a={t} b={sorted[i+1]} trackLength={track.length} thresholds={thresholds} /> : null)}
          {trains.map(train => <TrainMarker key={train.id} train={train} trackLength={track.length} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 2px" }}>
          {[0, track.length / 4, track.length / 2, (track.length * 3) / 4, track.length].map(km => (
            <span key={km} style={{ fontSize: 9, fontFamily: "monospace", opacity: 0.3 }}>{km}km</span>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {trains.length === 0 ? (
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", textAlign: "center", padding: "8px 0", opacity: 0.5 }}>— NO ACTIVE TRAINS —</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {trains.map(train => {
              const { color, glow, label } = STATUS[train.status] ?? STATUS.normal;
              return (
                <div key={train.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10, background: `${color}08`, border: `1px solid ${color}20`, boxShadow: `0 0 12px ${glow}25` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${glow}`, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{train.name}</span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color, opacity: 0.8 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>{train.position} km</span>
                  {train.speed > 0 && <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>{Math.round(train.speed)} km/h</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveDashboard() {
  const navigate = useNavigate();
  const { connected, state, emergencyFlash, changeWeather, triggerEmergencyBrake, clearEmergency } = useLiveState();
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);

  const totalCritical = state.trains.filter(t => t.status === "critical" || t.status === "emergency").length;
  const totalWarning  = state.trains.filter(t => t.status === "warning").length;
  const recentAlerts  = state.alerts.slice(0, 20);
  const activeNow     = recentAlerts.filter(a => !a.resolved && Date.now() - a.timestamp < 20000);

  return (
    <div style={{ minHeight: "100vh", background: emergencyFlash ? "rgba(127,29,29,0.15)" : "#0a0a0f", color: "#e2e8f0", display: "flex", flexDirection: "column", transition: "background 1s" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.4, backgroundImage: "linear-gradient(rgba(59,130,246,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,10,15,0.85)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 18, padding: "4px 8px", borderRadius: 8 }}>←</button>
        <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 4 }}>NEXUS RAIL</span>
        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", letterSpacing: 3 }}>— LIVE MONITOR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {totalCritical > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", animation: "pulse 1.5s infinite" }}>⚠ {totalCritical} CRITICAL</div>}
          {totalWarning > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>⚠ {totalWarning} WARNING</div>}
          <div style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontFamily: "monospace", fontWeight: 700, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{state.trains.length} TRAINS</div>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
            {Object.entries(WEATHER_INFO).map(([mode, info]) => (
              <button key={mode} title={info.label} onClick={() => changeWeather(mode)} style={{ padding: "6px 10px", fontSize: 14, cursor: "pointer", border: "none", borderRight: "1px solid rgba(255,255,255,0.06)", background: state.weatherMode === mode ? "rgba(59,130,246,0.3)" : "transparent", transition: "background 0.2s" }}>
                {info.emoji}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 11, fontFamily: "monospace", fontWeight: 700, background: connected ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${connected ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, color: connected ? "#10b981" : "#ef4444" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#10b981" : "#ef4444", animation: connected ? "pulse 2s infinite" : "none" }} />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 10, flex: 1, maxWidth: 1600, width: "100%", margin: "0 auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        {activeNow.length > 0 && (
          <div style={{ padding: "16px 20px", borderRadius: 16, background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.04))", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.12)" }}>
            <p style={{ fontWeight: 900, fontSize: 11, letterSpacing: 4, color: "#ef4444", marginBottom: 8, fontFamily: "monospace" }}>⚠ ACTIVE COLLISION ALERTS</p>
            {activeNow.map(a => <p key={a.id} style={{ fontSize: 14, color: "#fca5a5", marginTop: 3 }}>{a.message}</p>)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {TRACKS.map(track => {
            const trains = state.trains.filter(t => t.trackId === track.id);
            const isEmergency = state.emergencyTracks?.includes(track.id);
            return <TrackCard key={track.id} track={track} trains={trains} emergency={isEmergency} thresholds={state.weatherThresholds ?? { warning: 5, critical: 2 }} onBrake={() => triggerEmergencyBrake(track.id)} onClear={() => clearEmergency(track.id)} />;
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: 4 }}>EVENT LOG</span>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>{recentAlerts.length} events</span>
            </div>
            {recentAlerts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 10 }}>
                <span style={{ fontSize: 36, opacity: 0.3 }}>🛡️</span>
                <p style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b", opacity: 0.5 }}>ALL CLEAR — SYSTEM NOMINAL</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {recentAlerts.map(alert => {
                  const isCrit = alert.type === "critical" || alert.type === "emergency-brake";
                  return (
                    <div key={alert.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 10, fontSize: 12, background: isCrit ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${isCrit ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                      <span style={{ flexShrink: 0 }}>{isCrit ? "🚨" : "⚠️"}</span>
                      <span style={{ flex: 1, color: isCrit ? "#fca5a5" : "#fde68a", lineHeight: 1.5 }}>{alert.message}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#64748b", flexShrink: 0 }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: 4 }}>SYSTEM STATUS</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Total Trains", value: state.trains.length, color: "#3b82f6" },
                { label: "Alerts",       value: recentAlerts.length, color: recentAlerts.length > 0 ? "#ef4444" : "#10b981" },
                { label: "Safe",         value: state.trains.filter(t => t.status === "normal").length,  color: "#10b981" },
                { label: "At Risk",      value: state.trains.filter(t => t.status !== "normal").length, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: 12, borderRadius: 12, background: `${color}08`, border: `1px solid ${color}20` }}>
                  <p style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color }}>{value}</p>
                  <p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{label}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: 3, marginBottom: 10 }}>WEATHER · THRESHOLDS</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{WEATHER_INFO[state.weatherMode]?.emoji} {WEATHER_INFO[state.weatherMode]?.label ?? state.weatherMode}</span>
                <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "monospace" }}>
                  <span style={{ color: "#f59e0b" }}>⚠ {state.weatherThresholds?.warning}km</span>
                  <span style={{ color: "#ef4444" }}>🚨 {state.weatherThresholds?.critical}km</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, transition: "width 0.5s,background 0.5s", width: totalCritical > 0 ? "100%" : totalWarning > 0 ? "55%" : "8%", background: totalCritical > 0 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : totalWarning > 0 ? "linear-gradient(90deg,#10b981,#f59e0b)" : "#10b981", boxShadow: totalCritical > 0 ? "0 0 8px rgba(239,68,68,0.6)" : "0 0 8px rgba(16,185,129,0.4)" }} />
              </div>
              <p style={{ fontSize: 9, fontFamily: "monospace", color: "#64748b", marginTop: 6 }}>
                {totalCritical > 0 ? "DANGER — COLLISION RISK" : totalWarning > 0 ? "CAUTION — TRAINS CLOSE" : "ALL SYSTEMS NOMINAL"}
              </p>
            </div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(100,116,139,0.35)", textAlign: "center", letterSpacing: 2, marginTop: "auto" }}>
              TICK #{tick} · {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
