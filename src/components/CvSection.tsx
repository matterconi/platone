"use client";

import { useRef, useState } from "react";

interface Props {
  initialFilename: string | null;
}

export default function CvSection({ initialFilename }: Props) {
  const [filename, setFilename] = useState<string | null>(initialFilename);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/user/cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore caricamento"); return; }
      setFilename(data.filename);
    } catch {
      setError("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/cv", { method: "DELETE" });
      if (!res.ok) { setError("Errore durante la rimozione"); return; }
      setFilename(null);
    } catch {
      setError("Errore durante la rimozione");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-2xl"
      style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)" }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm" style={{ color: "rgba(240,237,230,0.85)" }}>
          CV
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(240,237,230,0.4)" }}>
          Carica il tuo CV per personalizzare ogni intervista — l&apos;AI farà riferimento alle tue esperienze specifiche.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
      />

      {filename ? (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg"
            style={{ background: "rgba(184,255,0,0.06)", border: "1px solid rgba(184,255,0,0.18)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ color: "rgba(184,255,0,0.6)" }}>
              <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 1v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs truncate" style={{ color: "rgba(184,255,0,0.8)" }}>{filename}</span>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="text-xs px-3 py-2 rounded-lg shrink-0 cursor-pointer transition-colors disabled:opacity-40"
            style={{ background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.07)", color: "rgba(240,237,230,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(240,237,230,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,237,230,0.4)"; }}
          >
            {isUploading ? "Caricamento..." : "Sostituisci"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="text-xs px-3 py-2 rounded-lg shrink-0 cursor-pointer transition-colors disabled:opacity-40"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.6)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(239,68,68,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(239,68,68,0.6)"; }}
          >
            {isDeleting ? "..." : "Rimuovi"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="self-start text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
          style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.1)", color: "rgba(240,237,230,0.5)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.25)"; e.currentTarget.style.color = "rgba(240,237,230,0.8)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(240,237,230,0.1)"; e.currentTarget.style.color = "rgba(240,237,230,0.5)"; }}
        >
          {isUploading ? "Caricamento..." : "+ Carica CV (PDF o TXT)"}
        </button>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
