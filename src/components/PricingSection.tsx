"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const plans = [
  {
    name: "Casual",
    price: "9.90",
    credits: 100,
    minutes: 50,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!,
    description: "Per chi si allena ogni tanto.",
    features: [
      "100 crediti / mese (~50 min)",
      "Feedback AI in tempo reale",
      "Tutte le tipologie di interview",
      "Storico delle sessioni",
    ],
    popular: false,
    cta: "Scegli Casual",
  },
  {
    name: "Regular",
    price: "14.90",
    credits: 200,
    minutes: 100,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!,
    description: "Ideale per chi cerca lavoro attivamente.",
    features: [
      "200 crediti / mese (~100 min)",
      "Feedback AI in tempo reale",
      "Tutte le tipologie di interview",
      "Storico delle sessioni",
      "Analisi delle performance",
    ],
    popular: true,
    cta: "Scegli Regular",
  },
  {
    name: "Pro",
    price: "24.99",
    credits: 350,
    minutes: 175,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!,
    description: "Per professionisti che vogliono eccellere.",
    features: [
      "350 crediti / mese (~175 min)",
      "Feedback AI in tempo reale",
      "Tutte le tipologie di interview",
      "Storico delle sessioni",
      "Analisi delle performance",
      "Supporto prioritario",
    ],
    popular: false,
    cta: "Scegli Pro",
  },
];

type Plan = (typeof plans)[number];

function PlanCard({
  plan,
  onCheckout,
}: {
  plan: Plan;
  onCheckout: (priceId: string) => void;
}) {
  return (
    <div
      className="rounded-[14px] w-full h-full relative flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
      style={
        plan.popular
          ? {
              border: "1px solid rgba(184,255,0,0.18)",
              boxShadow:
                "0 0 32px -4px rgba(184,255,0,0.12), 0 2px 16px rgba(0,0,0,0.5)",
            }
          : {
              border: "1px solid rgba(240,237,230,0.11)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }
      }
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span
            className="text-[11px] font-bold tracking-widest uppercase px-3.5 py-1 rounded-full"
            style={{
              background: "#b8ff00",
              color: "#07070a",
              letterSpacing: "0.08em",
            }}
          >
            Più popolare
          </span>
        </div>
      )}

      <div
        className="rounded-[14px] h-full flex flex-col gap-6 p-5 lg:p-6"
        style={{ background: "#141418" }}
      >
        {/* Name + Price */}
        <div className="flex flex-col gap-1 pt-2">
          <span
            className="text-[11px] font-semibold uppercase"
            style={{
              letterSpacing: "0.1em",
              color: plan.popular ? "#b8ff00" : "rgba(240,237,230,0.35)",
            }}
          >
            {plan.name}
          </span>
          <div className="flex items-end gap-1 mt-1">
            <span
              className="text-[2.4rem] font-bold leading-none tabular-nums"
              style={{ color: "#f0ede6", letterSpacing: "-0.03em" }}
            >
              ${plan.price}
            </span>
            <span
              className="mb-1 text-sm font-normal"
              style={{ color: "rgba(240,237,230,0.35)" }}
            >
              /mese
            </span>
          </div>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(240,237,230,0.45)" }}
          >
            {plan.description}
          </p>
        </div>

        {/* Divider */}
        <div
          className="h-px"
          style={{
            background: plan.popular
              ? "rgba(184,255,0,0.12)"
              : "rgba(240,237,230,0.07)",
          }}
        />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: "rgba(240,237,230,0.75)" }}
            >
              <span
                className="mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={
                  plan.popular
                    ? {
                        background: "rgba(184,255,0,0.12)",
                        color: "#b8ff00",
                      }
                    : {
                        background: "rgba(240,237,230,0.06)",
                        color: "rgba(240,237,230,0.4)",
                      }
                }
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onCheckout(plan.priceId)}
          className="w-full min-h-10 px-5 font-bold text-sm cursor-pointer transition-all duration-150 rounded-sm"
          style={
            plan.popular
              ? {
                  background: "#b8ff00",
                  color: "#07070a",
                }
              : {
                  background: "rgba(240,237,230,0.05)",
                  color: "rgba(240,237,230,0.75)",
                  border: "1px solid rgba(240,237,230,0.1)",
                }
          }
          onMouseEnter={(e) => {
            if (plan.popular) {
              (e.currentTarget as HTMLButtonElement).style.background = "#ccff22";
            } else {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(240,237,230,0.09)";
            }
          }}
          onMouseLeave={(e) => {
            if (plan.popular) {
              (e.currentTarget as HTMLButtonElement).style.background = "#b8ff00";
            } else {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(240,237,230,0.05)";
            }
          }}
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}

const PricingSection = () => {
  const { user } = useUser();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production";
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    console.log("[Paddle] init — environment:", env, "| token:", token ? token.slice(0, 12) + "…" : "MISSING");
    initializePaddle({ environment: env, token: token! })
      .then((p) => {
        console.log("[Paddle] initialized:", !!p);
        setPaddle(p);
      })
      .catch((err) => console.error("[Paddle] init error:", err));
  }, []);

  const handleCheckout = (priceId: string) => {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const payload = {
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData: { clerkUserId: user.id },
    };
    console.log("[Paddle] Checkout.open payload:", JSON.stringify(payload));
    if (!paddle) {
      console.error("[Paddle] paddle instance is undefined");
      return;
    }
    paddle.Checkout.open(payload);
  };

  return (
    <section className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-3 text-left">
        <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-[1.1]">
          Scegli il tuo<br />
          <span className="text-accent">piano.</span>
        </h2>
        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: "rgba(240,237,230,0.45)" }}
        >
          Ogni piano include l&apos;AI voice coach, feedback in tempo reale e lo storico
          delle sessioni. Disdici quando vuoi.
        </p>
      </div>

      {/* Mobile / Tablet — Swiper carousel */}
      <div
        className="lg:hidden overflow-x-hidden [--swiper-pagination-color:#b8ff00] [--swiper-pagination-bullet-inactive-color:rgba(240,237,230,0.2)] [--swiper-pagination-bullet-inactive-opacity:1]"
      >
        <Swiper
          modules={[Pagination]}
          initialSlide={1}
          slidesPerView={1}
          spaceBetween={16}
          pagination={{ clickable: true }}
          breakpoints={{ 640: { slidesPerView: 2 }, 768: { slidesPerView: 2 } }}
          className="pb-10!"
        >
          {plans.map((plan) => (
            <SwiperSlide key={plan.name} className="h-auto! pt-4">
              <PlanCard plan={plan} onCheckout={handleCheckout} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop — 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 lg:items-stretch">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} onCheckout={handleCheckout} />
        ))}
      </div>

      {/* Footer note */}
      <p
        className="text-left text-xs"
        style={{ color: "rgba(240,237,230,0.3)" }}
      >
        Pagamento sicuro tramite Paddle · IVA inclusa · Disdici in qualsiasi momento
      </p>
    </section>
  );
};

export default PricingSection;
