"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InterviewInput = ({ value, onChange, disabled }: Props) => {
  return (
    <textarea
      className="w-full min-h-32 resize-none bg-[#0E0F16] border border-[#252736] text-indigo-100 placeholder:text-indigo-800 rounded-2xl px-4 py-3.5 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/20 disabled:opacity-50 transition-colors"
      placeholder="Es. Voglio un'intervista tecnica da senior frontend developer con React e TypeScript, focus su performance e architettura."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

export default InterviewInput;
