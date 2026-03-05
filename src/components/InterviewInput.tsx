"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InterviewInput = ({ value, onChange, disabled }: Props) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="label">Descrivi l&apos;intervista che vuoi fare</label>
      <textarea
        className="input min-h-28 resize-none"
        placeholder="Es. Voglio un'intervista tecnica da senior frontend developer con React e TypeScript, focus su performance e architettura."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default InterviewInput;
