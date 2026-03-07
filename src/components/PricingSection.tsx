"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Casual",
    price: "9.90",
    credits: 100,
    minutes: 50,
    priceId: "pri_01kk1pndq89nmbytffssa8sejw",
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
    priceId: "pri_01kk1pqm2pz7sq1z47ed04gqc2",
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
    priceId: "pri_01kk1ptvd4ky1wtrn44awc72cv",
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

const PricingSection = () => {
  const { user } = useUser();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then(setPaddle);
  }, []);

  const handleCheckout = (priceId: string) => {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: user.primaryEmailAddress?.emailAddress ?? "" },
      customData: { clerkUserId: user.id },
    });
  };

  return (
    <section className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-3 text-center">
        <h2 className="text-indigo-100">Scegli il tuo piano</h2>
        <p className="text-indigo-400 max-w-md mx-auto text-sm leading-relaxed">
          Ogni piano include l&apos;AI voice coach, feedback in tempo reale e lo storico
          delle sessioni. Disdici quando vuoi.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-px rounded-2xl w-full relative ${
              plan.popular
                ? "bg-linear-to-b from-violet-500/60 via-violet-500/20 to-transparent"
                : "bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F22]"
            }`}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <span className="bg-violet-300 text-zinc-950 text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  Più popolare
                </span>
              </div>
            )}

            <div
              className={`rounded-2xl h-full flex flex-col gap-6 p-6 ${
                plan.popular
                  ? "bg-linear-to-b from-[#1E1A3A] to-[#08090D]"
                  : "bg-linear-to-b from-[#1A1C20] to-[#08090D]"
              }`}
            >
              {/* Name */}
              <div className="flex flex-col gap-1 pt-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    plan.popular ? "text-violet-400" : "text-indigo-500"
                  }`}
                >
                  {plan.name}
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-indigo-100 tabular-nums">
                    ${plan.price}
                  </span>
                  <span className="text-indigo-400 mb-1.5 text-sm">/mese</span>
                </div>
                <p className="text-indigo-400 text-sm">{plan.description}</p>
              </div>

              {/* Divider */}
              <div className={`h-px ${plan.popular ? "bg-violet-500/20" : "bg-[#4B4D4F44]"}`} />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-indigo-100"
                  >
                    <span
                      className={`mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        plan.popular
                          ? "bg-violet-400/20 text-violet-300"
                          : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleCheckout(plan.priceId)}
                className={
                  plan.popular
                    ? "bg-violet-300! text-zinc-950! hover:bg-violet-200! rounded-full! font-bold! cursor-pointer min-h-10 w-full! justify-center"
                    : "bg-[#ffffff0a]! text-indigo-100! hover:bg-[#ffffff14]! border! border-[#4B4D4F]! rounded-full! font-semibold! cursor-pointer min-h-10 w-full! justify-center"
                }
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-indigo-500 text-xs">
        Pagamento sicuro tramite Paddle · IVA inclusa · Disdici in qualsiasi momento
      </p>
    </section>
  );
};

export default PricingSection;
