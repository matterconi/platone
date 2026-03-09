"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import InterviewInput from "@/components/InterviewInput";

type CallStatus = "inactive" | "connecting" | "active" | "finished";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentConfig {
  id: string;
  name: string;
  specialty: string;
  description: string;
  assistantId: string;
  gradient: string;
  icon: string;
  glow: string;
  borderColor: string;
}

// TODO: replace assistantId values with real VAPI assistant IDs per agent
const AGENTS: AgentConfig[] = [
  {
    id: "technical",
    name: "Alex",
    specialty: "Tecnico",
    description: "Algoritmi, system design e coding challenges",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    gradient: "from-indigo-500 to-violet-600",
    icon: "🧑‍💻",
    glow: "0 0 28px -4px rgba(99,102,241,0.45)",
    borderColor: "rgba(99,102,241,0.45)",
  },
  {
    id: "hr",
    name: "Sofia",
    specialty: "HR & Soft Skills",
    description: "Behavioral, cultura aziendale e comunicazione",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    gradient: "from-violet-500 to-fuchsia-600",
    icon: "👩‍💼",
    glow: "0 0 28px -4px rgba(139,92,246,0.45)",
    borderColor: "rgba(139,92,246,0.45)",
  },
  {
    id: "mixed",
    name: "Marco",
    specialty: "Misto",
    description: "Domande tecniche e comportamentali combinate",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    gradient: "from-cyan-500 to-indigo-600",
    icon: "🎯",
    glow: "0 0 28px -4px rgba(6,182,212,0.4)",
    borderColor: "rgba(6,182,212,0.45)",
  },
];

const Agent = ({
  userName,
  mode = "new",
  redirectOnFinish,
  suggestions,
  recentInterviews,
  recentInterviewsLabel = "Le tue ultime interviste",
  interviewId,
  questions,
  role,
  level,
  type,
  techstack,
  specialization,
}: AgentProps) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const vapiRef = useRef<Vapi | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>("inactive");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    setCallStatus("connecting");
    setIsGenerating(true);

    const token = await getToken();

    // Build mode-specific extra variables
    const extraVariables: Record<string, string> = {};
    if (mode === "try-again" && interviewId && questions) {
      extraVariables.interviewId = interviewId;
      extraVariables.questions = JSON.stringify(questions);
      // Include context so server can generate the retry prompt without a DB lookup
      if (role) extraVariables.role = role;
      if (level) extraVariables.level = level;
      if (type) extraVariables.type = type;
      if (techstack) extraVariables.techstack = techstack.join(", ");
      if (specialization) extraVariables.specialization = specialization;
    } else if (mode === "change-questions") {
      if (role) extraVariables.role = role;
      if (level) extraVariables.level = level;
      if (type) extraVariables.type = type;
      if (techstack) extraVariables.techstack = techstack.join(", ");
      if (specialization) extraVariables.specialization = specialization;
    }

    const res = await fetch("/api/interview/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage: mode === "new" ? userMessage : "",
        mode,
        assistantId: selectedAgent.assistantId,
        userName,
        extraVariables,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCallStatus("inactive");
      setIsGenerating(false);
      setInputError(data.error ?? "Prompt non valido. Riprova.");
      return;
    }

    setIsGenerating(false);

    // Create Vapi instance with short-lived JWT from server (no public key in bundle)
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    const vapi = new Vapi(data.vapiToken);
    vapiRef.current = vapi;

    vapi.on("error", (error: Error) => {
      console.error("VAPI error:", error);
      setCallStatus("inactive");
    });
    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => {
      setCallStatus("finished");
      setIsSpeaking(false);
      if (redirectOnFinish) {
        setTimeout(() => router.push(redirectOnFinish), 1500);
      }
    });
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("message", (message: TranscriptMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          {
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.transcript,
          },
        ]);
      }
    });

    await vapi.reconnect(data.webCall);
  };

  const handleStop = () => {
    vapiRef.current?.stop();
  };

  const isCallActive = callStatus === "active";
  const isConnecting = callStatus === "connecting";
  const isFinished = callStatus === "finished";

  const statusLabel = {
    inactive: "In attesa",
    connecting: "Connessione in corso...",
    active: "Intervista in corso",
    finished: redirectOnFinish ? "Reindirizzamento..." : "Intervista terminata",
  }[callStatus];

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">

      {mode === "new" && callStatus === "inactive" && (
        <div className="flex flex-col gap-10">
          {/* Agent selector */}
          <div className="flex flex-col gap-3">
            <p className="text-slate-200 text-xs tracking-widest uppercase font-semibold">
              Scegli il tuo intervistatore
            </p>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              {AGENTS.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent)}
                    className={`flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? "bg-[#0E0F1A]"
                        : "border-[#1A1B28] bg-[#0A0B10] hover:bg-[#0E0F1A]"
                    }`}
                    style={isSelected ? {
                      borderColor: agent.borderColor,
                      boxShadow: agent.glow,
                    } : undefined}
                  >
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-xl bg-linear-to-br ${agent.gradient} flex items-center justify-center shrink-0 text-lg transition-all duration-200`}
                        style={isSelected ? { boxShadow: agent.glow } : undefined}
                      >
                        {agent.icon}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-100 font-semibold text-sm leading-tight">{agent.name}</p>
                        <p className="text-slate-400 text-xs">{agent.specialty}</p>
                      </div>
                    </div>
                    {/* Description + selected badge */}
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-slate-500 text-xs leading-relaxed">{agent.description}</p>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] text-slate-300 font-semibold bg-white/8 px-2 py-0.5 rounded-full border border-white/10">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-200 text-xs tracking-widest uppercase font-semibold">
                Descrivi il ruolo e il contesto
              </p>
              <Link
                href="/interview/guide"
                className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
              >
                Come scrivere il prompt →
              </Link>
            </div>
            <InterviewInput
              value={userMessage}
              onChange={(v) => { setUserMessage(v); setInputError(null); }}
              disabled={false}
            />
            {inputError && (
              <p className="text-red-400 text-sm">{inputError}</p>
            )}
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => {
                  const label = [s.level, s.role].filter(Boolean).join(" ");
                  const tech = s.techstack?.slice(0, 2).join(", ");
                  const chipText = `${label}${tech ? ` · ${tech}` : ""}`;
                  const fillText = `Voglio un'intervista ${s.type || "tecnica"} da ${s.level} ${s.role}${s.techstack?.length ? ` con ${s.techstack.join(", ")}` : ""}`.trim();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setUserMessage(fillText); setInputError(null); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#0E0F16] border border-[#252736] text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {chipText}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Loading Deepseek */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="size-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-indigo-400 text-sm">Preparando l&apos;intervista...</p>
        </div>
      )}

      {/* Cards interviewer + utente */}
      {(isCallActive || isFinished) && (
      <div className="grid grid-cols-2 gap-6">

        {/* AI Interviewer */}
        <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]">
          <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col items-center gap-4 p-8">
            <div className="relative flex items-center justify-center">
              <div className="relative size-24 rounded-full overflow-hidden">
                <Image
                  src="/ai-avatar.png"
                  alt="AI Interviewer"
                  fill
                  className="object-cover"
                />
              </div>
              {isSpeaking && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-300/40 pointer-events-none" />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-indigo-100 font-semibold">{selectedAgent.name}</p>
              <span className="text-indigo-400 text-xs">
                {isSpeaking ? "Sta parlando..." : "In ascolto"}
              </span>
            </div>
          </div>
        </div>

        {/* Utente */}
        <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]">
          <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col items-center gap-4 p-8">
            <div className="relative size-24 rounded-full overflow-hidden">
              <Image
                src="/user-avatar.png"
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-indigo-100 font-semibold">{userName}</p>
              <span className="text-indigo-400 text-xs">
                {isCallActive && !isSpeaking ? "Sta parlando..." : "Candidato"}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Trascrizione */}
      {messages.length > 0 && (
        <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33] w-full">
          <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col gap-3 p-6 max-h-64 overflow-y-auto">
            <p className="text-indigo-400 text-xs uppercase tracking-widest mb-1">
              Trascrizione
            </p>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-0.5 ${
                  msg.role === "assistant" ? "items-start" : "items-end"
                }`}
              >
                <span className="text-indigo-400 text-xs">
                  {msg.role === "assistant" ? "AI Interviewer" : userName}
                </span>
                <p
                  className={`text-sm px-4 py-2 rounded-2xl max-w-[85%] ${
                    msg.role === "assistant"
                      ? "bg-slate-900 text-indigo-100"
                      : "bg-violet-300/20 text-indigo-100"
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Status + Bottone */}
      <div className="flex flex-col items-center gap-4">
        {(isCallActive || isConnecting || isFinished) && (
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isCallActive
                  ? "bg-green-400 animate-pulse"
                  : isConnecting
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-indigo-600"
              }`}
            />
            <span className="text-indigo-400 text-sm">{statusLabel}</span>
          </div>
        )}

        {!isFinished ? (
          <Button
            onClick={isCallActive ? handleStop : handleStart}
            disabled={isConnecting}
            className={`min-w-48 rounded-full font-bold px-7 py-3 text-sm cursor-pointer transition-all duration-200 ${
              isCallActive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_24px_-4px_rgba(239,68,68,0.6)]"
                : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.55)] hover:shadow-[0_0_32px_-4px_rgba(16,185,129,0.7)]"
            }`}
          >
            {isCallActive
              ? "Termina intervista"
              : isConnecting
              ? "Connessione..."
              : "Inizia intervista"}
          </Button>
        ) : !redirectOnFinish ? (
          <Button
            onClick={() => setCallStatus("inactive")}
            className="bg-green-400 hover:bg-green-500 active:bg-green-500 text-white min-w-48 rounded-full font-bold px-7 py-3 text-sm cursor-pointer transition-colors"
          >
            Ricomincia
          </Button>
        ) : null}
      </div>

      {/* Inspiration cards — below button, only when inactive */}
      {mode === "new" && callStatus === "inactive" && recentInterviews && recentInterviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-slate-200 text-xs tracking-widest uppercase font-semibold">
            {recentInterviewsLabel}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentInterviews.map((iv) => {
              const fillText = `Voglio un'intervista ${iv.type || "tecnica"} da ${iv.level} ${iv.role}${iv.techstack?.length ? ` con ${iv.techstack.join(", ")}` : ""}`.trim();
              const typeColors: Record<string, string> = {
                tecnico: "text-indigo-400",
                comportamentale: "text-violet-400",
                misto: "text-cyan-400",
                "case study": "text-amber-400",
              };
              const typeColor = typeColors[iv.type?.toLowerCase()] ?? "text-slate-400";
              return (
                <button
                  key={iv.id}
                  type="button"
                  onClick={() => { setUserMessage(fillText); setInputError(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-[#1A1B28] bg-[#0A0B10] hover:border-slate-700/50 hover:bg-[#0E0F1A] text-left transition-all duration-150 cursor-pointer"
                >
                  <p className="text-slate-200 text-xs font-semibold leading-snug line-clamp-2">
                    {iv.level ? `${iv.level} ` : ""}{iv.role}
                  </p>
                  {iv.type && (
                    <span className={`text-[10px] font-medium ${typeColor}`}>{iv.type}</span>
                  )}
                  {iv.techstack?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {iv.techstack.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-slate-600 bg-white/3 px-1.5 py-0.5 rounded ring-1 ring-white/5">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;
