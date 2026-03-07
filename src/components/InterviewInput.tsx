"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InterviewInput = ({ value, onChange, disabled }: Props) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-indigo-300 text-sm font-medium">Descrivi l&apos;intervista che vuoi fare</label>
      <textarea
        className="min-h-28 resize-none bg-[#1A1C20] border border-[#4B4D4F] text-indigo-100 placeholder:text-indigo-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 w-full"
        placeholder="Es. Voglio un'intervista tecnica da senior frontend developer con React e TypeScript, focus su performance e architettura."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default InterviewInput;
