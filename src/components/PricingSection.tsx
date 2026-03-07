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
    priceId: "pri_01kk1pndq89nmbytffssa8sejw",
    description: "Perfetto per chi vuole allenarsi occasionalmente.",
    features: [
      "100 crediti al mese (~50 min)",
      "Feedback AI in tempo reale",
      "Storico delle interview",
      "Tutte le tipologie di interview",
    ],
    popular: false,
    cta: "Inizia con Casual",
  },
  {
    name: "Regular",
    price: "14.90",
    credits: 200,
    priceId: "pri_01kk1pqm2pz7sq1z47ed04gqc2",
    description: "Il piano ideale per chi cerca lavoro attivamente.",
    features: [
      "200 crediti al mese (~100 min)",
      "Feedback AI in tempo reale",
      "Storico delle interview",
      "Tutte le tipologie di interview",
      "Analisi delle performance",
    ],
    popular: true,
    cta: "Inizia con Regular",
  },
  {
    name: "Pro",
    price: "24.99",
    credits: 350,
    priceId: "pri_01kk1ptvd4ky1wtrn44awc72cv",
    description: "Per professionisti che vogliono eccellere.",
    features: [
      "350 crediti al mese (~175 min)",
      "Feedback AI in tempo reale",
      "Storico delle interview",
      "Tutte le tipologie di interview",
      "Analisi delle performance",
      "Supporto prioritario",
    ],
    popular: false,
    cta: "Inizia con Pro",
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
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3 text-center">
        <h2 className="text-indigo-100">Scegli il tuo piano</h2>
        <p className="text-indigo-400 max-w-lg mx-auto text-sm">
          Allenati con il tuo AI voice assistant e preparati al meglio per il
          prossimo colloquio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-0.5 rounded-2xl w-full ${
              plan.popular ? "bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]" : "bg-[#4B4D4F22]"
            }`}
          >
            <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col gap-6 p-6 h-full">
              {/* Badge */}
              <div className="h-6 flex justify-center">
                {plan.popular && (
                  <span className="bg-violet-300 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full">
                    Più popolare
                  </span>
                )}
              </div>

              {/* Name & Price */}
              <div className="flex flex-col gap-1">
                <h3 className="text-indigo-100">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-indigo-100">
                    €{plan.price}
                  </span>
                  <span className="text-indigo-400 mb-1 text-sm">/mese</span>
                </div>
                <p className="text-indigo-400 text-sm">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 flex-1 list-none pl-0">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-indigo-100"
                    style={{ listStyle: "none" }}
                  >
                    <span className="text-green-400 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleCheckout(plan.priceId)}
                className={
                  plan.popular
                    ? "bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10 w-full! justify-center"
                    : "bg-zinc-800! text-violet-300! hover:bg-zinc-800/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10 w-full! justify-center"
                }
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
