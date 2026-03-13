import Link from "next/link";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, { gradient: string; badge: string; label: string }> = {
  technical: {
    gradient: "from-[#0a2416] to-[#0d1a0e]",
    badge: "bg-[rgba(184,255,0,0.12)] text-accent",
    label: "Tecnico",
  },
  behavioral: {
    gradient: "from-[#160a2d] to-[#0d0d1a]",
    badge: "bg-[rgba(167,139,250,0.15)] text-violet-300",
    label: "Comportamentale",
  },
  mixed: {
    gradient: "from-[#2a150a] to-[#1a0f0d]",
    badge: "bg-[rgba(251,146,60,0.15)] text-orange-300",
    label: "Misto",
  },
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

const InterviewCard = ({
  interviewId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const style = TYPE_STYLES[type?.toLowerCase()] ?? {
    gradient: "from-[#1a1a20] to-[#0f0f13]",
    badge: "bg-white/[0.07] text-[rgba(240,237,230,0.55)]",
    label: type ?? "—",
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const visibleTech = (techstack ?? []).slice(0, 4);
  const overflow = (techstack ?? []).length - 4;

  return (
    <div
      className={cn(
        "rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] bg-[#0f0f13] overflow-hidden",
        "hover:ring-[rgba(184,255,0,0.2)] hover:shadow-[0_0_24px_rgba(184,255,0,0.05)]",
        "transition-all duration-300 group flex flex-col"
      )}
    >
      {/* Gradient header */}
      <div className={cn("bg-linear-to-br px-5 pt-5 pb-4 flex flex-col gap-2 min-h-22", style.gradient)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-fg font-semibold text-base leading-snug line-clamp-2 flex-1">
            {role ?? "—"}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mt-0.5",
              style.badge
            )}
          >
            {style.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">
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
          <div className="h-5" />
        )}

        {/* Date */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 mt-auto">
            <CalendarIcon />
            <span className="text-[rgba(240,237,230,0.35)] text-xs">{formattedDate}</span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={interviewId ? `/interview/${interviewId}` : "#"}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent text-sm font-semibold rounded-xl py-2.5 transition-colors text-center block"
        >
          Inizia sessione →
        </Link>
      </div>
    </div>
  );
};

export default InterviewCard;
