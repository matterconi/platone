"use client";

import Image from "next/image";
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
  color: string; // tailwind bg color for avatar
  initials: string;
}

// TODO: replace assistantId values with real VAPI assistant IDs per agent
const AGENTS: AgentConfig[] = [
  {
    id: "technical",
    name: "Alex",
    specialty: "Tecnico",
    description: "Algoritmi, system design e coding challenges",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "bg-indigo-500",
    initials: "AL",
  },
  {
    id: "hr",
    name: "Sofia",
    specialty: "HR & Soft Skills",
    description: "Behavioral, cultura aziendale e comunicazione",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "bg-violet-500",
    initials: "SO",
  },
  {
    id: "mixed",
    name: "Marco",
    specialty: "Misto",
    description: "Domande tecniche e comportamentali combinate",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "bg-cyan-600",
    initials: "MA",
  },
];

const Agent = ({
  userName,
  mode = "new",
  redirectOnFinish,
  suggestions,
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
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
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
      if (
        message.type === "transcript" &&
        message.transcriptType === "final"
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.transcript,
          },
        ]);
      }
    });

    return () => {
      vapi.stop();
    };
  }, [redirectOnFinish, router]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    setCallStatus("connecting");
    setIsGenerating(true);

    const token = await getToken();
    const res = await fetch("/api/interview/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userMessage: mode === "new" ? userMessage : "" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCallStatus("inactive");
      setIsGenerating(false);
      setInputError(data.error ?? "Prompt non valido. Riprova.");
      return;
    }

    setIsGenerating(false);
    const { systemPrompt, duration, title } = data;

    const questionMap = { quick: 3, regular: 5, long: 7 };
    const numQuestions = questionMap[duration as keyof typeof questionMap] ?? 5;

    const variableValues: Record<string, string> = { userName, numQuestions: String(numQuestions) };

    if (systemPrompt) variableValues.systemPrompt = systemPrompt;

    if (mode === "try-again" && interviewId && questions) {
      variableValues.interviewId = interviewId;
      variableValues.questions = JSON.stringify(questions);
    } else if (mode === "change-questions") {
      if (role) variableValues.role = role;
      if (level) variableValues.level = level;
      if (type) variableValues.type = type;
      if (techstack) variableValues.techstack = techstack.join(", ");
      if (specialization) variableValues.specialization = specialization;
    }

    const call = await vapiRef.current?.start(
      selectedAgent.assistantId,
      {
        maxDurationSeconds: 3600,
        variableValues,
      }
    );

    if (call?.id) {
      await fetch("/api/interview/register-call", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ callId: call.id, title }),
      });
    }
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
        <div className="flex flex-col gap-6">
          {/* Agent selector */}
          <div className="flex flex-col gap-3">
            <p className="text-indigo-500 text-xs tracking-widest uppercase">
              Scegli il tuo intervistatore
            </p>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent)}
                  className={`flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedAgent.id === agent.id
                      ? "border-violet-500/50 bg-violet-500/8"
                      : "border-[#252736] bg-[#0E0F16] hover:border-indigo-700/50"
                  }`}
                >
                  <div className={`size-10 rounded-full ${agent.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{agent.initials}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-indigo-100 font-semibold text-sm">{agent.name}</p>
                      {selectedAgent.id === agent.id && (
                        <span className="text-[10px] text-violet-300 font-medium bg-violet-500/15 px-1.5 py-0.5 rounded-full">
                          Selezionato
                        </span>
                      )}
                    </div>
                    <p className="text-violet-300/80 text-xs">{agent.specialty}</p>
                  </div>
                  <p className="text-indigo-600 text-xs leading-relaxed">{agent.description}</p>
                </button>
              ))}
            </div>
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
            <div className="flex flex-col gap-2.5">
              <p className="text-indigo-600 text-xs tracking-widest uppercase">
                Ispirazione dalla community
              </p>
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
                      className="text-xs px-3 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-800/30 text-indigo-400 hover:border-violet-500/40 hover:text-violet-300 transition-colors cursor-pointer"
                    >
                      {chipText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

        {!isFinished ? (
          <Button
            onClick={isCallActive ? handleStop : handleStart}
            disabled={isConnecting}
            className={`min-w-48 rounded-full font-bold px-7 py-3 text-sm cursor-pointer transition-colors ${
              isCallActive
                ? "bg-red-400 hover:bg-red-600 text-white"
                : "bg-green-400 hover:bg-green-500 active:bg-green-500 text-white"
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
    </div>
  );
};

export default Agent;
