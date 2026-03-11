"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const AGENTS = [
  {
    name: "Marco",
    model: "GPT-4o",
    voice: "Onyx",
    tone: "Professionale",
    sex: "Maschile",
    credits: 2,
    specialty: "Behavioral",
    color: "#b8ff00",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Marco&backgroundColor=0f0f13",
  },
  {
    name: "Sofia",
    model: "GPT-4o",
    voice: "Nova",
    tone: "Incoraggiante",
    sex: "Femminile",
    credits: 2,
    specialty: "HR Screening",
    color: "#a78bfa",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Sofia&backgroundColor=0f0f13",
  },
  {
    name: "Alex",
    model: "GPT-4o Mini",
    voice: "Alloy",
    tone: "Neutro",
    sex: "Neutro",
    credits: 1,
    specialty: "Tecnico",
    color: "#67e8f9",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Alex&backgroundColor=0f0f13",
  },
  {
    name: "Giulia",
    model: "GPT-4o",
    voice: "Shimmer",
    tone: "Empatico",
    sex: "Femminile",
    credits: 2,
    specialty: "Case Study",
    color: "#f9a8d4",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Giulia&backgroundColor=0f0f13",
  },
  {
    name: "Luca",
    model: "GPT-4o",
    voice: "Echo",
    tone: "Sfidante",
    sex: "Maschile",
    credits: 3,
    specialty: "FAANG Prep",
    color: "#fb923c",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Luca&backgroundColor=0f0f13",
  },
  {
    name: "Elena",
    model: "GPT-4o Mini",
    voice: "Fable",
    tone: "Diretto",
    sex: "Femminile",
    credits: 1,
    specialty: "Startup",
    color: "#34d399",
    avatar: "https://api.dicebear.com/9.x/personas/svg?seed=Elena&backgroundColor=0f0f13",
  },
];

const PROPS: { label: string; key: keyof (typeof AGENTS)[0] }[] = [
  { label: "Modello", key: "model" },
  { label: "Voce", key: "voice" },
  { label: "Tono", key: "tone" },
  { label: "Genere", key: "sex" },
];

type Agent = (typeof AGENTS)[0];

function AgentCard({ agent, delay = 0 }: { agent: Agent; delay?: number }) {
  return (
    <motion.div
      className="agent-card h-full"
      style={{ "--agent-color": agent.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Avatar + Identity */}
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
      </div>

      {/* Props */}
      <div className="flex flex-col gap-2.5 mb-5">
        {PROPS.map((p) => (
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
    </motion.div>
  );
}

export default function AgentsSlider() {
  return (
    <div className="relative max-w-5xl">

      {/* ── Agenti ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-end mb-12">
          <div className="flex flex-col gap-3 text-right">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-none">
              I nostri agenti
            </h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm">
              Ogni agente ha un carattere, una voce e un costo diverso. Scegli quello più adatto al tuo obiettivo.
            </p>
          </div>
        </div>

        {/* Mobile slider */}
        <div className="md:hidden">
          <Swiper
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{ 450: { slidesPerView: 1.2, centeredSlides: true } }}
            pagination={{ clickable: true }}
            className="agents-swiper !pb-10"
          >
            {AGENTS.map((agent) => (
              <SwiperSlide key={agent.name} className="flex! justify-center">
                <div className="w-full max-w-92.5">
                  <AgentCard agent={agent} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-4">
          {AGENTS.map((agent, idx) => (
            <AgentCard key={agent.name} agent={agent} delay={idx * 0.07} />
          ))}
        </div>
      </motion.div>

    </div>
  );
}
