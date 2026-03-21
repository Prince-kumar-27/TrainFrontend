import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QR_REGION_ID = "nexus-qr-reader";

function parseQRUrl(text) {
  try {
    const url = new URL(text.startsWith("http") ? text : "https://x.com/" + text.replace(/^\/?/, ""));
    const track = url.searchParams.get("track");
    const pos   = url.searchParams.get("pos");
    if (track && pos !== null) {
      const position = Number(pos);
      if (!isNaN(position)) return { trackId: track, position };
    }
    return null;
  } catch { return null; }
}

export default function CameraScanner({ onScan, active, onToggle }) {
  const scannerRef  = useRef(null);
  const cooldownRef = useRef(false);
  const [lastScan,  setLastScan]  = useState(null);
  const [error,     setError]     = useState(null);
  const [starting,  setStarting]  = useState(false);

  useEffect(() => {
    if (active) startScanner();
    else stopScanner();
    return () => { stopScanner(); };
  }, [active]);

  const startScanner = async () => {
    setError(null); setStarting(true);
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          if (cooldownRef.current) return;
          const result = parseQRUrl(text);
          if (result) {
            cooldownRef.current = true;
            setLastScan(`Track: ${result.trackId} — ${result.position} km`);
            onScan(result);
            setTimeout(() => { cooldownRef.current = false; setLastScan(null); }, 3000);
          }
        },
        () => {}
      );
    } catch (err) {
      const msg = err?.message ?? "";
      setError(msg.includes("ermission")
        ? "Camera permission denied. Allow camera access in your browser settings."
        : "Could not start camera: " + msg);
      onToggle();
    } finally { setStarting(false); }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
  };

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Live QR Scanner</p>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {active ? "Point camera at a track QR code — auto-detects" : "Tap Start Camera to begin scanning"}
          </p>
        </div>
        <button onClick={onToggle} style={{
          padding: "8px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
          border: `1px solid ${active ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)"}`,
          background: active ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
          color: active ? "#ef4444" : "#3b82f6",
        }}>
          {starting ? "Starting…" : active ? "⏹ Stop" : "📷 Start Camera"}
        </button>
      </div>

      {error && (
        <div style={{ margin: "0 12px 12px", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 13, border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      {lastScan && (
        <div style={{ margin: "0 12px 12px", padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: 13, fontWeight: 600, border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
          ✓ Scanned! {lastScan}
        </div>
      )}

      <div id={QR_REGION_ID} style={{ display: active ? "block" : "none", minHeight: active ? 280 : 0 }} />

      {!active && !error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", color: "#64748b", gap: 8 }}>
          <span style={{ fontSize: 36, opacity: 0.4 }}>📷</span>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Camera is off</p>
        </div>
      )}
    </div>
  );
}
