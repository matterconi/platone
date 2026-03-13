"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import InterviewInput from "@/components/InterviewInput";
import RecentInterviewsSection from "@/components/RecentInterviewsSection";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/pagination";

type CallStatus = "inactive" | "connecting" | "active" | "finished";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentConfig {
  id: string;
  name: string;
  specialty: string;
  assistantId: string;
  color: string;
  avatar: string;
  model: string;
  voice: string;
  tone: string;
  sex: string;
  credits: number;
}

type ChipCategory = "Tech" | "Finance" | "Design" | "Business" | "Health" | "Education";

const PROMPT_CHIPS: { label: string; prompt: string; category: ChipCategory }[] = [
  // Tech
  { category: "Tech", label: "Software Engineer", prompt: "Interview for a Software Engineer position. Focus on algorithms, data structures, system design, design patterns, and behavioral questions." },
  { category: "Tech", label: "Frontend Developer", prompt: "Interview for a Frontend Developer role. Focus on HTML, CSS, JavaScript, React/Vue/Angular, browser performance, accessibility, and responsive design." },
  { category: "Tech", label: "Backend Developer", prompt: "Interview for a Backend Developer position. Focus on REST/GraphQL API design, databases, caching strategies, scalability, and security." },
  { category: "Tech", label: "Full Stack Developer", prompt: "Interview for a Full Stack Developer role. Cover both frontend (React, CSS) and backend (Node.js, databases, APIs), plus deployment and DevOps basics." },
  { category: "Tech", label: "Data Analyst", prompt: "Interview for a Data Analyst role. Focus on SQL, Python/R, data visualization, statistical analysis, and translating data insights into business decisions." },
  { category: "Tech", label: "Data Scientist", prompt: "Interview for a Data Scientist position. Focus on machine learning models, feature engineering, model evaluation, Python, and communicating findings to stakeholders." },
  { category: "Tech", label: "Product Manager", prompt: "Interview for a Product Manager role in tech. Focus on product strategy, backlog prioritization, metrics, user stories, roadmapping, and cross-functional collaboration." },
  { category: "Tech", label: "DevOps Engineer", prompt: "Interview for a DevOps Engineer position. Focus on CI/CD pipelines, Docker, Kubernetes, cloud platforms (AWS/GCP/Azure), monitoring, and infrastructure as code." },
  { category: "Tech", label: "ML Engineer", prompt: "Interview for a Machine Learning Engineer role. Focus on model training, MLOps, deployment pipelines, data preprocessing, and production system design." },
  { category: "Tech", label: "Cloud Architect", prompt: "Interview for a Cloud Architect position. Focus on cloud infrastructure design, multi-cloud strategy, cost optimization, security, and migration planning." },
  { category: "Tech", label: "iOS Developer", prompt: "Interview for an iOS Developer role. Focus on Swift, SwiftUI/UIKit, memory management, App Store submission, and mobile UX best practices." },
  { category: "Tech", label: "Android Developer", prompt: "Interview for an Android Developer role. Focus on Kotlin, Jetpack Compose, Android architecture patterns (MVVM), performance, and Google Play deployment." },
  // Finance
  { category: "Finance", label: "Financial Analyst", prompt: "Interview for a Financial Analyst position. Focus on financial modeling, balance sheet analysis, company valuation, forecasting, and KPI interpretation." },
  { category: "Finance", label: "Investment Banking Analyst", prompt: "Interview for an Investment Banking Analyst role. Focus on M&A, DCF valuation, LBO models, pitch deck preparation, and capital markets knowledge." },
  { category: "Finance", label: "Private Equity Analyst", prompt: "Interview for a Private Equity Analyst position. Focus on deal sourcing, due diligence, LBO modeling, portfolio management, and exit strategies." },
  { category: "Finance", label: "Risk Manager", prompt: "Interview for a Risk Manager role. Focus on risk identification frameworks, quantitative models, regulatory compliance, stress testing, and reporting." },
  { category: "Finance", label: "Portfolio Manager", prompt: "Interview for a Portfolio Manager position. Focus on asset allocation, portfolio construction, risk-return optimization, performance attribution, and market analysis." },
  { category: "Finance", label: "Financial Controller", prompt: "Interview for a Financial Controller role. Focus on month-end close, financial reporting, budgeting, forecasting, internal controls, and IFRS/GAAP compliance." },
  { category: "Finance", label: "M&A Analyst", prompt: "Interview for an M&A Analyst position. Focus on deal structuring, financial due diligence, synergy analysis, valuation methods, and post-merger integration." },
  { category: "Finance", label: "Equity Research Analyst", prompt: "Interview for an Equity Research Analyst role. Focus on fundamental analysis, financial modeling, sector coverage, investment thesis writing, and client communication." },
  { category: "Finance", label: "Credit Analyst", prompt: "Interview for a Credit Analyst position. Focus on creditworthiness assessment, credit rating, loan structuring, collateral analysis, and risk monitoring." },
  { category: "Finance", label: "Auditor", prompt: "Interview for an Auditor role (internal or external). Focus on audit procedures, IFRS/GAAP standards, internal controls, risk assessment, and regulatory knowledge." },
  // Design
  { category: "Design", label: "UX Designer", prompt: "Interview for a UX Designer role. Focus on user-centered design process, user research, wireframing, prototyping, usability testing, and portfolio walkthrough." },
  { category: "Design", label: "UI Designer", prompt: "Interview for a UI Designer position. Focus on visual design principles, design systems, typography, color theory, component libraries, and developer handoff." },
  { category: "Design", label: "Product Designer", prompt: "Interview for a Product Designer role. Focus on problem framing, design thinking, end-to-end product design process, portfolio review, and business impact." },
  { category: "Design", label: "Brand Designer", prompt: "Interview for a Brand Designer position. Focus on visual identity creation, brand strategy, logo design, brand guidelines, and cross-channel consistency." },
  { category: "Design", label: "UX Researcher", prompt: "Interview for a UX Researcher role. Focus on qualitative and quantitative research methods, user interviews, usability studies, data synthesis, and research communication." },
  { category: "Design", label: "Motion Designer", prompt: "Interview for a Motion Designer position. Focus on animation principles, After Effects, motion in UI/UX, visual storytelling, and production workflow." },
  { category: "Design", label: "Design Lead", prompt: "Interview for a Design Lead or Head of Design role. Focus on design team leadership, mentoring, design vision, process definition, and cross-functional collaboration." },
  { category: "Design", label: "Art Director", prompt: "Interview for an Art Director position. Focus on creative direction, campaign management, client brief interpretation, visual storytelling, and team leadership." },
  { category: "Design", label: "Web Designer", prompt: "Interview for a Web Designer role. Focus on responsive design, UX for web, Figma/Adobe XD, conversion optimization, and collaboration with developers." },
  { category: "Design", label: "Visual Designer", prompt: "Interview for a Visual Designer position. Focus on graphic composition, print and digital design, applied branding, illustration, and production design." },
  // Business
  { category: "Business", label: "Sales Manager", prompt: "Interview for a Sales Manager role. Focus on sales team leadership, quota management, pipeline development, coaching, and CRM tools." },
  { category: "Business", label: "Business Development Manager", prompt: "Interview for a Business Development Manager position. Focus on strategic partnerships, go-to-market strategy, opportunity identification, and revenue growth." },
  { category: "Business", label: "Account Executive", prompt: "Interview for an Account Executive role. Focus on full-cycle sales, prospecting, demos, negotiation, objection handling, and deal closing." },
  { category: "Business", label: "Operations Manager", prompt: "Interview for an Operations Manager position. Focus on process optimization, resource planning, operational KPIs, vendor management, and continuous improvement." },
  { category: "Business", label: "Marketing Manager", prompt: "Interview for a Marketing Manager role. Focus on go-to-market strategy, campaign planning, budget allocation, performance metrics, and team management." },
  { category: "Business", label: "Strategy Consultant", prompt: "Interview for a Strategy Consultant position. Focus on structured problem solving, case frameworks, market analysis, and presenting strategic recommendations." },
  { category: "Business", label: "Project Manager", prompt: "Interview for a Project Manager role. Focus on project planning, risk management, stakeholder alignment, agile/waterfall methodologies, and delivery tracking." },
  { category: "Business", label: "HR Manager", prompt: "Interview for an HR Manager position. Focus on talent acquisition, performance management, compensation & benefits, organizational culture, and labor relations." },
  { category: "Business", label: "Growth Manager", prompt: "Interview for a Growth Manager role. Focus on acquisition funnels, retention strategy, A/B testing, data-driven experimentation, and scaling growth loops." },
  { category: "Business", label: "Chief of Staff", prompt: "Interview for a Chief of Staff position. Focus on executive support, cross-functional coordination, strategic prioritization, and executive communication." },
  // Health
  { category: "Health", label: "Physician / Doctor", prompt: "Interview for a physician role. Focus on clinical competencies, patient management, differential diagnosis, teamwork in medical settings, and professional development." },
  { category: "Health", label: "Nurse", prompt: "Interview for a nursing position. Focus on patient care, clinical protocols, emergency management, multidisciplinary teamwork, and patient communication." },
  { category: "Health", label: "Pharmacist", prompt: "Interview for a pharmacist role. Focus on pharmacology, drug interactions, patient counseling, regulatory compliance, and inventory management." },
  { category: "Health", label: "Healthcare Administrator", prompt: "Interview for a Healthcare Administrator position. Focus on facility management, healthcare budgeting, regulatory compliance, staff leadership, and quality of care." },
  { category: "Health", label: "Clinical Psychologist", prompt: "Interview for a Clinical Psychologist role. Focus on therapeutic approaches, complex case management, professional ethics, supervision, and treatment outcomes." },
  { category: "Health", label: "Physical Therapist", prompt: "Interview for a Physical Therapist position. Focus on patient assessment, rehabilitation planning, therapeutic techniques, and collaboration with the medical team." },
  { category: "Health", label: "Medical Researcher", prompt: "Interview for a Medical Researcher role. Focus on research methodology, clinical trial design, data analysis, publication record, and scientific communication." },
  { category: "Health", label: "Public Health Analyst", prompt: "Interview for a Public Health Analyst position. Focus on epidemiology, health data analysis, policy development, program evaluation, and health communication." },
  { category: "Health", label: "Surgeon", prompt: "Interview for a surgical role. Focus on surgical competencies, complication management, OR teamwork, patient communication, and continuing medical education." },
  { category: "Health", label: "Medical Device Sales", prompt: "Interview for a Medical Device Sales Representative role. Focus on product knowledge, relationship building with clinicians, territory management, and compliance." },
  // Education
  { category: "Education", label: "Teacher (K-12)", prompt: "Interview for a K-12 teacher position. Focus on pedagogy, classroom management, differentiated instruction, student assessment, and parent communication." },
  { category: "Education", label: "University Professor", prompt: "Interview for a university professor role. Focus on research agenda, publications, teaching philosophy, thesis supervision, and academic service." },
  { category: "Education", label: "Corporate Trainer", prompt: "Interview for a Corporate Trainer position. Focus on instructional design, facilitation skills, learning needs analysis, L&D strategy, and training effectiveness measurement." },
  { category: "Education", label: "E-learning Designer", prompt: "Interview for an Instructional/E-learning Designer role. Focus on digital content design, LMS platforms, gamification, SCORM standards, and learning analytics." },
  { category: "Education", label: "School Principal", prompt: "Interview for a School Principal or Head Teacher role. Focus on educational leadership, staff management, parent relations, budgeting, and school vision." },
  { category: "Education", label: "Curriculum Developer", prompt: "Interview for a Curriculum Developer position. Focus on curriculum design, standards alignment, learning objectives, instructional materials, and assessment." },
  { category: "Education", label: "Education Consultant", prompt: "Interview for an Education Consultant role. Focus on needs assessment, solution design, client relationship management, and measurable educational impact." },
  { category: "Education", label: "Academic Advisor", prompt: "Interview for an Academic Advisor or Student Success Counselor role. Focus on student guidance, academic planning, retention strategies, and communication." },
  { category: "Education", label: "Research Scientist", prompt: "Interview for a Research Scientist position in academia. Focus on research methodology, grant writing, international collaboration, publications, and knowledge transfer." },
  { category: "Education", label: "Special Education Teacher", prompt: "Interview for a Special Education Teacher role. Focus on inclusive education, IEP development, curriculum adaptation, family collaboration, and specialist coordination." },
];

const SESSION_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
  { label: "Illimitata", seconds: null },
];

const AGENTS: AgentConfig[] = [
  {
    id: "technical",
    name: "Alex",
    specialty: "Tecnico",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#67e8f9",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Alex&backgroundColor=0f0f13",
    model: "GPT-4o Mini",
    voice: "Alloy",
    tone: "Neutro",
    sex: "Neutro",
    credits: 1,
  },
  {
    id: "hr",
    name: "Sofia",
    specialty: "HR & Soft Skills",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#a78bfa",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Sofia&backgroundColor=0f0f13",
    model: "GPT-4o",
    voice: "Nova",
    tone: "Incoraggiante",
    sex: "Femminile",
    credits: 2,
  },
  {
    id: "mixed",
    name: "Marco",
    specialty: "Misto",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#b8ff00",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Marco&backgroundColor=0f0f13",
    model: "GPT-4o",
    voice: "Echo",
    tone: "Professionale",
    sex: "Maschile",
    credits: 2,
  },
  {
    id: "case-study",
    name: "Giulia",
    specialty: "Case Study",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#f9a8d4",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Giulia&backgroundColor=0f0f13",
    model: "GPT-4o",
    voice: "Shimmer",
    tone: "Empatico",
    sex: "Femminile",
    credits: 2,
  },
  {
    id: "faang",
    name: "Luca",
    specialty: "FAANG Prep",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#fb923c",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Luca&backgroundColor=0f0f13",
    model: "GPT-4o",
    voice: "Echo",
    tone: "Sfidante",
    sex: "Maschile",
    credits: 3,
  },
  {
    id: "startup",
    name: "Elena",
    specialty: "Startup",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
    color: "#34d399",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Elena&backgroundColor=0f0f13",
    model: "GPT-4o Mini",
    voice: "Fable",
    tone: "Diretto",
    sex: "Femminile",
    credits: 1,
  },
];

const CARD_PROPS: { label: string; key: keyof AgentConfig }[] = [
  { label: "Modello", key: "model" },
  { label: "Voce", key: "voice" },
  { label: "Tono", key: "tone" },
  { label: "Genere", key: "sex" },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-[10px] font-semibold tracking-widest uppercase"
    style={{ color: "rgba(240,237,230,0.45)" }}
  >
    {children}
  </p>
);

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AgentCardSelectable({
  agent,
  isSelected,
  onSelect,
}: {
  agent: AgentConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="agent-card w-full text-left transition-all duration-200 cursor-pointer h-full flex flex-col"
      style={
        {
          "--agent-color": agent.color,
          borderColor: isSelected ? `${agent.color}55` : undefined,
          boxShadow: isSelected
            ? `0 0 28px -4px ${agent.color}40`
            : undefined,
        } as React.CSSProperties
      }
    >
      {/* Avatar + identity */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="size-12 rounded-full overflow-hidden shrink-0"
          style={{ boxShadow: `0 0 0 2px ${agent.color}40` }}
        >
          <Image
            src={agent.avatar}
            alt={agent.name}
            width={48}
            height={48}
            className="size-12 object-cover"
            unoptimized
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-display text-sm font-bold text-fg truncate">{agent.name}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: agent.color }}>
            {agent.specialty}
          </span>
        </div>
        {isSelected && (
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
            style={{
              color: agent.color,
              background: `${agent.color}18`,
              border: `1px solid ${agent.color}40`,
            }}
          >
            ✓
          </span>
        )}
      </div>

      {/* Props */}
      <div className="flex flex-col gap-2.5 mb-5 flex-1">
        {CARD_PROPS.map((p) => (
          <div key={p.label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/30 uppercase tracking-wide">{p.label}</span>
            <span className="text-xs text-white/65 font-medium">{String(agent[p.key])}</span>
          </div>
        ))}
      </div>

      {/* Credits */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
        <span className="text-[11px] text-white/30 uppercase tracking-wide">Costo</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            color: agent.color,
            background: `${agent.color}18`,
            border: `1px solid ${agent.color}35`,
          }}
        >
          {agent.credits} cr / min
        </span>
      </div>
    </button>
  );
}

const Agent = ({
  userName,
  mode = "new",
  redirectOnFinish,
  recentInterviews,
  recentInterviewsLabel = "Le tue ultime interviste",
  cvFilename: initialCvFilename = null,
  interviewId,
  questions,
  role,
  level,
  type,
  techstack,
  specialization,
  initialMessage,
}: AgentProps) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const vapiRef = useRef<Vapi | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>("inactive");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState(initialMessage ?? "");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [sessionMaxSeconds, setSessionMaxSeconds] = useState<number | null>(900);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number | null>(null);
  const [remainingDisplay, setRemainingDisplay] = useState<number | null>(null);
  const [creditExpired, setCreditExpired] = useState(false);
  const remainingRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [inputMode, setInputMode] = useState<"prompt" | "url">("prompt");
  const [selectedCategory, setSelectedCategory] = useState<ChipCategory | null>("Tech");
  const [showAllChips, setShowAllChips] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobContext, setJobContext] = useState<string | null>(null);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const [cvFilename, setCvFilename] = useState<string | null>(initialCvFilename);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleCvUpload = async (file: File) => {
    setIsUploadingCv(true);
    setCvError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/user/cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setCvError(data.error ?? "Errore caricamento CV"); return; }
      setCvFilename(data.filename);
    } catch {
      setCvError("Errore durante il caricamento");
    } finally {
      setIsUploadingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  const handleCvDelete = async () => {
    setIsUploadingCv(true);
    setCvError(null);
    try {
      await fetch("/api/user/cv", { method: "DELETE" });
      setCvFilename(null);
    } catch {
      setCvError("Errore durante la rimozione");
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleFetchJob = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsFetchingJob(true);
    setJobError(null);
    setJobContext(null);
    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setJobError(data.error ?? "Impossibile leggere l'annuncio"); return; }
      setJobContext(data.text);
    } catch {
      setJobError("Errore durante il caricamento");
    } finally {
      setIsFetchingJob(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => vapiRef.current?.stop();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      abortControllerRef.current?.abort();
      vapiRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setCallStatus("connecting");
    setIsGenerating(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const token = await getToken();

    const extraVariables: Record<string, string> = {};
    if (mode === "try-again" && interviewId && questions) {
      extraVariables.interviewId = interviewId;
      extraVariables.questions = JSON.stringify(questions);
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

    let res: Response;
    try {
      res = await fetch("/api/interview/start", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: mode === "new" && inputMode === "prompt" ? userMessage : "",
          mode,
          assistantId: selectedAgent.assistantId,
          userName,
          extraVariables,
          sessionMaxSeconds,
          numQuestions,
          difficulty,
          ...(inputMode === "url" && jobContext ? { documentContext: jobContext } : {}),
        }),
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setCallStatus("inactive");
      setIsGenerating(false);
      return;
    }

    if (controller.signal.aborted) return;

    const data = await res.json();

    if (!res.ok) {
      setCallStatus("inactive");
      setIsGenerating(false);
      setInputError(data.error ?? "Prompt non valido. Riprova.");
      return;
    }

    setIsGenerating(false);
    setCreditExpired(false);
    const maxSec: number | null = data.maxDurationSeconds ?? null;
    setMaxDurationSeconds(maxSec);
    setRemainingDisplay(maxSec);
    remainingRef.current = maxSec;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    const vapi = new Vapi("reconnect-only");
    vapiRef.current = vapi;

    vapi.on("error", (error: Error) => {
      console.error("VAPI error:", error);
      setCallStatus("inactive");
    });
    vapi.on("call-start", () => {
      setCallStatus("active");
      if (remainingRef.current !== null) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const next = (remainingRef.current ?? 1) - 1;
          remainingRef.current = next;
          setRemainingDisplay(next);
          if (next <= 0) clearInterval(timerRef.current!);
        }, 1000);
      }
    });
    vapi.on("call-end", () => {
      setCallStatus("finished");
      setIsSpeaking(false);
      if (timerRef.current) clearInterval(timerRef.current);
      const expired = remainingRef.current !== null && remainingRef.current <= 10;
      if (expired) setCreditExpired(true);
      if (redirectOnFinish && !expired) {
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
        <div className="flex flex-col">

          {/* ── CONSIGLI ─────────────────────────────────────── */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center pt-0.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-bold"
                style={{ background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.1)", color: "rgba(240,237,230,0.4)" }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.5 3.5L12 5.5l-2.5 2.5.6 3.5L7 9.8l-3.1 1.7.6-3.5L2 5.5l3.5-1L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="w-px flex-1 mt-3" style={{ background: "rgba(240,237,230,0.06)" }} />
            </div>

            <div className="flex flex-col gap-4 pb-12 flex-1 min-w-0">
              <div>
                <p className="font-display text-lg font-bold leading-tight" style={{ color: "rgba(240,237,230,0.9)" }}>
                  I nostri consigli
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(240,237,230,0.35)" }}>
                  Scegli un colloquio già pronto, oppure descrivilo tu nello step successivo
                </p>
              </div>

              {/* Category tabs — underline nav style */}
              <div
                className="flex items-end gap-5 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(240,237,230,0.07)", scrollbarWidth: "none" } as React.CSSProperties}
              >
                {(["Tech", "Finance", "Design", "Business", "Health", "Education"] as ChipCategory[]).map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setSelectedCategory(cat); setShowAllChips(false); }}
                      className="text-[11px] font-medium shrink-0 cursor-pointer transition-colors pb-2.5 -mb-px"
                      style={{
                        color: active ? "rgba(240,237,230,0.88)" : "rgba(240,237,230,0.32)",
                        background: "none",
                        outline: "none",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: active ? "1.5px solid #b8ff00" : "1.5px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "rgba(240,237,230,0.6)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(240,237,230,0.32)"; }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Chips — pill content style */}
              {(() => {
                const filtered = PROMPT_CHIPS.filter((chip) => chip.category === selectedCategory);
                const LIMIT = 6;
                const visible = showAllChips ? filtered : filtered.slice(0, LIMIT);
                const hiddenCount = filtered.length - LIMIT;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {visible.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => { setUserMessage(chip.prompt); setInputError(null); }}
                        className="text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
                        style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.09)", color: "rgba(240,237,230,0.45)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.25)"; e.currentTarget.style.color = "rgba(240,237,230,0.82)"; e.currentTarget.style.background = "rgba(184,255,0,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(240,237,230,0.09)"; e.currentTarget.style.color = "rgba(240,237,230,0.45)"; e.currentTarget.style.background = "#0f0f13"; }}
                      >
                        {chip.label}
                      </button>
                    ))}
                    {!showAllChips && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllChips(true)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
                        style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.09)", color: "rgba(240,237,230,0.3)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(240,237,230,0.2)"; e.currentTarget.style.color = "rgba(240,237,230,0.6)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(240,237,230,0.09)"; e.currentTarget.style.color = "rgba(240,237,230,0.3)"; }}
                      >
                        +{hiddenCount}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── STEP 01 · Descrivi il colloquio ──────────────── */}
          <div className="flex gap-5">
            {/* Step indicator + connector */}
            <div className="flex flex-col items-center pt-0.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-bold"
                style={{ background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.1)", color: "rgba(240,237,230,0.4)" }}
              >
                01
              </div>
              <div className="w-px flex-1 mt-3" style={{ background: "rgba(240,237,230,0.06)" }} />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4 pb-12 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold leading-tight" style={{ color: "rgba(240,237,230,0.9)" }}>
                    Descrivi il colloquio
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(240,237,230,0.35)" }}>
                    {inputMode === "url" ? "Incolla il link dell'annuncio di lavoro" : "Scrivi il ruolo che vuoi allenare"}
                  </p>
                </div>
                {inputMode === "prompt" && (
                  <Link
                    href="/interview/guide"
                    className="text-[11px] shrink-0 mt-0.5 transition-colors"
                    style={{ color: "rgba(240,237,230,0.28)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.6)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.28)")}
                  >
                    Come costruire il prompt →
                  </Link>
                )}
              </div>

              {inputMode === "prompt" ? (
                <>
                  <InterviewInput
                    value={userMessage}
                    onChange={(v) => { setUserMessage(v); setInputError(null); }}
                    disabled={false}
                  />
                  {inputError && <p className="text-red-400 text-sm">{inputError}</p>}

                </>
              ) : (
                <>
                  {jobContext ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(184,255,0,0.06)", border: "1px solid rgba(184,255,0,0.18)" }}>
                      <span className="text-xs flex-1 truncate" style={{ color: "rgba(184,255,0,0.7)" }}>Annuncio caricato ✓</span>
                      <button type="button" onClick={() => { setJobContext(null); setJobUrl(""); setJobError(null); }} className="text-xs shrink-0 cursor-pointer transition-colors" style={{ color: "rgba(240,237,230,0.3)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.7)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.3)")}>✕ rimuovi</button>
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => { setJobUrl(e.target.value); setJobError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchJob(jobUrl); } }}
                      placeholder="https://..."
                      disabled={isFetchingJob}
                      className="w-full bg-[#0f0f13] rounded-xl px-4 py-3.5 text-sm placeholder:text-[rgba(240,237,230,0.2)] text-[rgba(240,237,230,0.7)] focus:outline-none disabled:opacity-50 transition-all"
                      style={{ border: "1px solid rgba(240,237,230,0.07)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.3)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(184,255,0,0.12), 0 0 20px -4px rgba(184,255,0,0.15)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(240,237,230,0.07)"; e.currentTarget.style.boxShadow = "none"; if (jobUrl.trim()) handleFetchJob(jobUrl); }}
                    />
                  )}
                  {jobError && <p className="text-red-400 text-sm">{jobError}</p>}
                </>
              )}

              {/* Secondary actions: CV + mode toggle — pill buttons for clarity */}
              <input ref={cvInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }} />
              <div className="flex items-center gap-2 flex-wrap">
                {/* CV pill */}
                {cvFilename ? (
                  <div
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(184,255,0,0.05)", border: "1px solid rgba(184,255,0,0.15)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ color: "rgba(184,255,0,0.55)", shrink: 0 }}>
                      <path d="M4 2h5l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[11px] max-w-[120px] truncate" style={{ color: "rgba(184,255,0,0.6)" }}>{cvFilename}</span>
                    <button type="button" disabled={isUploadingCv} onClick={() => cvInputRef.current?.click()} className="text-[11px] cursor-pointer transition-colors disabled:opacity-40" style={{ color: "rgba(240,237,230,0.3)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.65)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.3)")}>sostituisci</button>
                    <button type="button" disabled={isUploadingCv} onClick={handleCvDelete} className="text-[11px] cursor-pointer transition-colors disabled:opacity-40" style={{ color: "rgba(240,237,230,0.25)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,230,0.25)")}>✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingCv}
                    onClick={() => cvInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-40"
                    style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.22)", color: "rgba(251,146,60,0.7)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(251,146,60,0.4)"; e.currentTarget.style.color = "rgba(251,146,60,0.95)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(251,146,60,0.22)"; e.currentTarget.style.color = "rgba(251,146,60,0.7)"; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M4 2h5l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 2v3h3M7 6v4M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isUploadingCv ? "Caricamento..." : "Allega CV"}
                  </button>
                )}

                {/* Mode toggle pill */}
                {inputMode === "prompt" ? (
                  <button
                    type="button"
                    onClick={() => { setInputMode("url"); setInputError(null); }}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                    style={{ background: "rgba(184,255,0,0.05)", border: "1px solid rgba(184,255,0,0.2)", color: "rgba(184,255,0,0.65)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.38)"; e.currentTarget.style.color = "rgba(184,255,0,0.9)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.2)"; e.currentTarget.style.color = "rgba(184,255,0,0.65)"; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h8M7 4l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Hai un annuncio?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setInputMode("prompt"); setJobContext(null); setJobUrl(""); setJobError(null); setInputError(null); }}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                    style={{ background: "rgba(184,255,0,0.05)", border: "1px solid rgba(184,255,0,0.2)", color: "rgba(184,255,0,0.65)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.38)"; e.currentTarget.style.color = "rgba(184,255,0,0.9)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,255,0,0.2)"; e.currentTarget.style.color = "rgba(184,255,0,0.65)"; }}
                  >
                    ← Scrivi a mano
                  </button>
                )}
              </div>
              {cvError && <p className="text-red-400 text-xs">{cvError}</p>}
            </div>
          </div>

          {/* ── STEP 02 · Scegli l'intervistatore ───────────── */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center pt-0.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-bold"
                style={{ background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.1)", color: "rgba(240,237,230,0.4)" }}
              >
                02
              </div>
              <div className="w-px flex-1 mt-3" style={{ background: "rgba(240,237,230,0.06)" }} />
            </div>

            <div className="flex flex-col gap-4 pb-12 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold leading-tight" style={{ color: "rgba(240,237,230,0.9)" }}>
                    Scegli l&apos;intervistatore
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(240,237,230,0.35)" }}>
                    Ogni intervistatore ha stile, modello AI e costo diversi
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slidePrev()}
                    className="size-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "rgba(240,237,230,0.07)", color: "rgba(240,237,230,0.45)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,255,0,0.1)"; e.currentTarget.style.color = "#b8ff00"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(240,237,230,0.07)"; e.currentTarget.style.color = "rgba(240,237,230,0.45)"; }}
                    aria-label="Precedente"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slideNext()}
                    className="size-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "rgba(240,237,230,0.07)", color: "rgba(240,237,230,0.45)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,255,0,0.1)"; e.currentTarget.style.color = "#b8ff00"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(240,237,230,0.07)"; e.currentTarget.style.color = "rgba(240,237,230,0.45)"; }}
                    aria-label="Successivo"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>

              <div className="overflow-x-hidden">
              <Swiper
                modules={[Pagination]}
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                spaceBetween={12}
                slidesPerView={1.15}
                breakpoints={{
                  640: { slidesPerView: 2.2 },
                  900: { slidesPerView: 3, centeredSlides: false },
                }}
                centeredSlides
                pagination={{ clickable: true }}
                className="agents-swiper pb-10! w-full"
              >
                {AGENTS.map((agent) => (
                  <SwiperSlide key={agent.id} className="h-auto!">
                    <AgentCardSelectable
                      agent={agent}
                      isSelected={selectedAgent.id === agent.id}
                      onSelect={() => setSelectedAgent(agent)}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              </div>
            </div>
          </div>

          {/* ── STEP 03 · Impostazioni ───────────────────────── */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center pt-0.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-bold"
                style={{ background: "rgba(240,237,230,0.04)", border: "1px solid rgba(240,237,230,0.1)", color: "rgba(240,237,230,0.4)" }}
              >
                03
              </div>
            </div>

            <div className="flex flex-col gap-5 pb-4 flex-1">
              <div>
                <p className="font-display text-lg font-bold leading-tight" style={{ color: "rgba(240,237,230,0.9)" }}>
                  Impostazioni
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(240,237,230,0.35)" }}>
                  Durata massima e numero di domande
                </p>
              </div>

              {/* Durata */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.28)" }}>Durata massima</span>
                <div className="flex flex-wrap gap-2">
                  {SESSION_OPTIONS.map((opt) => {
                    const isSelected = sessionMaxSeconds === opt.seconds;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSessionMaxSeconds(opt.seconds)}
                        className="text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                        style={
                          isSelected
                            ? { background: "rgba(184,255,0,0.1)", border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00" }
                            : { background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)", color: "rgba(240,237,230,0.35)" }
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numero di domande */}
              <div className="flex flex-col gap-3" style={{ maxWidth: "280px" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.28)" }}>Numero di domande</span>
                  <span className="text-sm font-semibold" style={{ color: "#b8ff00" }}>{numQuestions}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#b8ff00]"
                  style={{ background: `linear-gradient(to right, #b8ff00 ${(numQuestions - 1) / 9 * 100}%, rgba(240,237,230,0.1) ${(numQuestions - 1) / 9 * 100}%)` }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: "rgba(240,237,230,0.25)" }}>
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Difficoltà */}
              {(() => {
                const DIFF_LABELS: Record<number, { label: string; color: string }> = {
                  1: { label: "Molto facile", color: "#4ade80" },
                  2: { label: "Facile",       color: "#a3e635" },
                  3: { label: "Medio",         color: "#facc15" },
                  4: { label: "Difficile",     color: "#fb923c" },
                  5: { label: "Molto difficile", color: "#f87171" },
                };
                const { label, color } = DIFF_LABELS[difficulty];
                return (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.28)" }}>Difficoltà</span>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setDifficulty(n)}
                            className="transition-transform hover:scale-110 cursor-pointer"
                            aria-label={"Difficoltà " + n}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path
                                d="M9 1.5l2 4.5 5 .5-3.5 3.5 1 5L9 13 4.5 15l1-5L2 6.5l5-.5z"
                                fill={n <= difficulty ? color : "rgba(240,237,230,0.08)"}
                                stroke={n <= difficulty ? color : "rgba(240,237,230,0.12)"}
                                strokeWidth="0.8"
                              />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-medium" style={{ color }}>{label}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* Loading */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div
            className="size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#b8ff00", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "rgba(184,255,0,0.6)" }}>
            Preparando l&apos;intervista...
          </p>
        </div>
      )}

      {/* Timer tempo residuo */}
      {isCallActive && remainingDisplay !== null && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)" }}
        >
          <span className="text-xs uppercase tracking-widest shrink-0" style={{ color: "rgba(240,237,230,0.35)" }}>
            Tempo residuo
          </span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(240,237,230,0.07)" }}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                remainingDisplay < 60 ? "bg-red-400" : remainingDisplay < 120 ? "bg-amber-400" : ""
              }`}
              style={{
                width: `${Math.min(100, (remainingDisplay / (maxDurationSeconds ?? remainingDisplay)) * 100)}%`,
                ...(remainingDisplay >= 120 ? { background: "linear-gradient(90deg, #b8ff00, #7ae200)" } : {}),
              }}
            />
          </div>
          <span
            className={`text-sm font-mono font-semibold tabular-nums shrink-0 ${
              remainingDisplay < 60 ? "text-red-400" : remainingDisplay < 120 ? "text-amber-400" : ""
            }`}
            style={remainingDisplay >= 120 ? { color: "#b8ff00" } : undefined}
          >
            {formatSeconds(remainingDisplay)}
          </span>
        </div>
      )}

      {/* Cards interviewer + utente */}
      {(isCallActive || isFinished) && (
        <div className="grid grid-cols-2 gap-4">

          {/* AI Interviewer */}
          <div
            className="rounded-2xl flex flex-col items-center gap-4 p-8 transition-all duration-300"
            style={{
              background: "#0f0f13",
              border: `1px solid ${isSpeaking ? `${selectedAgent.color}50` : "rgba(240,237,230,0.07)"}`,
              boxShadow: isSpeaking ? `0 0 28px -4px ${selectedAgent.color}30` : "none",
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="relative size-24 rounded-full overflow-hidden">
                <Image src="/ai-avatar.png" alt="AI Interviewer" fill className="object-cover" />
              </div>
              {isSpeaking && (
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full pointer-events-none"
                  style={{ background: `${selectedAgent.color}25` }}
                />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-semibold" style={{ color: "rgba(240,237,230,0.85)" }}>
                {selectedAgent.name}
              </p>
              <span className="text-xs" style={{ color: isSpeaking ? selectedAgent.color : "rgba(240,237,230,0.35)" }}>
                {isSpeaking ? "Sta parlando..." : "In ascolto"}
              </span>
            </div>
          </div>

          {/* Utente */}
          <div
            className="rounded-2xl flex flex-col items-center gap-4 p-8"
            style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)" }}
          >
            <div className="relative size-24 rounded-full overflow-hidden">
              <Image src="/user-avatar.png" alt={userName} fill className="object-cover" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-semibold" style={{ color: "rgba(240,237,230,0.85)" }}>
                {userName}
              </p>
              <span className="text-xs" style={{ color: "rgba(240,237,230,0.35)" }}>
                {isCallActive && !isSpeaking ? "Sta parlando..." : "Candidato"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trascrizione */}
      {messages.length > 0 && (
        <div
          className="rounded-2xl flex flex-col gap-3 p-6 max-h-64 overflow-y-auto"
          style={{ background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)" }}
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: "rgba(184,255,0,0.5)" }}>
            Trascrizione
          </p>
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-0.5 ${msg.role === "assistant" ? "items-start" : "items-end"}`}>
              <span className="text-xs" style={{ color: "rgba(240,237,230,0.3)" }}>
                {msg.role === "assistant" ? "AI Interviewer" : userName}
              </span>
              <p
                className="text-sm px-4 py-2 rounded-2xl max-w-[85%]"
                style={
                  msg.role === "assistant"
                    ? { background: "rgba(240,237,230,0.04)", color: "rgba(240,237,230,0.7)" }
                    : { background: "rgba(184,255,0,0.08)", color: "rgba(240,237,230,0.8)" }
                }
              >
                {msg.content}
              </p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}

      {/* Durata massima sessione — only for non-new modes (new mode handles it in step 03) */}
      {mode !== "new" && callStatus === "inactive" && !isGenerating && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Durata massima</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {SESSION_OPTIONS.map((opt) => {
              const isSelected = sessionMaxSeconds === opt.seconds;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSessionMaxSeconds(opt.seconds)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  style={
                    isSelected
                      ? { background: "rgba(184,255,0,0.1)", border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00" }
                      : { background: "#0f0f13", border: "1px solid rgba(240,237,230,0.07)", color: "rgba(240,237,230,0.35)" }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner crediti esauriti */}
      {isFinished && creditExpired && (
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-amber-400 font-semibold text-sm">Crediti esauriti</p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,230,0.45)" }}>
            L&apos;intervista è stata interrotta perché hai esaurito i minuti del tuo piano.
          </p>
          <Link href="/dashboard" className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2 mt-1">
            Ricarica i crediti →
          </Link>
        </div>
      )}

      {/* Status + Bottone */}
      <div className="flex flex-col items-center gap-4">
        {(isCallActive || isConnecting || isFinished) && (
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${isCallActive || isConnecting ? "animate-pulse" : ""}`}
              style={{
                background: isCallActive ? "#b8ff00" : isConnecting ? "#f59e0b" : "rgba(240,237,230,0.25)",
                boxShadow: isCallActive ? "0 0 6px rgba(184,255,0,0.8)" : "none",
              }}
            />
            <span className="text-sm" style={{ color: "rgba(240,237,230,0.45)" }}>
              {statusLabel}
            </span>
          </div>
        )}

        {!isFinished ? (
          <button
            onClick={isCallActive ? handleStop : handleStart}
            disabled={isConnecting}
            className="min-w-48 font-bold px-7 text-sm cursor-pointer transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={
              isCallActive
                ? {
                    background: "#ef4444",
                    color: "#fff",
                    height: "48px",
                    borderRadius: "99px",
                    boxShadow: "0 0 24px -4px rgba(239,68,68,0.6)",
                    border: "none",
                  }
                : {
                    background: "#b8ff00",
                    color: "#07070a",
                    height: "48px",
                    borderRadius: "4px",
                    boxShadow: "none",
                    border: "none",
                  }
            }
            onMouseEnter={(e) => {
              if (!isCallActive) e.currentTarget.style.background = "#ccff22";
            }}
            onMouseLeave={(e) => {
              if (!isCallActive) e.currentTarget.style.background = "#b8ff00";
            }}
          >
            {isCallActive ? "Termina intervista" : isConnecting ? "Connessione..." : "Inizia intervista"}
            {!isCallActive && !isConnecting && <ArrowRight />}
          </button>
        ) : !redirectOnFinish ? (
          <Button
            onClick={() => setCallStatus("inactive")}
            className="min-w-48 rounded-full font-bold px-7 py-3 text-sm cursor-pointer transition-colors"
            style={{ background: "#b8ff00", color: "#07070a" }}
          >
            Ricomincia
          </Button>
        ) : null}
      </div>

      {/* Inspiration cards — below button, only when inactive */}
      {mode === "new" && callStatus === "inactive" && (
        <RecentInterviewsSection
          interviews={recentInterviews ?? []}
          label={recentInterviewsLabel}
          onSelect={(text) => {
            setUserMessage(text);
            setInputError(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};

export default Agent;
