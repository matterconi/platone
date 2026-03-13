"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from "recharts";
import FadeInView from "@/components/FadeInView";

/* ── Data ── */
const SCORE_DATA = [
  { session: "S1", score: 42 },
  { session: "S2", score: 51 },
  { session: "S3", score: 49 },
  { session: "S4", score: 58 },
  { session: "S5", score: 63 },
  { session: "S6", score: 71 },
  { session: "S7", score: 68 },
  { session: "S8", score: 79 },
  { session: "S9", score: 83 },
];

const STATS = [
  {
    value: "+34", unit: "pt",
    label: "miglioramento medio",
    context: "sui punteggi in 9 sessioni",
  },
  {
    value: "78", unit: "%",
    label: "degli utenti migliora",
    context: "già dopo 5 allenamenti",
  },
  {
    value: "3", unit: "×",
    label: "più sicuri di sé",
    context: "dopo 10 sessioni consecutive",
  },
];

/* ── Custom tooltip ── */
function ChartTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f0e0c",
      border: "1px solid rgba(240,237,230,0.12)",
      borderRadius: 8,
      padding: "8px 12px",
    }}>
      <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", marginBottom: 3 }}>
        Sessione {label?.replace("S", "")}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 20, color: "#b8ff00", lineHeight: 1 }}>
          {payload[0].value}
        </span>
        <span style={{ fontSize: 11, color: "rgba(240,237,230,0.35)" }}>pt</span>
      </div>
    </div>
  );
}

/* ── Main section ── */
export default function StatsSection() {
  return (
    <section className="relative py-10 md:py-20 overflow-hidden">

      {/* Warm ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">

        {/* ── Header ── */}
        <FadeInView className="mb-14">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-[1.1]">
              Ogni sessione è<br />
              un investimento<br />
              <span className="text-accent">nel tuo futuro.</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-sm mt-3" style={{ color: "rgba(240,237,230,0.38)" }}>
              Chi si allena con Interspeak migliora in modo misurabile — sessione dopo sessione, skill dopo skill.
            </p>
          </div>
        </FadeInView>

        {/* ── Main grid: chart + stats stack ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-stretch">

          {/* Chart card */}
          <FadeInView delay={0.1}>
            <div className="step-card flex flex-col h-full">
              <div className="step-card-line" aria-hidden="true" />

              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-fg text-base leading-tight">
                    Progressione del punteggio
                  </h3>
                  <p className="text-xs leading-relaxed max-w-65" style={{ color: "rgba(240,237,230,0.38)" }}>
                    Punteggio medio per sessione. La svolta avviene tipicamente alla 5ª.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display font-extrabold leading-none" style={{ fontSize: "1.6rem", color: "#b8ff00" }}>
                    +97%
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(240,237,230,0.28)" }}>
                    42 → 83 pt
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0" style={{ minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={SCORE_DATA} margin={{ top: 16, right: 12, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#b8ff00" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#b8ff00" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
                  <XAxis dataKey="session" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[30, 100]} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} tickCount={5} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
<ReferenceDot x="S1" y={42} r={5} fill="rgba(245,158,11,0.85)" stroke="#0f0f13" strokeWidth={2} />
                  <ReferenceDot x="S9" y={83} r={5} fill="#b8ff00" stroke="#0f0f13" strokeWidth={2} />
                  <Area type="monotone" dataKey="score" stroke="#b8ff00" strokeWidth={2} fill="url(#scoreGrad)" dot={false} activeDot={{ fill: "#b8ff00", r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              </div>

              <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: "rgba(245,158,11,0.85)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(240,237,230,0.28)" }}>Punto di partenza (42 pt)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#b8ff00" }} />
                  <span className="text-[10px]" style={{ color: "rgba(240,237,230,0.28)" }}>Punto di arrivo (83 pt)</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-7 h-px" style={{ borderTop: "1px dashed rgba(245,158,11,0.4)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(240,237,230,0.28)" }}>Punto di svolta</span>
                </div>
              </div>
            </div>
          </FadeInView>

          {/* Stats stack */}
          <div className="flex flex-col gap-4">
            {STATS.map((s, i) => (
              <FadeInView key={s.label} delay={0.1 + i * 0.08}>
                <div className="step-card flex-1 text-center md:text-left">
                  <div className="step-card-line" aria-hidden="true" />
                  <div
                    className="font-display leading-none font-extrabold"
                    style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)" }}
                  >
                    <span className="text-fg">{s.value}</span>
                    {s.unit && (
                      <span className="text-accent" style={{ fontSize: "0.55em", marginLeft: "0.15em" }}>{s.unit}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold mt-2" style={{ color: "rgba(240,237,230,0.65)" }}>
                    {s.label}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(240,237,230,0.3)" }}>
                    {s.context}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
