"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InterviewInput = ({ value, onChange, disabled }: Props) => {
  return (
    <textarea
      className="w-full min-h-32 resize-none bg-[#0f0f13] border text-[rgba(240,237,230,0.85)] placeholder:text-[rgba(240,237,230,0.2)] rounded-xl px-4 py-3.5 text-sm leading-relaxed focus:outline-none disabled:opacity-50 transition-all duration-200"
      style={{
        borderColor: "rgba(240,237,230,0.07)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(184,255,0,0.3)";
        e.currentTarget.style.boxShadow = "0 0 0 1px rgba(184,255,0,0.12), 0 0 20px -4px rgba(184,255,0,0.15)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(240,237,230,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
      placeholder="Es. Senior frontend developer — intervista tecnica su React, TypeScript e system design. Focus su performance e architettura. Sessione lunga, obiettivo prep colloquio."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

export default InterviewInput;
