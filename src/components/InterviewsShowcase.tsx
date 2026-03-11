"use client";

import Link from "next/link";

const ITEMS = [
  { role: "Product Manager",   company: "Google",        type: "Behavioral",    difficulty: "Difficile", duration: "25 min" },
  { role: "Software Engineer", company: "Meta",          type: "Tecnico",       difficulty: "Difficile", duration: "30 min" },
  { role: "UX Designer",       company: "Airbnb",        type: "Case Study",    difficulty: "Medio",     duration: "20 min" },
  { role: "Data Scientist",    company: "Netflix",       type: "Tecnico",       difficulty: "Difficile", duration: "35 min" },
  { role: "Business Analyst",  company: "McKinsey",      type: "Case Study",    difficulty: "Difficile", duration: "40 min" },
  { role: "iOS Developer",     company: "Apple",         type: "Tecnico",       difficulty: "Medio",     duration: "30 min" },
  { role: "Growth Manager",    company: "Spotify",       type: "HR Screening",  difficulty: "Facile",    duration: "15 min" },
  { role: "ML Engineer",       company: "OpenAI",        type: "Tecnico",       difficulty: "Difficile", duration: "45 min" },
  { role: "Finance Analyst",   company: "Goldman Sachs", type: "Behavioral",    difficulty: "Difficile", duration: "25 min" },
  { role: "Frontend Dev",      company: "Figma",         type: "Tecnico",       difficulty: "Medio",     duration: "25 min" },
  { role: "Ops Manager",       company: "Amazon",        type: "Behavioral",    difficulty: "Medio",     duration: "20 min" },
  { role: "Startup Advisor",   company: "Y Combinator",  type: "Case Study",    difficulty: "Difficile", duration: "35 min" },
];

type InterviewEntry = (typeof ITEMS)[number];

const DIFFICULTY_FILLED: Record<string, number> = { Facile: 1, Medio: 3, Difficile: 5 };

function DifficultyDots({ level }: { level: string }) {
  const filled = DIFFICULTY_FILLED[level] ?? 3;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: i < filled ? "#b8ff00" : "rgba(255,255,255,0.1)",
            boxShadow: i < filled ? "0 0 4px rgba(184,255,0,0.5)" : "none",
          }}
        />
      ))}
      <span className="text-[10px] text-white/35 ml-1">{level}</span>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="6" y="1" width="6" height="9" rx="3" stroke="rgba(184,255,0,0.35)" strokeWidth="1.3" />
      <path d="M3.5 9c0 3.038 2.462 5.5 5.5 5.5s5.5-2.462 5.5-5.5" stroke="rgba(184,255,0,0.35)" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="14.5" x2="9" y2="17" stroke="rgba(184,255,0,0.35)" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6.5" y1="17" x2="11.5" y2="17" stroke="rgba(184,255,0,0.35)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function buildHref(item: InterviewEntry) {
  const params = new URLSearchParams({
    role: item.role,
    type: item.type,
    desired_company: item.company,
    level: item.difficulty,
  });
  return `/interview/new?${params.toString()}`;
}

function InterviewCard({ item }: { item: InterviewEntry }) {
  return (
    <Link href={buildHref(item)} className="interview-card">
      {/* Gradient border pseudo-element handled in CSS */}
      <div className="flex items-center justify-between mb-4">
        <span className="interview-card-badge">{item.type}</span>
        <span className="flex items-center gap-1 text-[11px] text-white/25">
          <ClockIcon />
          {item.duration}
        </span>
      </div>

      <div className="mb-4">
        <p className="font-display text-sm font-bold text-fg leading-tight mb-0.5">{item.role}</p>
        <p className="text-[11px] text-white/30">@ {item.company}</p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <DifficultyDots level={item.difficulty} />
        <MicIcon />
      </div>
    </Link>
  );
}

function ClockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
      <path d="M5 3v2l1.2 1.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const DOUBLED = [...ITEMS, ...ITEMS];

export default function InterviewsShowcase() {
  return (
    <section className="interviews-showcase">
      <div className="relative max-w-5xl mx-auto" style={{ overflowX: "clip" }}>
        <div className="scroll-edge-fade-left"  aria-hidden="true" />
        <div className="scroll-edge-fade-right" aria-hidden="true" />

        <div className="scroll-row-wrapper">
          <div className="scroll-track scroll-track-left">
            {DOUBLED.map((item, i) => (
              <InterviewCard key={`${item.role}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
