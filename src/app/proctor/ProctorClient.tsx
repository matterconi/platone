"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Minimal MediaPipe type declarations (loaded from CDN) ──────────────────
declare global {
  interface Window {
    FaceMesh: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (opts: object) => void;
      onResults: (cb: (results: FaceMeshResults) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
    };
    Camera: new (
      video: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      }
    ) => { start: () => void };
  }
}

interface FaceMeshResults {
  multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
}

interface LogItem {
  id: number;
  time: string;
  severity: "info" | "warn" | "danger" | "ok";
  text: string;
}

interface ProctorState {
  running: boolean;
  sessionStart: number | null;
  riskScore: number;
  gazeOffTime: number;
  gazeOffStart: number | null;
  lastGaze: string;
  gazeEventCount: number;
  tabSwitches: number;
  faceAbsent: boolean;
  faceAbsenceStart: number | null;
  faceLostTime: number;
  headTurnCount: number;
  lastHeadAngle: number;
}

const GAZE_THRESHOLD = 0.15;
const HEAD_YAW_THRESHOLD = 20;
let logCounter = 0;

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export default function ProctorClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mutable state accessed from callbacks — keep in a ref to avoid stale closures
  const s = useRef<ProctorState>({
    running: false,
    sessionStart: null,
    riskScore: 0,
    gazeOffTime: 0,
    gazeOffStart: null,
    lastGaze: "center",
    gazeEventCount: 0,
    tabSwitches: 0,
    faceAbsent: false,
    faceAbsenceStart: null,
    faceLostTime: 0,
    headTurnCount: 0,
    lastHeadAngle: 0,
  });

  // React-driven UI state
  const [cameraActive, setCameraActive] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([
    { id: 0, time: "00:00", severity: "ok", text: "Session started. Awaiting camera." },
  ]);
  const [sessionTime, setSessionTime] = useState("00:00");
  const [gazeArrow, setGazeArrow] = useState({ char: "↑", cls: "center", label: "CENTER" });
  const [metrics, setMetrics] = useState({ gazeOff: "0s", tabs: 0, faceLost: "0s" });
  const [risk, setRisk] = useState({
    score: 0,
    level: "LOW RISK",
    sub: "Candidate is focused and present. No suspicious behavior detected.",
    color: "#00ff88",
    arcOffset: 188.5,
  });
  const [bars, setBars] = useState({ gaze: 0, tab: 0, face: 0, head: 0 });
  const [statusPill, setStatusPill] = useState({ cls: "ok", text: "● MONITORING ACTIVE" });
  const [flashActive, setFlashActive] = useState(false);
  const [tabAlertVisible, setTabAlertVisible] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addLog = useCallback((text: string, severity: LogItem["severity"] = "info") => {
    const time = s.current.sessionStart
      ? formatTime(Date.now() - s.current.sessionStart)
      : "00:00";
    setLogs((prev) =>
      [{ id: ++logCounter, time, severity, text }, ...prev].slice(0, 50)
    );
  }, []);

  const triggerFlash = useCallback(() => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);
  }, []);

  const updateRisk = useCallback(() => {
    const st = s.current;
    const elapsed = st.sessionStart ? (Date.now() - st.sessionStart) / 1000 : 1;
    const gazeRatio = Math.min(st.gazeOffTime / elapsed, 1);
    const tabScore = Math.min(st.tabSwitches * 15, 60);
    const faceRatio = Math.min(st.faceLostTime / elapsed, 1);
    const headScore = Math.min(st.headTurnCount * 5, 20);
    const score = Math.min(
      Math.round(gazeRatio * 40 + tabScore + faceRatio * 30 + headScore),
      100
    );
    st.riskScore = score;

    const gp = Math.round(gazeRatio * 100);
    const tp = Math.min(st.tabSwitches * 15, 100);
    const fp = Math.round(faceRatio * 100);
    const hp = Math.min(st.headTurnCount * 5, 100);
    setBars({ gaze: gp, tab: tp, face: fp, head: hp });

    const arcOffset = 188.5 - (score / 100) * 188.5;

    let color: string, level: string, sub: string, pillCls: string, pillText: string;
    if (score < 20) {
      color = "#00ff88"; level = "LOW RISK"; pillCls = "ok"; pillText = "● MONITORING ACTIVE";
      sub = "Candidate appears focused. No suspicious behavior.";
    } else if (score < 55) {
      color = "#ffaa00"; level = "MODERATE RISK"; pillCls = "warn"; pillText = "⚠ ANOMALIES DETECTED";
      sub = "Some suspicious signals detected. Monitor closely.";
    } else {
      color = "#ff3355"; level = "HIGH RISK"; pillCls = "danger"; pillText = "⛔ HIGH RISK CANDIDATE";
      sub = "Multiple violations detected. Possible cheating attempt.";
    }
    setRisk({ score, level, sub, color, arcOffset });
    setStatusPill({ cls: pillCls, text: pillText });
  }, []);

  const updateMetrics = useCallback(() => {
    const st = s.current;
    setMetrics({
      gazeOff: st.gazeOffTime > 0 ? `${Math.round(st.gazeOffTime)}s` : "0s",
      tabs: st.tabSwitches,
      faceLost: st.faceLostTime > 0 ? `${Math.round(st.faceLostTime)}s` : "0s",
    });
  }, []);

  // ── Face absence ─────────────────────────────────────────────────────────
  const handleFaceAbsence = useCallback(
    (absent: boolean) => {
      const st = s.current;
      if (absent && !st.faceAbsent) {
        st.faceAbsent = true;
        st.faceAbsenceStart = Date.now();
        setGazeArrow({ char: "✕", cls: "suspicious", label: "NO FACE" });
        faceAbsenceTimerRef.current = setTimeout(() => {
          addLog("Face not detected — candidate may have left", "danger");
          triggerFlash();
        }, 2000);
      }
      if (!absent && st.faceAbsent) {
        st.faceAbsent = false;
        if (faceAbsenceTimerRef.current) clearTimeout(faceAbsenceTimerRef.current);
        if (st.faceAbsenceStart) {
          st.faceLostTime += (Date.now() - st.faceAbsenceStart) / 1000;
        }
        addLog("Face reacquired", "ok");
      }
    },
    [addLog, triggerFlash]
  );

  // ── Gaze analysis ────────────────────────────────────────────────────────
  const analyzeGaze = useCallback(
    (lm: Array<{ x: number; y: number; z: number }>) => {
      const st = s.current;
      if (!lm[468] || !lm[473]) return;

      const leftEyeCenter = (lm[33].x + lm[133].x) / 2;
      const rightEyeCenter = (lm[362].x + lm[263].x) / 2;
      const leftEyeWidth = Math.abs(lm[33].x - lm[133].x);
      const rightEyeWidth = Math.abs(lm[263].x - lm[362].x);
      const leftDev = (lm[468].x - leftEyeCenter) / (leftEyeWidth || 0.1);
      const rightDev = (lm[473].x - rightEyeCenter) / (rightEyeWidth || 0.1);
      const avgHorizDev = (leftDev + rightDev) / 2;

      const leftEyeCenterY = (lm[159].y + lm[145].y) / 2;
      const leftEyeHeight = Math.abs(lm[159].y - lm[145].y);
      const leftVertDev = (lm[468].y - leftEyeCenterY) / (leftEyeHeight || 0.05);

      let gazeDir = "center";
      let arrowChar = "↑", arrowCls = "center", arrowLabel = "FOCUSED";

      if (Math.abs(avgHorizDev) > GAZE_THRESHOLD || leftVertDev > 0.3) {
        if (leftVertDev > 0.25) {
          gazeDir = "down"; arrowChar = "↓"; arrowCls = "suspicious"; arrowLabel = "LOOKING DOWN";
        } else if (avgHorizDev > GAZE_THRESHOLD) {
          gazeDir = "right"; arrowChar = "→"; arrowCls = "away"; arrowLabel = "LOOKING RIGHT";
        } else {
          gazeDir = "left"; arrowChar = "←"; arrowCls = "away"; arrowLabel = "LOOKING LEFT";
        }
      }

      setGazeArrow({ char: arrowChar, cls: arrowCls, label: arrowLabel });

      if (gazeDir !== "center") {
        if (!st.gazeOffStart) {
          st.gazeOffStart = Date.now();
        } else if (Date.now() - st.gazeOffStart > 2000 && st.lastGaze === "center") {
          addLog(`Gaze deviation: looking ${gazeDir}`, "warn");
          triggerFlash();
          st.gazeEventCount++;
        }
        st.gazeOffTime += 0.033;
      } else {
        if (st.gazeOffStart && Date.now() - st.gazeOffStart > 500) {
          st.gazeOffStart = null;
        }
      }
      st.lastGaze = gazeDir;
    },
    [addLog, triggerFlash]
  );

  // ── Head pose ────────────────────────────────────────────────────────────
  const analyzeHeadPose = useCallback(
    (lm: Array<{ x: number; y: number; z: number }>) => {
      const st = s.current;
      const eyeMidX = (lm[33].x + lm[263].x) / 2;
      const yaw = (lm[1].x - eyeMidX) / (Math.abs(lm[263].x - lm[33].x) || 0.1);
      const yawDeg = yaw * 90;
      if (Math.abs(yawDeg - st.lastHeadAngle) > 25) {
        st.headTurnCount++;
        if (Math.abs(yawDeg) > HEAD_YAW_THRESHOLD) {
          addLog(`Head turned significantly (${Math.round(yawDeg)}°)`, "warn");
        }
        st.lastHeadAngle = yawDeg;
      }
    },
    [addLog]
  );

  // ── Canvas drawing ───────────────────────────────────────────────────────
  const drawMinimalMesh = useCallback(
    (
      lm: Array<{ x: number; y: number; z: number }>,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D
    ) => {
      ctx.strokeStyle = "rgba(0,255,136,0.3)";
      ctx.lineWidth = 0.5;
      const leftEye = [33, 160, 158, 133, 153, 144];
      const rightEye = [263, 387, 385, 362, 380, 373];
      [leftEye, rightEye].forEach((eye) => {
        ctx.beginPath();
        eye.forEach((i, idx) => {
          const p = lm[i];
          const x = p.x * canvas.width;
          const y = p.y * canvas.height;
          idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      });
      [468, 473].forEach((i) => {
        if (!lm[i]) return;
        const p = lm[i];
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,255,136,0.8)";
        ctx.fill();
      });
      const nose = lm[1];
      ctx.beginPath();
      ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,136,255,0.8)";
      ctx.fill();
    },
    []
  );

  // ── FaceMesh results handler ─────────────────────────────────────────────
  const onFaceMeshResults = useCallback(
    (
      results: FaceMeshResults,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement
    ) => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.multiFaceLandmarks?.length) {
        handleFaceAbsence(true);
        return;
      }
      handleFaceAbsence(false);
      const lm = results.multiFaceLandmarks[0];
      drawMinimalMesh(lm, canvas, ctx);
      analyzeGaze(lm);
      analyzeHeadPose(lm);
      updateMetrics();
      updateRisk();
    },
    [handleFaceAbsence, drawMinimalMesh, analyzeGaze, analyzeHeadPose, updateMetrics, updateRisk]
  );

  // ── Fallback simulation (when MediaPipe CDN is unavailable) ──────────────
  const startFallback = useCallback(() => {
    addLog("Fallback mode: simulation active.", "info");
    s.current.sessionStart = s.current.sessionStart ?? Date.now();
    s.current.running = true;
    const interval = setInterval(() => {
      if (!s.current.running) { clearInterval(interval); return; }
      const r = Math.random();
      if (r < 0.05) {
        s.current.gazeOffTime += 1;
        const dirs: [string, string, string] = ["←", "→", "↓"];
        addLog("Gaze deviation detected (simulated)", "warn");
        setGazeArrow({ char: dirs[Math.floor(Math.random() * 3)], cls: "away", label: "LOOKING AWAY" });
        triggerFlash();
        setTimeout(() => setGazeArrow({ char: "↑", cls: "center", label: "FOCUSED" }), 1500);
      } else if (r < 0.07) {
        s.current.headTurnCount++;
        addLog("Head turn detected (simulated)", "warn");
      }
      updateMetrics();
      updateRisk();
    }, 3000);
    return () => clearInterval(interval);
  }, [addLog, triggerFlash, updateMetrics, updateRisk]);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      s.current.sessionStart = Date.now();
      s.current.running = true;
      setCameraActive(true);
      addLog("Camera enabled. Loading face analysis…", "ok");

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults((results) => onFaceMeshResults(results, canvas, ctx, video));

        const cam = new window.Camera(video, {
          onFrame: async () => { await faceMesh.send({ image: video }); },
          width: 640,
          height: 480,
        });
        cam.start();
        addLog("MediaPipe FaceMesh loaded. Real-time analysis active.", "ok");
      } catch {
        addLog("Using fallback detection (CDN unavailable).", "warn");
        startFallback();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      addLog("Camera access denied: " + msg, "danger");
    }
  }, [addLog, onFaceMeshResults, startFallback]);

  // ── Tab switch detection ─────────────────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        s.current.tabSwitches++;
        setMetrics((prev) => ({ ...prev, tabs: s.current.tabSwitches }));
        addLog(`Tab/window switch #${s.current.tabSwitches} detected`, "danger");
        triggerFlash();
        updateRisk();
      } else {
        setTabAlertVisible(true);
        setTimeout(() => setTabAlertVisible(false), 2500);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [addLog, triggerFlash, updateRisk]);

  // ── Session timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (s.current.sessionStart) {
        setSessionTime(formatTime(Date.now() - s.current.sessionStart));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      s.current.running = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (faceAbsenceTimerRef.current) clearTimeout(faceAbsenceTimerRef.current);
    };
  }, []);

  // ── Derived colours ──────────────────────────────────────────────────────
  const gazeMetricColor =
    s.current.gazeOffTime > 30 ? "#ff3355" : s.current.gazeOffTime > 10 ? "#ffaa00" : "#00ff88";

  return (
    <>
      {/* Scoped CSS — kept in sync with the original design spec */}
      <style>{`
        .proctor-root { font-family: 'IBM Plex Sans', sans-serif; }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

        .p-body { background:#0a0a0f; color:#e0e0f0; min-height:100vh; overflow-x:hidden; }
        .p-body::before {
          content:''; position:fixed; inset:0;
          background-image:
            linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
          background-size:40px 40px; pointer-events:none; z-index:0;
        }
        .p-layout {
          position:relative; z-index:1; display:grid;
          grid-template-columns:1fr 340px; grid-template-rows:auto 1fr auto;
          min-height:100vh;
        }
        .p-header {
          grid-column:1/-1; border-bottom:1px solid #1e1e2e;
          padding:16px 28px; display:flex; align-items:center;
          justify-content:space-between; background:rgba(10,10,15,0.9);
          backdrop-filter:blur(10px); position:sticky; top:0; z-index:100;
        }
        .p-logo { font-family:'IBM Plex Mono',monospace; font-size:13px; letter-spacing:.15em; color:#00ff88; text-transform:uppercase; }
        .p-logo span { color:#555570; }
        .p-pill {
          font-family:'IBM Plex Mono',monospace; font-size:11px;
          padding:5px 12px; border-radius:2px; border:1px solid;
          letter-spacing:.1em; transition:all .3s;
        }
        .p-pill.ok    { border-color:#00ff88; color:#00ff88; background:rgba(0,255,136,.05); }
        .p-pill.warn  { border-color:#ffaa00; color:#ffaa00; background:rgba(255,170,0,.05); }
        .p-pill.danger{ border-color:#ff3355; color:#ff3355; background:rgba(255,51,85,.05); animation:pulse-danger .5s ease infinite alternate; }
        @keyframes pulse-danger { from{background:rgba(255,51,85,.05)} to{background:rgba(255,51,85,.15)} }

        .p-main { padding:28px; display:flex; flex-direction:column; gap:20px; border-right:1px solid #1e1e2e; }

        .p-cam-wrap { position:relative; width:100%; max-width:560px; aspect-ratio:4/3; border:1px solid #1e1e2e; background:#050508; overflow:hidden; }
        .p-cam-wrap::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(0,255,136,.02) 0%,transparent 60%); pointer-events:none; z-index:2; }
        .p-cam-wrap::after {
          content:''; position:absolute; inset:8px;
          border:1px solid transparent; border-top-color:#00ff88; border-left-color:#00ff88;
          clip-path:polygon(0 0,30px 0,30px 2px,2px 2px,2px 30px,0 30px);
          pointer-events:none; z-index:3;
        }
        .p-video { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); display:block; }
        .p-canvas { position:absolute; inset:0; width:100%; height:100%; transform:scaleX(-1); z-index:1; }

        .p-gaze-display { position:absolute; bottom:12px; left:12px; right:12px; z-index:4; display:flex; align-items:center; gap:10px; }
        .p-gaze-label { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#555570; letter-spacing:.1em; }
        .p-gaze-arrow { font-size:22px; line-height:1; transition:all .15s; filter:drop-shadow(0 0 6px currentColor); }
        .p-gaze-arrow.center    { color:#00ff88; }
        .p-gaze-arrow.away      { color:#ffaa00; }
        .p-gaze-arrow.suspicious{ color:#ff3355; }
        .p-gaze-text { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#555570; }

        .p-placeholder { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; z-index:5; background:#050508; }
        .p-cam-icon { width:48px; height:48px; border:1px solid #555570; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; }
        .p-placeholder p { font-size:12px; color:#555570; font-family:'IBM Plex Mono',monospace; }
        .p-start-btn {
          font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.1em;
          padding:10px 24px; background:transparent; border:1px solid #00ff88;
          color:#00ff88; cursor:pointer; text-transform:uppercase; transition:all .2s;
        }
        .p-start-btn:hover { background:rgba(0,255,136,.1); box-shadow:0 0 20px rgba(0,255,136,.2); }

        .p-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:#1e1e2e; max-width:560px; border:1px solid #1e1e2e; }
        .p-metric { background:#111118; padding:14px 16px; }
        .p-metric-label { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#555570; letter-spacing:.15em; text-transform:uppercase; margin-bottom:6px; }
        .p-metric-value { font-family:'IBM Plex Mono',monospace; font-size:22px; font-weight:600; color:#e0e0f0; line-height:1; }

        .p-sidebar { display:flex; flex-direction:column; overflow:hidden; }
        .p-sidebar-section { border-bottom:1px solid #1e1e2e; padding:20px; }
        .p-sidebar-title { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.2em; color:#555570; text-transform:uppercase; margin-bottom:14px; }

        .p-risk-wrapper { display:flex; align-items:center; gap:16px; }
        .p-risk-circle { width:72px; height:72px; position:relative; flex-shrink:0; }
        .p-risk-circle svg { transform:rotate(-90deg); }
        .p-score-text { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:600; }
        .p-risk-info { flex:1; }
        .p-risk-level { font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:600; margin-bottom:4px; }
        .p-risk-sub { font-size:11px; color:#555570; line-height:1.5; }

        .p-log { flex:1; overflow-y:auto; padding:0 20px; display:flex; flex-direction:column; max-height:320px; }
        .p-log::-webkit-scrollbar { width:3px; }
        .p-log::-webkit-scrollbar-thumb { background:#1e1e2e; }
        .p-log-item { display:flex; gap:10px; padding:8px 0; border-bottom:1px solid rgba(30,30,46,.5); animation:fadeSlide .3s ease; align-items:flex-start; }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .p-log-time { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#555570; flex-shrink:0; padding-top:2px; }
        .p-log-dot { width:6px; height:6px; border-radius:50%; margin-top:4px; flex-shrink:0; }
        .p-log-dot.info   { background:#555570; }
        .p-log-dot.warn   { background:#ffaa00; }
        .p-log-dot.danger { background:#ff3355; }
        .p-log-dot.ok     { background:#00ff88; }
        .p-log-text { font-size:11px; color:#e0e0f0; line-height:1.4; }

        .p-det-bars { display:flex; flex-direction:column; gap:10px; }
        .p-det-row { display:flex; flex-direction:column; gap:4px; }
        .p-det-header { display:flex; justify-content:space-between; font-family:'IBM Plex Mono',monospace; font-size:10px; }
        .p-det-name { color:#555570; }
        .p-det-bar { height:3px; background:#1e1e2e; position:relative; overflow:hidden; }
        .p-det-fill { height:100%; transition:width .4s ease; position:relative; }
        .p-det-fill::after { content:''; position:absolute; right:0; top:-2px; width:3px; height:7px; background:inherit; filter:brightness(1.5); }

        .p-footer {
          grid-column:1/-1; border-top:1px solid #1e1e2e; padding:12px 28px;
          display:flex; align-items:center; justify-content:space-between;
          font-family:'IBM Plex Mono',monospace; font-size:10px; color:#555570;
        }
        .p-footer-note { display:flex; align-items:center; gap:8px; }
        .p-dot-live { width:6px; height:6px; border-radius:50%; background:#00ff88; animation:blink 1s ease infinite alternate; }
        @keyframes blink { from{opacity:1} to{opacity:.3} }

        .p-flash { position:fixed; inset:0; background:rgba(255,51,85,.08); pointer-events:none; z-index:999; opacity:0; transition:opacity .1s; }
        .p-flash.active { opacity:1; }

        .p-tab-alert {
          position:fixed; top:0; left:0; right:0; background:#ff3355; color:white;
          text-align:center; font-family:'IBM Plex Mono',monospace; font-size:12px;
          letter-spacing:.1em; padding:10px; z-index:9999;
          transform:translateY(-100%); transition:transform .3s;
        }
        .p-tab-alert.show { transform:translateY(0); }
      `}</style>

      <div className="p-body">
        <div className={`p-flash ${flashActive ? "active" : ""}`} />
        <div className={`p-tab-alert ${tabAlertVisible ? "show" : ""}`}>
          ⚠ TAB SWITCH DETECTED — RETURNING TO INTERVIEW
        </div>

        <div className="p-layout">
          {/* ── Header ── */}
          <header className="p-header">
            <div className="p-logo">
              PROC<span>//</span>TOR <span>— Interview Monitor v0.1</span>
            </div>
            <div className={`p-pill ${statusPill.cls}`}>{statusPill.text}</div>
          </header>

          {/* ── Main ── */}
          <main className="p-main">
            {/* Camera */}
            <div className="p-cam-wrap">
              <video ref={videoRef} className="p-video" playsInline autoPlay muted />
              <canvas ref={canvasRef} className="p-canvas" />

              <div className="p-gaze-display">
                <span className="p-gaze-label">GAZE</span>
                <span className={`p-gaze-arrow ${gazeArrow.cls}`}>{gazeArrow.char}</span>
                <span className="p-gaze-text">{gazeArrow.label}</span>
              </div>

              {!cameraActive && (
                <div className="p-placeholder">
                  <div className="p-cam-icon">📷</div>
                  <p>Camera access required</p>
                  <button className="p-start-btn" onClick={startCamera}>
                    ENABLE CAMERA
                  </button>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="p-metrics">
              <div className="p-metric">
                <div className="p-metric-label">Gaze Off-Screen</div>
                <div className="p-metric-value" style={{ color: gazeMetricColor }}>
                  {metrics.gazeOff}
                </div>
              </div>
              <div className="p-metric">
                <div className="p-metric-label">Tab Switches</div>
                <div className="p-metric-value" style={{ color: "#ff3355" }}>
                  {metrics.tabs}
                </div>
              </div>
              <div className="p-metric">
                <div className="p-metric-label">Face Lost</div>
                <div className="p-metric-value">{metrics.faceLost}</div>
              </div>
            </div>
          </main>

          {/* ── Sidebar ── */}
          <div className="p-sidebar">
            {/* Risk assessment */}
            <div className="p-sidebar-section">
              <div className="p-sidebar-title">Risk Assessment</div>
              <div className="p-risk-wrapper">
                <div className="p-risk-circle">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#1e1e2e" strokeWidth="5" />
                    <circle
                      cx="36" cy="36" r="30" fill="none"
                      stroke={risk.color} strokeWidth="5"
                      strokeDasharray="188.5"
                      strokeDashoffset={risk.arcOffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset .5s ease, stroke .3s ease" }}
                    />
                  </svg>
                  <div className="p-score-text" style={{ color: risk.color }}>
                    {risk.score}
                  </div>
                </div>
                <div className="p-risk-info">
                  <div className="p-risk-level" style={{ color: risk.color }}>{risk.level}</div>
                  <div className="p-risk-sub">{risk.sub}</div>
                </div>
              </div>
            </div>

            {/* Detection bars */}
            <div className="p-sidebar-section">
              <div className="p-sidebar-title">Detection Signals</div>
              <div className="p-det-bars">
                {[
                  { label: "Gaze Deviation", pct: bars.gaze, color: "#ffaa00", id: "gaze" },
                  { label: "Tab/Window Switch", pct: bars.tab, color: "#ff3355", id: "tab" },
                  { label: "Face Absence", pct: bars.face, color: "#8855ff", id: "face" },
                  { label: "Head Rotation", pct: bars.head, color: "#0088ff", id: "head" },
                ].map(({ label, pct, color }) => (
                  <div className="p-det-row" key={label}>
                    <div className="p-det-header">
                      <span className="p-det-name">{label}</span>
                      <span style={{ color: "#e0e0f0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{pct}%</span>
                    </div>
                    <div className="p-det-bar">
                      <div
                        className="p-det-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log header */}
            <div className="p-sidebar-section" style={{ paddingBottom: 8 }}>
              <div className="p-sidebar-title">Event Log</div>
            </div>

            {/* Log entries */}
            <div className="p-log">
              {logs.map((item) => (
                <div className="p-log-item" key={item.id}>
                  <span className="p-log-time">{item.time}</span>
                  <span className={`p-log-dot ${item.severity}`} />
                  <span className="p-log-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="p-footer">
            <div className="p-footer-note">
              <div className="p-dot-live" />
              REAL-TIME ANALYSIS — All processing is local (no data sent)
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{sessionTime}</div>
          </footer>
        </div>
      </div>
    </>
  );
}
