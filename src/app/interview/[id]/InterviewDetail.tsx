"use client";

import { useState } from "react";
import Link from "next/link";

import Agent from "@/components/Agent";
import { Button } from "@/components/ui/button";

interface Props {
  interview: Interview;
  userName: string;
  userId: string;
}

const InterviewDetail = ({ interview, userName, userId }: Props) => {
  const [mode, setMode] = useState<"try-again" | "change-questions" | null>(
    null
  );

  if (mode) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => setMode(null)}
          className="text-indigo-400 text-sm hover:text-indigo-100 transition-colors self-start"
        >
          ← Indietro
        </button>
        <Agent
          userName={userName}
          userId={userId}
          mode={mode}
          redirectOnFinish="/"
          interviewId={mode === "try-again" ? interview.id : undefined}
          questions={mode === "try-again" ? interview.questions : undefined}
          role={interview.role}
          level={interview.level}
          type={interview.type}
          techstack={interview.techstack}
          specialization={interview.specialization}
        />
      </div>
    );
  }

  const formattedDate = new Date(interview.createdAt).toLocaleDateString(
    "it-IT",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const ev = interview.evaluation;
  const scores = ev
    ? [
        { label: "Domain Knowledge", value: ev.domainKnowledge },
        { label: "Problem Solving", value: ev.problemSolving },
        { label: "Communication", value: ev.communication },
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-indigo-400 text-sm hover:text-indigo-100 transition-colors"
        >
          ← Home
        </Link>
        <span className="text-indigo-400 text-xs">{formattedDate}</span>
      </div>

      {/* Dettagli intervista */}
      <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]">
        <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-indigo-100 text-2xl font-bold">
              {interview.role}
            </h1>
            <div className="flex items-center gap-3 text-indigo-400 text-sm">
              <span>{interview.type}</span>
              <span>·</span>
              <span>{interview.level}</span>
              {interview.specialization && (
                <>
                  <span>·</span>
                  <span>{interview.specialization}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(interview.techstack ?? []).map((tech) => (
              <span
                key={tech}
                className="bg-slate-900 text-indigo-400 rounded px-2 py-0.5 text-xs"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-indigo-400 text-xs uppercase tracking-widest">
              Domande ({interview.questions.length})
            </p>
            <ol className="flex flex-col gap-2">
              {interview.questions.map((q, i) => (
                <li key={i} className="text-indigo-100 text-sm">
                  {i + 1}. {q}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setMode("try-again")}
              className="bg-green-400 hover:bg-green-500 active:bg-green-500 text-white rounded-full font-bold px-7 py-3 text-sm flex-1 cursor-pointer transition-colors"
            >
              Try Again
            </Button>
            <Button
              onClick={() => setMode("change-questions")}
              variant="outline"
              className="rounded-full font-bold flex-1 border-indigo-600 text-indigo-100 hover:bg-slate-900"
            >
              Change Questions
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {ev && (
        <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]">
          <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
              <p className="text-indigo-400 text-xs uppercase tracking-widest">Feedback</p>
              <span className="bg-violet-500/15 text-violet-300 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {ev.estimatedSeniority}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {scores.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 text-xs">{label}</span>
                    <span className="text-indigo-100 text-xs font-semibold">{value}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/6" />

            {ev.strengths.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-indigo-400 text-xs uppercase tracking-widest">Punti di forza</p>
                <ul className="flex flex-col gap-1.5">
                  {ev.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-green-400">✓</span>
                      <span className="text-indigo-100">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ev.weaknesses.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-indigo-400 text-xs uppercase tracking-widest">Aree di miglioramento</p>
                <ul className="flex flex-col gap-1.5">
                  {ev.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-orange-400">△</span>
                      <span className="text-indigo-100">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ev.improvementPlan.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-indigo-400 text-xs uppercase tracking-widest">Piano di miglioramento</p>
                <ul className="flex flex-col gap-1.5">
                  {ev.improvementPlan.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-violet-400">→</span>
                      <span className="text-indigo-100">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDetail;
