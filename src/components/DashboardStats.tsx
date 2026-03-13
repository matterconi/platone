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

// Custom tooltip for the line chart
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

// Circular SVG progress ring for credits
function CreditsRing({
  credits,
  planCredits,
}: {
  credits: number;
  planCredits: number;
}) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const pct = planCredits > 0 ? Math.min(1, credits / planCredits) : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="rgba(240,237,230,0.07)"
        strokeWidth="5"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={LIME}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fill="#f0ede6"
        fontSize="13"
        fontWeight="700"
        fontFamily="inherit"
      >
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
  const [activeTab, setActiveTab] = useState(3); // "Tutti" by default

  // Filter chart data by selected time period
  const filteredPoints = useMemo(() => {
    const filter = TIME_FILTERS[activeTab];
    if (!filter || filter.days === 0) return performancePoints;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.days);
    return performancePoints.filter((p) => new Date(p.rawDate) >= cutoff);
  }, [performancePoints, activeTab]);

  // Overall avg score
  const overallAvg = useMemo(() => {
    if (!performancePoints.length) return null;
    const sum = performancePoints.reduce((a, p) => a + p.avgScore, 0);
    return sum / performancePoints.length;
  }, [performancePoints]);

  // Skills donut data
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

  // Format minutes
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const PLAN_LABELS: Record<string, string> = {
    casual: "Casual",
    regular: "Regular",
    pro: "Pro",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* Row 1: Performance + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.55fr] gap-5">
        {/* Performance Score Card */}
        <motion.div
          variants={cardVariants}
          className="group relative bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-5 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_32px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)] mb-1">
                Performance nel tempo
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display text-5xl font-bold leading-none"
                  style={{ color: LIME }}
                >
                  {overallAvg !== null ? overallAvg.toFixed(1) : "—"}
                </span>
                <span className="text-[rgba(240,237,230,0.45)] text-lg">/ 10</span>
              </div>
            </div>
            <button className="flex items-center justify-center size-8 rounded-full bg-[rgba(184,255,0,0.12)] text-accent hover:bg-[rgba(184,255,0,0.22)] transition-colors text-sm font-bold">
              →
            </button>
          </div>

          {/* Chart */}
          <div className="h-44">
            {filteredPoints.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="opacity-30"
                >
                  <path
                    d="M4 24 L10 16 L16 20 L22 10 L28 14"
                    stroke="#f0ede6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-[rgba(240,237,230,0.35)] text-sm text-center">
                  Nessuna intervista valutata ancora
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredPoints}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LIME} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={LIME} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(240,237,230,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(240,237,230,0.35)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "rgba(240,237,230,0.35)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(240,237,230,0.1)" }} />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke={LIME}
                    strokeWidth={2.5}
                    fill="url(#limeGradient)"
                    dot={{ fill: LIME, r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: LIME, r: 5, strokeWidth: 2, stroke: "#07070a" }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
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

        {/* Skills Distribution Card */}
        <motion.div
          variants={cardVariants}
          className="group bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-4 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_32px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)]">
            Distribuzione skills
          </p>

          {/* Donut chart */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={skillsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={3}
                    animationBegin={200}
                    animationDuration={700}
                  >
                    {skillsData.map((_, idx) => (
                      <Cell key={idx} fill={SKILL_COLORS[idx]} opacity={performancePoints.length ? 1 : 0.25} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[rgba(240,237,230,0.45)] text-[10px] uppercase tracking-wider">
                  Media
                </span>
                <span className="font-display text-2xl font-bold text-fg leading-none">
                  {totalSkillAvg}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full flex flex-col gap-2.5 mt-1">
              {SKILL_LABELS.map((label, i) => {
                const scores = [avgDomainKnowledge, avgProblemSolving, avgCommunication];
                return (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SKILL_COLORS[i] }}
                      />
                      <span className="text-[rgba(240,237,230,0.6)] text-xs">{label}</span>
                    </div>
                    <span className="text-fg text-xs font-semibold tabular-nums">
                      {performancePoints.length ? scores[i].toFixed(1) : "—"}
                      <span className="text-[rgba(240,237,230,0.35)] font-normal"> /10</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 2: 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Interviste completate */}
        <motion.div
          variants={cardVariants}
          className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-2 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_20px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)]">
            Interviste
          </p>
          <span
            className="font-display text-4xl font-bold leading-none"
            style={{ color: LIME }}
          >
            {totalInterviews}
          </span>
          <span className="text-[rgba(240,237,230,0.45)] text-xs">completate</span>
        </motion.div>

        {/* Crediti */}
        <motion.div
          variants={cardVariants}
          className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-3 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_20px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)]">
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
          <p className="text-[rgba(240,237,230,0.45)] text-xs">
            <span className="text-fg font-semibold">{credits}</span>
            {planCredits > 0 && (
              <span> / {planCredits}</span>
            )}
            {" "}rimanenti
          </p>
        </motion.div>

        {/* Ore praticate */}
        <motion.div
          variants={cardVariants}
          className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-2 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_20px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)]">
            Pratica
          </p>
          <span className="font-display text-4xl font-bold leading-none text-fg">
            {totalMinutes > 0 ? timeLabel : "0m"}
          </span>
          <span className="text-[rgba(240,237,230,0.45)] text-xs">tempo totale</span>
        </motion.div>

        {/* Punti di forza */}
        <motion.div
          variants={cardVariants}
          className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-3 hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_20px_rgba(184,255,0,0.05)] transition-all duration-300"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.45)]">
            Punti di forza
          </p>
          {latestStrengths.length > 0 ? (
            <div className="flex flex-col gap-2">
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
      </div>
    </motion.div>
  );
}
