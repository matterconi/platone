"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PerformancePoint {
  date: string;
  rawDate: string;
  avgScore: number;
  domainKnowledge: number;
  problemSolving: number;
  communication: number;
}

interface DashboardStatsProps {
  performancePoints: PerformancePoint[];
  totalInterviews: number;
  totalMinutes: number;
  credits: number;
  planCredits: number;
  latestStrengths: string[];
  latestWeaknesses: string[];
  avgDomainKnowledge: number;
  avgProblemSolving: number;
  avgCommunication: number;
  plan: string | null;
}

const LIME = "#b8ff00";
const PURPLE = "#a78bfa";
const ORANGE = "#fb923c";

const SKILL_COLORS = [LIME, PURPLE, ORANGE];
const SKILL_LABELS = ["Dominio", "Problem Solving", "Comunicazione"];

const TIME_FILTERS = [
  { label: "7gg", days: 7 },
  { label: "30gg", days: 30 },
  { label: "90gg", days: 90 },
  { label: "Tutti", days: 0 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a20] border border-[rgba(240,237,230,0.12)] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[rgba(240,237,230,0.45)] text-xs mb-1">{label}</p>
      <p className="text-fg font-semibold text-base">
        {payload[0].value.toFixed(1)}{" "}
        <span className="text-[rgba(240,237,230,0.45)] font-normal text-xs">/ 10</span>
      </p>
    </div>
  );
}

function CreditsRing({
  credits,
  planCredits,
}: {
  credits: number;
  planCredits: number;
}) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const pct = planCredits > 0 ? Math.min(1, credits / planCredits) : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(240,237,230,0.07)" strokeWidth="4" />
      <circle
        cx="30" cy="30" r={r} fill="none" stroke={LIME} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="30" y="34" textAnchor="middle" fill="#f0ede6" fontSize="12" fontWeight="700" fontFamily="inherit">
        {credits}
      </text>
    </svg>
  );
}

export default function DashboardStats({
  performancePoints,
  totalInterviews,
  totalMinutes,
  credits,
  planCredits,
  latestStrengths,
  avgDomainKnowledge,
  avgProblemSolving,
  avgCommunication,
  plan,
}: DashboardStatsProps) {
  const [activeTab, setActiveTab] = useState(3);

  const filteredPoints = useMemo(() => {
    const filter = TIME_FILTERS[activeTab];
    if (!filter || filter.days === 0) return performancePoints;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.days);
    return performancePoints.filter((p) => new Date(p.rawDate) >= cutoff);
  }, [performancePoints, activeTab]);

  const overallAvg = useMemo(() => {
    if (!performancePoints.length) return null;
    const sum = performancePoints.reduce((a, p) => a + p.avgScore, 0);
    return sum / performancePoints.length;
  }, [performancePoints]);

  const skillsData = useMemo(
    () => [
      { name: SKILL_LABELS[0], value: avgDomainKnowledge || 0.01 },
      { name: SKILL_LABELS[1], value: avgProblemSolving || 0.01 },
      { name: SKILL_LABELS[2], value: avgCommunication || 0.01 },
    ],
    [avgDomainKnowledge, avgProblemSolving, avgCommunication]
  );

  const totalSkillAvg = useMemo(
    () =>
      performancePoints.length
        ? ((avgDomainKnowledge + avgProblemSolving + avgCommunication) / 3).toFixed(1)
        : "—",
    [avgDomainKnowledge, avgProblemSolving, avgCommunication, performancePoints.length]
  );

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const PLAN_LABELS: Record<string, string> = {
    casual: "Casual",
    regular: "Regular",
    pro: "Pro",
  };

  const cardBase = "bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-5 flex flex-col gap-2 hover:ring-[rgba(184,255,0,0.15)] hover:shadow-[0_0_24px_rgba(184,255,0,0.04)] transition-all duration-300";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* ── Performance chart — 3 cols on lg ── */}
      <motion.div
        variants={cardVariants}
        className="col-span-2 lg:col-span-3 group relative bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-5 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_32px_rgba(184,255,0,0.05)] transition-all duration-300"
      >
        {/* Section label + score */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-accent/50">01</span>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
              Performance
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold leading-none text-accent">
              {overallAvg !== null ? overallAvg.toFixed(1) : "—"}
            </span>
            <span className="text-[rgba(240,237,230,0.4)] text-lg">/ 10</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-44">
          {filteredPoints.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-30">
                <path
                  d="M4 24 L10 16 L16 20 L22 10 L28 14"
                  stroke="#f0ede6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              <p className="text-[rgba(240,237,230,0.35)] text-sm text-center">
                Nessuna intervista valutata ancora
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPoints} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LIME} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={LIME} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,237,230,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(240,237,230,0.35)", fontSize: 11 }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "rgba(240,237,230,0.35)", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(240,237,230,0.1)" }} />
                <Area
                  type="monotone" dataKey="avgScore" stroke={LIME} strokeWidth={2.5}
                  fill="url(#limeGradient)"
                  dot={{ fill: LIME, r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: LIME, r: 5, strokeWidth: 2, stroke: "#07070a" }}
                  isAnimationActive={true} animationDuration={800} animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Time filter tabs */}
        <div className="flex items-center gap-2">
          {TIME_FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                activeTab === i
                  ? "bg-accent text-black"
                  : "bg-white/5 text-[rgba(240,237,230,0.45)] hover:text-fg"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Skills — spans 2 rows on lg ── */}
      <motion.div
        variants={cardVariants}
        className="col-span-2 lg:col-span-1 lg:row-span-2 group bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-5 flex flex-col gap-4 hover:ring-[rgba(184,255,0,0.15)] hover:shadow-[0_0_24px_rgba(184,255,0,0.04)] transition-all duration-300"
      >
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
          Distribuzione skills
        </p>

        <div className="flex flex-col items-center gap-1 flex-1 justify-center">
          <div className="relative">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={skillsData} cx="50%" cy="50%"
                  innerRadius={46} outerRadius={64}
                  dataKey="value" strokeWidth={0} paddingAngle={3}
                  animationBegin={200} animationDuration={700}
                >
                  {skillsData.map((_, idx) => (
                    <Cell key={idx} fill={SKILL_COLORS[idx]} opacity={performancePoints.length ? 1 : 0.25} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[rgba(240,237,230,0.4)] text-[10px] uppercase tracking-wider">Media</span>
              <span className="font-display text-2xl font-bold text-fg leading-none">{totalSkillAvg}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2.5 mt-2">
            {SKILL_LABELS.map((label, i) => {
              const scores = [avgDomainKnowledge, avgProblemSolving, avgCommunication];
              return (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: SKILL_COLORS[i] }} />
                    <span className="text-[rgba(240,237,230,0.55)] text-xs">{label}</span>
                  </div>
                  <span className="text-fg text-xs font-semibold tabular-nums">
                    {performancePoints.length ? scores[i].toFixed(1) : "—"}
                    <span className="text-[rgba(240,237,230,0.3)] font-normal"> /10</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Interviste + Pratica combined ── */}
      <motion.div variants={cardVariants} className={cardBase}>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
          Interviste
        </p>
        <span className="font-display text-3xl font-bold leading-none text-accent">
          {totalInterviews}
        </span>
        <span className="text-[rgba(240,237,230,0.4)] text-xs">
          completate · {totalMinutes > 0 ? timeLabel : "0m"} pratica
        </span>
      </motion.div>

      {/* ── Crediti ── */}
      <motion.div variants={cardVariants} className={cardBase}>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
              Crediti
            </p>
            {plan && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent w-fit">
                {PLAN_LABELS[plan] ?? plan}
              </span>
            )}
          </div>
          <CreditsRing credits={credits} planCredits={planCredits} />
        </div>
        <p className="text-[rgba(240,237,230,0.4)] text-xs">
          <span className="text-fg font-semibold">{credits}</span>
          {planCredits > 0 && <span> / {planCredits}</span>}
          {" "}rimanenti
        </p>
      </motion.div>

      {/* ── Punti di forza ── */}
      <motion.div variants={cardVariants} className={cn(cardBase, "col-span-2 lg:col-span-1")}>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
          Punti di forza
        </p>
        {latestStrengths.length > 0 ? (
          <div className="flex flex-col gap-2 mt-1">
            {latestStrengths.slice(0, 2).map((s, i) => (
              <span
                key={i}
                className="text-xs text-black font-semibold bg-accent rounded-full px-2.5 py-1 leading-snug line-clamp-1"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[rgba(240,237,230,0.35)] text-xs leading-snug">
            Completa un&apos;intervista
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
