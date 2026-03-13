import Link from "next/link";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, { topLine: string; badge: string; label: string }> = {
  technical: {
    topLine: "bg-accent",
    badge: "bg-[rgba(184,255,0,0.12)] text-accent",
    label: "Tecnico",
  },
  behavioral: {
    topLine: "bg-violet-400",
    badge: "bg-[rgba(167,139,250,0.15)] text-violet-300",
    label: "Comportamentale",
  },
  mixed: {
    topLine: "bg-orange-400",
    badge: "bg-[rgba(251,146,60,0.15)] text-orange-300",
    label: "Misto",
  },
};

const LEVEL_STYLES: Record<string, string> = {
  junior: "bg-sky-400/10 text-sky-300",
  mid: "bg-violet-400/10 text-violet-300",
  senior: "bg-amber-400/10 text-amber-300",
};

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="rgba(240,237,230,0.35)" strokeWidth="1" />
      <path d="M4 1v2M8 1v2" stroke="rgba(240,237,230,0.35)" strokeWidth="1" strokeLinecap="round" />
      <path d="M1 5h10" stroke="rgba(240,237,230,0.35)" strokeWidth="1" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
      <circle cx="6" cy="6" r="5" stroke="rgba(240,237,230,0.35)" strokeWidth="1" />
      <path d="M4.5 4.5a1.5 1.5 0 0 1 3 0c0 .833-1.5 1.25-1.5 2.25" stroke="rgba(240,237,230,0.35)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="6" cy="9" r="0.6" fill="rgba(240,237,230,0.35)" />
    </svg>
  );
}

const InterviewCard = ({
  interviewId,
  role,
  type,
  level,
  specialization,
  techstack,
  questionsCount,
  createdAt,
}: InterviewCardProps) => {
  const typeKey = type?.toLowerCase() ?? "";
  const levelKey = level?.toLowerCase() ?? "";
  const style = TYPE_STYLES[typeKey] ?? null;
  const levelStyle = LEVEL_STYLES[levelKey] ?? null;
  const levelLabel = LEVEL_LABELS[levelKey] ?? level;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const visibleTech = (techstack ?? []).slice(0, 3);
  const overflow = (techstack ?? []).length - 3;

  return (
    <div
      className={cn(
        "rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] bg-[#0f0f13] overflow-hidden",
        "hover:ring-[rgba(184,255,0,0.18)] hover:shadow-[0_0_28px_rgba(184,255,0,0.06)]",
        "transition-all duration-300 group flex flex-col"
      )}
    >
      {/* Type accent line */}
      {style ? (
        <div className={cn("h-0.5 w-full shrink-0", style.topLine)} />
      ) : (
        <div className="h-0.5 w-full shrink-0 bg-[rgba(240,237,230,0.08)]" />
      )}

      {/* Card body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {style && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                style.badge
              )}
            >
              {style.label}
            </span>
          )}
          {levelStyle && levelLabel && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                levelStyle
              )}
            >
              {levelLabel}
            </span>
          )}
        </div>

        {/* Role */}
        <h3 className="text-fg font-semibold text-base leading-snug line-clamp-2">
          {role ?? "Intervista"}
        </h3>

        {specialization && (
          <span className="text-[rgba(240,237,230,0.45)] text-xs font-medium truncate -mt-1">
            {specialization}
          </span>
        )}

        {/* Tech tags */}
        {visibleTech.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleTech.map((tech) => (
              <span
                key={tech}
                className="bg-white/4 text-[rgba(240,237,230,0.55)] rounded-md px-2 py-0.5 text-xs ring-1 ring-white/6"
              >
                {tech}
              </span>
            ))}
            {overflow > 0 && (
              <span className="bg-white/4 text-[rgba(240,237,230,0.35)] rounded-md px-2 py-0.5 text-xs ring-1 ring-white/6">
                +{overflow}
              </span>
            )}
          </div>
        ) : (
          <div className="h-1" />
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-[rgba(240,237,230,0.05)]">
          {questionsCount != null && questionsCount > 0 && (
            <div className="flex items-center gap-1.5">
              <QuestionIcon />
              <span className="text-[rgba(240,237,230,0.35)] text-xs">
                {questionsCount} {questionsCount === 1 ? "domanda" : "domande"}
              </span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <CalendarIcon />
              <span className="text-[rgba(240,237,230,0.35)] text-xs">{formattedDate}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={interviewId ? `/interview/${interviewId}` : "#"}
          className="w-full border border-accent/25 hover:border-accent/50 hover:bg-accent/8 text-accent text-sm font-semibold rounded-xl py-2.5 transition-all duration-200 text-center block"
        >
          Inizia sessione →
        </Link>
      </div>
    </div>
  );
};

export default InterviewCard;
