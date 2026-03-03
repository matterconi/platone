"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

import { Button } from "@/components/ui/button";

type CallStatus = "inactive" | "connecting" | "active" | "finished";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Agent = ({ userName, userId, interviewId, type, questions }: AgentProps) => {
  const vapiRef = useRef<Vapi | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>("inactive");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    setCallStatus("connecting");
    await vapiRef.current?.start(
      process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
      {
        maxDurationSeconds: 3600,
      }
    );
  };

  const handleStop = () => {
    vapiRef.current?.stop();
  };

  const isCallActive = callStatus === "active";
  const isConnecting = callStatus === "connecting";
  const isFinished = callStatus === "finished";
  const isInactive = callStatus === "inactive";

  const statusLabel = {
    inactive: "In attesa",
    connecting: "Connessione in corso...",
    active: "Intervista in corso",
    finished: "Intervista terminata",
  }[callStatus];

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">

      {/* Cards interviewer + utente */}
      <div className="grid grid-cols-2 gap-6">

        {/* AI Interviewer */}
        <div className="card-border">
          <div className="card flex flex-col items-center gap-4 p-8">
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
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-200/40 pointer-events-none" />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-light-100 font-semibold">AI Interviewer</p>
              <span className="text-light-400 text-xs">
                {isSpeaking ? "Sta parlando..." : "In ascolto"}
              </span>
            </div>
          </div>
        </div>

        {/* Utente */}
        <div className="card-border">
          <div className="card flex flex-col items-center gap-4 p-8">
            <div className="relative size-24 rounded-full overflow-hidden">
              <Image
                src="/user-avatar.png"
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-light-100 font-semibold">{userName}</p>
              <span className="text-light-400 text-xs">
                {isCallActive && !isSpeaking ? "Sta parlando..." : "Candidato"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trascrizione */}
      {messages.length > 0 && (
        <div className="card-border w-full">
          <div className="card flex flex-col gap-3 p-6 max-h-64 overflow-y-auto">
            <p className="text-light-400 text-xs uppercase tracking-widest mb-1">
              Trascrizione
            </p>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-0.5 ${
                  msg.role === "assistant" ? "items-start" : "items-end"
                }`}
              >
                <span className="text-light-400 text-xs">
                  {msg.role === "assistant" ? "AI Interviewer" : userName}
                </span>
                <p
                  className={`text-sm px-4 py-2 rounded-2xl max-w-[85%] ${
                    msg.role === "assistant"
                      ? "bg-dark-300 text-light-100"
                      : "bg-primary-200/20 text-light-100"
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
                ? "bg-success-100 animate-pulse"
                : isConnecting
                ? "bg-yellow-400 animate-pulse"
                : isFinished
                ? "bg-light-600"
                : "bg-light-600"
            }`}
          />
          <span className="text-light-400 text-sm">{statusLabel}</span>
        </div>

        {!isFinished ? (
          <Button
            onClick={isCallActive ? handleStop : handleStart}
            disabled={isConnecting}
            className={`min-w-48 rounded-full font-bold ${
              isCallActive
                ? "bg-destructive-100 hover:bg-destructive-200 text-white"
                : "btn-call"
            }`}
          >
            {isCallActive
              ? "Termina intervista"
              : isConnecting
              ? "Connessione..."
              : "Inizia intervista"}
          </Button>
        ) : (
          <Button
            onClick={() => setCallStatus("inactive")}
            className="btn-call min-w-48 rounded-full font-bold"
          >
            Ricomincia
          </Button>
        )}
      </div>
    </div>
  );
};

export default Agent;
