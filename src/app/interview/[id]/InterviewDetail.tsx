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
    </div>
  );
};

export default InterviewDetail;
