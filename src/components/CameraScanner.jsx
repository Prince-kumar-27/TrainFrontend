import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./CameraScanner.css"; // import the new CSS

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
    <div className="camera-scanner-container">
      <div className="camera-scanner-header">
        <div>
          <p className="camera-scanner-title">Live QR Scanner</p>
          <p className="camera-scanner-subtitle">
            {active ? "Point camera at a track QR code — auto-detects" : "Tap Start Camera to begin scanning"}
          </p>
        </div>
        <button
          onClick={onToggle}
          className={`camera-scanner-button ${active ? "active" : ""}`}
        >
          {starting ? "Starting…" : active ? "⏹ Stop" : "📷 Start Camera"}
        </button>
      </div>

      {error && <div className="camera-scanner-error">{error}</div>}
      {lastScan && <div className="camera-scanner-success">✓ Scanned! {lastScan}</div>}

      <div id={QR_REGION_ID} style={{ display: active ? "block" : "none" }} />

      {!active && !error && (
        <div className="camera-scanner-off">
          <span>📷</span>
          <p>Camera is off</p>
        </div>
      )}
    </div>
  );
}