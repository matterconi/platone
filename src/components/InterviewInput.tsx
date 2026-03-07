"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InterviewInput = ({ value, onChange, disabled }: Props) => {
  return (
    <textarea
      className="w-full min-h-32 resize-none bg-[#0A0B10] border border-[#1A1B28] text-slate-100 placeholder:text-slate-600 rounded-2xl px-4 py-3.5 text-sm leading-relaxed focus:outline-none focus:border-slate-600/60 focus:[box-shadow:0_0_0_1px_rgba(100,116,139,0.3),0_0_20px_-4px_rgba(100,116,139,0.2)] disabled:opacity-50 transition-all duration-200"
      placeholder="Es. Senior frontend developer — intervista tecnica su React, TypeScript e system design. Focus su performance e architettura. Sessione lunga, obiettivo prep colloquio."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

export default InterviewInput;
