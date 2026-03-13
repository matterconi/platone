"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import InterviewsShowcase from "@/components/InterviewsShowcase";
import { useEffect, useRef, useState } from "react";

const QUESTIONS = [
  "Raccontami di una sfida tecnica difficile che hai affrontato di recente...",
  "Come gestisci il conflitto all'interno del team?",
  "Descrivimi il tuo approccio alla code review...",
  "Qual è la tua strategia per imparare nuove tecnologie?",
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="hero-gradient" aria-hidden="true" />
        <Navbar />

        <div className="hero-fade-bottom" aria-hidden="true" />
        <div className="relative px-6 pt-24 pb-20 max-w-5xl mx-auto">
          {/* Floating radial glow */}
          <motion.div
            aria-hidden="true"
            className="absolute top-1/2 left-1/4 w-150 h-150 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(184,255,0,0.08) 0%, transparent 65%)",
            }}
            animate={{
              x:       ["-50%", "-46%", "-54%", "-50%"],
              y:       ["-50%", "-54%", "-47%", "-50%"],
              scale:   [1, 1.1, 0.93, 1],
              opacity: [1, 0.8, 0.9, 1],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div variants={container} initial="hidden" animate="visible">

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">

              {/* Left: headline + desc + CTA (CTA hidden on mobile) */}
              <div className="flex flex-col shrink-0 items-center text-center lg:items-start lg:text-left">
                <motion.h1
                  variants={fadeUp}
                  className="font-display text-6xl sm:text-7xl font-extrabold leading-[0.93] tracking-tight mb-8"
                >
                  Allenati per il
                  <br />
                  <motion.span
                    className="text-accent"
                    animate={{
                      textShadow: [
                        "0 0 0px rgba(184,255,0,0)",
                        "0 0 28px rgba(184,255,0,0.28), 0 0 56px rgba(184,255,0,0.08)",
                        "0 0 0px rgba(184,255,0,0)",
                      ],
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  >
                    colloquio
                  </motion.span>
                  <br />
                  che conta.
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="text-base text-white/45 leading-[1.8] max-w-sm mb-0 lg:mb-12"
                >
                  Parla con un AI voice coach, ricevi feedback strutturato e misura
                  i tuoi progressi — sessione dopo sessione.
                </motion.p>

                {/* CTA — tablet + desktop */}
                <motion.div variants={fadeUp} className="hidden md:flex flex-wrap items-center gap-6 mt-12">
                  <Link href="/interview/new" className="cta-primary">
                    {isLoggedIn ? "Nuova interview" : "Inizia gratis"}
                    <ArrowRight />
                  </Link>
                </motion.div>
              </div>

              {/* Right: interview preview card */}
              <motion.div variants={fadeUp} className="shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
                <InterviewPreviewCard />
              </motion.div>

              {/* CTA — mobile only, below demo */}
              <motion.div variants={fadeUp} className="flex md:hidden flex-wrap items-center justify-center gap-6">
                <Link href="/interview/new" className="cta-primary">
                  {isLoggedIn ? "Nuova interview" : "Inizia gratis"}
                  <ArrowRight />
                </Link>
              </motion.div>

            </div>

          </motion.div>
        </div>
      </section>

      {/* Marquee — outside overflow-hidden so cards aren't clipped */}
      <InterviewsShowcase />
    </div>
  );
}

/* ── Waveform ── */

const BARS = [
  8, 14, 22, 35, 48, 42, 55, 60, 45, 30, 18, 25, 50, 58, 46, 38,
  52, 62, 54, 42, 33, 47, 58, 44, 36, 26, 16, 28, 38, 30, 20, 12,
];

function WaveformVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const computed = Math.max(2, Math.floor((w - (BARS.length - 1) * 3) / BARS.length));
      setBarWidth(computed);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="waveform"
      style={{ height: "52px", marginBottom: "16px" }}
      aria-hidden="true"
    >
      {BARS.map((h, i) => (
        <motion.div
          key={i}
          className="wave-bar"
          style={{
            height:  `${Math.round(h * 0.85)}px`,
            opacity: 0.18 + (h / 62) * 0.82,
            width:   `${barWidth}px`,
          }}
          animate={{ scaleY: [0.2, 1, 0.48, 0.86, 0.22, 0.64, 0.35, 0.2] }}
          transition={{
            duration: 1.8 + (h / 62) * 1.4,
            repeat:   Infinity,
            ease:     "easeInOut",
            delay:    i * 0.075,
            times:    [0, 0.12, 0.28, 0.45, 0.62, 0.78, 0.9, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ── Interview preview card ── */

function InterviewPreviewCard() {
  return (
    <div className="hero-preview-card">
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/cartoon-avatar.png" alt="AI Interviewer" width={34} height={34} style={{ borderRadius: "50%", flexShrink: 0, objectFit: "cover", display: "block" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
              Alex · Tech Interviewer
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)" }}>
              Ingegneria Software
            </div>
          </div>
        </div>
        <LiveBadge />
      </div>

      {/* Compact waveform */}
      <WaveformVisualizer />

      {/* Typewriter question bubble */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px",
          padding: "12px 14px",
          marginBottom: "0",
          fontSize: "12.5px",
          lineHeight: "1.6",
          color: "rgba(255,255,255,0.6)",
          height: "72px",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <TypewriterQuestion />
      </div>

      {/* Score section */}
      <div style={{ marginTop: "16px" }}>
        <div
          style={{
            fontSize: "9px",
            fontWeight: "700",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Feedback
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ScoreRow label="Comunicazione" value={82} delay={0} />
          <ScoreRow label="Chiarezza"      value={76} delay={0.2} />
          <ScoreRow label="Confidenza"     value={71} delay={0.4} />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function LiveBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <motion.span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#B8FF00",
          display: "block",
          boxShadow: "0 0 6px rgba(184,255,0,0.9)",
        }}
        animate={{ opacity: [1, 0.25, 1], scale: [1, 0.75, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        style={{
          fontSize: "9px",
          fontWeight: "700",
          color: "#B8FF00",
          letterSpacing: "0.1em",
        }}
      >
        LIVE
      </span>
    </div>
  );
}

function TypewriterQuestion() {
  const [qIndex,    setQIndex]    = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [phase,     setPhase]     = useState<"typing" | "hold" | "erasing">("typing");

  useEffect(() => {
    const current = QUESTIONS[qIndex];

    if (phase === "typing") {
      if (charIndex < current.length) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, 36);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("erasing"), 2600);
        return () => clearTimeout(t);
      }
    }

    if (phase === "erasing") {
      if (charIndex > 0) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, 16);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          setQIndex((i) => (i + 1) % QUESTIONS.length);
          setPhase("typing");
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [phase, charIndex, qIndex]);

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
        style={{ color: "#B8FF00", marginLeft: "1px" }}
      >
        |
      </motion.span>
    </span>
  );
}

function ScoreRow({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.38)", width: "88px", flexShrink: 0 }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "3px",
          background: "rgba(255,255,255,0.07)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #B8FF00, #7AE200)",
            borderRadius: "99px",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, delay: 0.9 + delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", width: "22px", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 7h10M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
