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
          className="text-light-400 text-sm hover:text-light-100 transition-colors self-start"
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
          className="text-light-400 text-sm hover:text-light-100 transition-colors"
        >
          ← Home
        </Link>
        <span className="text-light-400 text-xs">{formattedDate}</span>
      </div>

      {/* Dettagli intervista */}
      <div className="card-border">
        <div className="card flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-light-100 text-2xl font-bold">
              {interview.role}
            </h1>
            <div className="flex items-center gap-3 text-light-400 text-sm">
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
                className="bg-dark-300 text-light-400 rounded px-2 py-0.5 text-xs"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-light-400 text-xs uppercase tracking-widest">
              Domande ({interview.questions.length})
            </p>
            <ol className="flex flex-col gap-2">
              {interview.questions.map((q, i) => (
                <li key={i} className="text-light-100 text-sm">
                  {i + 1}. {q}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setMode("try-again")}
              className="btn-call rounded-full font-bold flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={() => setMode("change-questions")}
              variant="outline"
              className="rounded-full font-bold flex-1 border-light-600 text-light-100 hover:bg-dark-300"
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
