import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import CommunityInterviews from "@/components/CommunityInterviews";
import PricingSection from "@/components/PricingSection";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="flex flex-col gap-24 px-6 py-14 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="p-px rounded-3xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F22]">
        <div className="flex flex-row bg-linear-to-b from-[#171532] to-[#08090D] rounded-3xl px-12 py-10 items-center justify-between gap-10 max-sm:flex-col max-sm:px-6 max-sm:py-8">
          {/* Left */}
          <div className="flex flex-col gap-5 max-w-md">
            <span className="self-start bg-violet-400/10 text-violet-300 text-xs font-semibold tracking-wide px-3 py-1 rounded-full border border-violet-400/20 uppercase">
              AI Voice Coach
            </span>
            <h1 className="text-white text-[2.6rem] font-bold leading-[1.15] tracking-tight max-sm:text-3xl">
              Allenati per il colloquio che conta.
            </h1>
            <p className="text-indigo-300/70 text-base leading-relaxed max-w-sm">
              Parla con un AI voice coach, ricevi feedback in tempo reale e
              misura i tuoi progressi — sessione dopo sessione.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                asChild
                className="bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-6 cursor-pointer min-h-10 shrink-0"
              >
                <Link href="/interview/new">
                  {user ? "Nuova interview" : "Inizia gratis"}
                </Link>
              </Button>
              {!user && (
                <Link
                  href="/sign-in"
                  className="text-indigo-400 text-sm hover:text-indigo-100 transition-colors"
                >
                  Hai già un account? Accedi →
                </Link>
              )}
            </div>
          </div>

          {/* Illustration */}
          <div className="shrink-0 max-sm:hidden">
            <VoiceIllustration />
          </div>
        </div>
      </section>

      {/* Community interviews */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-white text-xl">Interview dalla community</h2>
            <p className="text-indigo-300/60 text-sm">
              Le ultime interview create dagli utenti — riutilizzale o creane di nuove.
            </p>
          </div>
          <Link
            href="/interview/new"
            className="text-violet-300 text-sm font-medium hover:text-violet-200 transition-colors shrink-0"
          >
            Crea la tua →
          </Link>
        </div>
        <CommunityInterviews />
      </section>

      {/* Pricing */}
      <div id="pricing">
        <PricingSection />
      </div>
    </main>
  );
}

function VoiceIllustration() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <circle cx="90" cy="90" r="80" fill="url(#outerGlow)" opacity="0.15" />
      <circle cx="90" cy="90" r="60" fill="url(#innerGlow)" opacity="0.12" />

      {/* Mic body */}
      <rect
        x="74"
        y="36"
        width="32"
        height="56"
        rx="16"
        fill="url(#micGrad)"
      />

      {/* Mic stand arc */}
      <path
        d="M58 90 C58 118 122 118 122 90"
        stroke="url(#arcGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Mic stand line */}
      <line
        x1="90"
        y1="118"
        x2="90"
        y2="136"
        stroke="#6366F1"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Base */}
      <line
        x1="72"
        y1="136"
        x2="108"
        y2="136"
        stroke="#6366F1"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Sound waves — left */}
      <path
        d="M48 72 Q38 90 48 108"
        stroke="#A5B4FC"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M36 60 Q20 90 36 120"
        stroke="#A5B4FC"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Sound waves — right */}
      <path
        d="M132 72 Q142 90 132 108"
        stroke="#C4B5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M144 60 Q160 90 144 120"
        stroke="#C4B5FD"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Mic highlight */}
      <rect
        x="80"
        y="42"
        width="8"
        height="20"
        rx="4"
        fill="white"
        opacity="0.12"
      />

      <defs>
        <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="micGrad" x1="74" y1="36" x2="106" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="arcGrad" x1="58" y1="104" x2="122" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
