"use client";

import { useCallback, useEffect, useState } from "react";
import InterviewCard from "@/components/InterviewCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface FilterOptions {
  types: string[];
  specializations: string[];
  techs: string[];
}

interface InterviewRow {
  id: string;
  user_id: string;
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: string[];
  specialization?: string;
  finalized: boolean;
  created_at: string;
  total_count: number;
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="pointer-events-none">
      <path
        d="M3 5l4 4 4-4"
        stroke="rgba(240,237,230,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-[#0f0f13] rounded-xl pl-3 pr-8 py-2.5 text-sm ring-1 ring-[rgba(240,237,230,0.07)]",
          "focus:ring-[rgba(184,255,0,0.4)] outline-none appearance-none cursor-pointer transition",
          value ? "text-fg" : "text-[rgba(240,237,230,0.4)]"
        )}
      >
        <option value="" className="bg-[#0f0f13] text-[rgba(240,237,230,0.4)]">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0f0f13] text-fg">
            {o}
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
        <ChevronDown />
      </span>
    </div>
  );
}

export default function Interviews() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    types: [],
    specializations: [],
    techs: [],
  });

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleInput, setRoleInput] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetch("/api/interviews/filters")
      .then((res) => res.json())
      .then((json) => {
        if (json.success)
          setFilterOptions({
            types: json.data.types ?? [],
            specializations: json.data.domains ?? [],
            techs: json.data.tags ?? [],
          });
      });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setRole(roleInput);
      setOffset(0);
    }, 400);
    return () => clearTimeout(id);
  }, [roleInput]);

  const fetchInterviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (type) params.set("type", type);
    if (specialization) params.set("specialization", specialization);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));

    fetch(`/api/interviews?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error ?? "Unknown error");
        const mapped: Interview[] = (json.data as InterviewRow[]).map((r) => ({
          id: r.id,
          userId: r.user_id,
          role: r.role,
          type: r.type,
          level: r.level,
          techstack: r.techstack,
          questions: r.questions,
          specialization: r.specialization,
          finalized: r.finalized,
          createdAt: r.created_at,
        }));
        setInterviews(mapped);
        setTotal(Number(json.total));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [role, type, specialization, offset]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const resetFilters = () => {
    setRoleInput("");
    setRole("");
    setType("");
    setSpecialization("");
    setOffset(0);
  };

  const activeCount = [role, type, specialization].filter(Boolean).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Cerca per ruolo…"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          className="bg-[#0f0f13] rounded-xl px-4 py-2.5 text-fg placeholder:text-[rgba(240,237,230,0.3)] text-sm ring-1 ring-[rgba(240,237,230,0.07)] focus:ring-[rgba(184,255,0,0.4)] outline-none transition w-full sm:w-52"
        />

        {filterOptions.types.length > 0 && (
          <SelectField
            value={type}
            onChange={(v) => { setType(v); setOffset(0); }}
            placeholder="Tipo di colloquio"
            options={filterOptions.types}
          />
        )}

        {filterOptions.specializations.length > 0 && (
          <SelectField
            value={specialization}
            onChange={(v) => { setSpecialization(v); setOffset(0); }}
            placeholder="Settore / area"
            options={filterOptions.specializations}
          />
        )}

        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-accent/15 text-accent text-xs rounded-full px-2.5 py-1 font-medium">
              {activeCount} {activeCount === 1 ? "filtro attivo" : "filtri attivi"}
            </span>
            <button
              onClick={resetFilters}
              className="text-[rgba(240,237,230,0.4)] hover:text-fg text-base transition-colors leading-none"
              aria-label="Rimuovi filtri"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#0f0f13] ring-1 ring-[rgba(240,237,230,0.07)] overflow-hidden animate-pulse"
            >
              <div className="h-20 bg-white/3" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-white/5 rounded-full w-2/3" />
                <div className="h-3 bg-white/4 rounded-full w-1/3" />
                <div className="h-9 bg-white/3 rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-[rgba(240,237,230,0.45)] text-sm">Errore: {error}</p>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20">
            <rect x="6" y="10" width="28" height="24" rx="3" stroke="#f0ede6" strokeWidth="1.5" />
            <path d="M13 18h14M13 24h8" stroke="#f0ede6" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[rgba(240,237,230,0.4)] text-sm text-center">
            {activeCount > 0
              ? "Nessuna intervista corrisponde ai filtri."
              : "Non hai ancora completato nessuna intervista."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interviewId={interview.id}
              userId={interview.userId}
              role={interview.role}
              type={interview.type}
              level={interview.level}
              specialization={interview.specialization}
              techstack={interview.techstack}
              questionsCount={interview.questions?.length}
              createdAt={interview.createdAt}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
            className="rounded-full px-4 py-1.5 text-sm bg-[#0f0f13] ring-1 ring-[rgba(240,237,230,0.07)] text-[rgba(240,237,230,0.45)] disabled:opacity-30 hover:text-fg hover:ring-[rgba(240,237,230,0.14)] transition cursor-pointer"
          >
            ←
          </button>
          <span className="text-[rgba(240,237,230,0.45)] text-sm tabular-nums">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setOffset((p) => p + PAGE_SIZE)}
            className="rounded-full px-4 py-1.5 text-sm bg-[#0f0f13] ring-1 ring-[rgba(240,237,230,0.07)] text-[rgba(240,237,230,0.45)] disabled:opacity-30 hover:text-fg hover:ring-[rgba(240,237,230,0.14)] transition cursor-pointer"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
