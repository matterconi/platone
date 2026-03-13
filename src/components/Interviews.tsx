"use client";

import { useCallback, useEffect, useState } from "react";
import InterviewCard from "@/components/InterviewCard";

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

  // Filter state
  const [roleInput, setRoleInput] = useState("");
  const [role, setRole] = useState(""); // debounced
  const [type, setType] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [tech, setTech] = useState("");
  const [offset, setOffset] = useState(0);

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/interviews/filters")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setFilterOptions({
          types: json.data.types ?? [],
          specializations: json.data.domains ?? [],
          techs: json.data.tags ?? [],
        });
      });
  }, []);

  // Debounce role input
  useEffect(() => {
    const id = setTimeout(() => {
      setRole(roleInput);
      setOffset(0);
    }, 400);
    return () => clearTimeout(id);
  }, [roleInput]);

  // Fetch interviews on filter/pagination change
  const fetchInterviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (type) params.set("type", type);
    if (specialization) params.set("specialization", specialization);
    if (tech) params.set("techstack", tech);
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
  }, [role, type, specialization, tech, offset]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);
  const hasActiveFilter = role || type || specialization || tech;

  const pillClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
      active
        ? "bg-violet-300 text-zinc-950"
        : "bg-zinc-800 text-indigo-400 hover:text-indigo-100"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Filtri */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Cerca per ruolo..."
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          className="bg-zinc-800 rounded-full px-5 py-2.5 text-indigo-100 placeholder:text-indigo-400 text-sm outline-none focus:ring-1 focus:ring-violet-300/50 sm:max-w-xs"
        />

        {filterOptions.types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setType(""); setOffset(0); }} className={pillClass(type === "")}>Tutti</button>
            {filterOptions.types.map((t) => (
              <button key={t} onClick={() => { setType(t === type ? "" : t); setOffset(0); }} className={pillClass(type === t)}>{t}</button>
            ))}
          </div>
        )}

        {filterOptions.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSpecialization(""); setOffset(0); }} className={pillClass(specialization === "")}>Tutte le spec.</button>
            {filterOptions.specializations.map((s) => (
              <button key={s} onClick={() => { setSpecialization(s === specialization ? "" : s); setOffset(0); }} className={pillClass(specialization === s)}>{s}</button>
            ))}
          </div>
        )}

        {filterOptions.techs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setTech(""); setOffset(0); }} className={pillClass(tech === "")}>Tutti i tech</button>
            {filterOptions.techs.map((t) => (
              <button key={t} onClick={() => { setTech(t === tech ? "" : t); setOffset(0); }} className={pillClass(tech === t)}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Risultati */}
      {loading ? (
        <p className="text-indigo-400">Caricamento...</p>
      ) : error ? (
        <p className="text-indigo-400">Errore: {error}</p>
      ) : interviews.length === 0 ? (
        <p className="text-indigo-400">
          {hasActiveFilter
            ? "Nessuna interview corrisponde ai filtri."
            : "Non hai ancora completato nessuna interview."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interviewId={interview.id}
              userId={interview.userId}
              role={interview.role}
              type={interview.type}
              techstack={interview.techstack}
              createdAt={interview.createdAt}
            />
          ))}
        </div>
      )}

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
            className="rounded-full px-4 py-1.5 text-sm bg-zinc-800 text-indigo-400 disabled:opacity-40 cursor-pointer hover:text-indigo-100"
          >
            ←
          </button>
          <span className="text-indigo-400 text-sm">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setOffset((p) => p + PAGE_SIZE)}
            className="rounded-full px-4 py-1.5 text-sm bg-zinc-800 text-indigo-400 disabled:opacity-40 cursor-pointer hover:text-indigo-100"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
