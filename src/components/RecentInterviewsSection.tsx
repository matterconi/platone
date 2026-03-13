"use client";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-[10px] font-semibold tracking-widest uppercase"
    style={{ color: "rgba(240,237,230,0.45)" }}
  >
    {children}
  </p>
);

const TYPE_COLORS: Record<string, string> = {
  tecnico: "#67e8f9",
  technical: "#67e8f9",
  "hr & soft skills": "#a78bfa",
  hr: "#a78bfa",
  behavioral: "#a78bfa",
  misto: "#b8ff00",
  mixed: "#b8ff00",
  "case-study": "#f9a8d4",
  "case study": "#f9a8d4",
  faang: "#fb923c",
  startup: "#34d399",
  architectural: "#fbbf24",
  "academic-discussion": "#94a3b8",
};

const LEVEL_COLORS: Record<string, string> = {
  junior: "#34d399",
  student: "#34d399",
  graduate: "#6ee7b7",
  mid: "#fbbf24",
  senior: "#fb923c",
  lead: "#f87171",
  principal: "#c084fc",
  phd: "#a78bfa",
  professor: "#c084fc",
};

function typeColor(type: string) {
  return TYPE_COLORS[type?.toLowerCase()] ?? "rgba(184,255,0,0.7)";
}

function levelColor(level: string) {
  return LEVEL_COLORS[level?.toLowerCase()] ?? "rgba(240,237,230,0.45)";
}

function scoreColor(score: number): string {
  if (score >= 8) return "#b8ff00";
  if (score >= 6) return "#fbbf24";
  if (score >= 4) return "#fb923c";
  return "#f87171";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

const SCORE_LABELS: { key: keyof Evaluation; short: string }[] = [
  { key: "domainKnowledge", short: "Domain" },
  { key: "problemSolving", short: "Problem" },
  { key: "communication", short: "Comm." },
];

interface RecentInterviewsSectionProps {
  interviews: RecentInterview[];
  label?: string;
  onSelect: (text: string) => void;
}

export default function RecentInterviewsSection({
  interviews,
  label = "Le tue ultime interviste",
  onSelect,
}: RecentInterviewsSectionProps) {
  if (!interviews || interviews.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>{label}</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {interviews.map((iv) => {
          const fillText = `Voglio un'intervista ${iv.type || "tecnica"} da ${iv.level} ${iv.role}${iv.techstack?.length ? ` con ${iv.techstack.join(", ")}` : ""}`.trim();
          const tColor = typeColor(iv.type);
          const lColor = levelColor(iv.level);
          const ev = iv.evaluation;
          const avgScore = ev
            ? Math.round(
                ((ev.domainKnowledge ?? 0) + (ev.problemSolving ?? 0) + (ev.communication ?? 0)) / 3
              )
            : null;

          return (
            <button
              key={iv.id}
              type="button"
              onClick={() => onSelect(fillText)}
              className="group flex flex-col gap-3 p-4 rounded-xl text-left transition-all duration-150 cursor-pointer"
              style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${tColor}35`;
                e.currentTarget.style.boxShadow = `0 0 20px -6px ${tColor}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(240,237,230,0.07)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Row 1: badges + score pill + arrow */}
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {iv.type && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: tColor, background: `${tColor}12`, border: `1px solid ${tColor}30` }}
                    >
                      {iv.type}
                    </span>
                  )}
                  {iv.level && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: lColor, background: `${lColor}10`, border: `1px solid ${lColor}28` }}
                    >
                      {iv.level}
                    </span>
                  )}
                  {iv.evaluation?.estimatedSeniority && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: "rgba(240,237,230,0.4)", background: "rgba(240,237,230,0.05)", border: "1px solid rgba(240,237,230,0.1)" }}
                    >
                      ~ {iv.evaluation.estimatedSeniority}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {avgScore !== null && (
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: scoreColor(avgScore) }}
                    >
                      {avgScore}/10
                    </span>
                  )}
                  <svg
                    width="13" height="13" viewBox="0 0 14 14" fill="none"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: tColor }}
                  >
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Row 2: role + specialization */}
              <div className="flex flex-col gap-0.5">
                {iv.title && (
                  <p className="text-[10px] truncate" style={{ color: "rgba(240,237,230,0.3)" }}>
                    {iv.title}
                  </p>
                )}
                <p className="text-sm font-semibold leading-snug line-clamp-1" style={{ color: "rgba(240,237,230,0.85)" }}>
                  {iv.role}
                </p>
                {iv.specialization && (
                  <p className="text-[11px] truncate" style={{ color: "rgba(240,237,230,0.35)" }}>
                    {iv.specialization}
                  </p>
                )}
              </div>

              {/* Row 3: evaluation scores */}
              {ev && (
                <div className="flex items-center gap-3">
                  {SCORE_LABELS.map(({ key, short }) => {
                    const val = ev[key] as number | undefined;
                    if (val == null) return null;
                    const c = scoreColor(val);
                    return (
                      <div key={key} className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wide" style={{ color: "rgba(240,237,230,0.25)" }}>
                            {short}
                          </span>
                          <span className="text-[10px] font-semibold tabular-nums" style={{ color: c }}>
                            {val}
                          </span>
                        </div>
                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(240,237,230,0.07)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${val * 10}%`, background: c }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Row 4: first question preview */}
              {iv.questions && iv.questions.length > 0 && (
                <p
                  className="text-[11px] leading-relaxed line-clamp-2 italic"
                  style={{ color: "rgba(240,237,230,0.3)" }}
                >
                  &ldquo;{iv.questions[0]}&rdquo;
                </p>
              )}

              {/* Row 5: techstack + footer */}
              <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-white/5">
                <div className="flex flex-wrap gap-1">
                  {(iv.techstack ?? []).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: "rgba(240,237,230,0.4)", background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.07)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {iv.questions && iv.questions.length > 0 && (
                    <span className="text-[10px]" style={{ color: "rgba(240,237,230,0.25)" }}>
                      {iv.questions.length} dom.
                    </span>
                  )}
                  {iv.createdAt && (
                    <span className="text-[10px]" style={{ color: "rgba(240,237,230,0.2)" }}>
                      {formatDate(iv.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
