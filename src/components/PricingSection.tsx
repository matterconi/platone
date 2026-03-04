import Link from "next/link";

import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Casual",
    price: "9,99",
    description: "Perfetto per chi vuole allenarsi occasionalmente.",
    features: [
      "30 minuti di interview al mese",
      "Feedback AI in tempo reale",
      "Storico delle interview",
      "Tutte le tipologie di interview",
    ],
    popular: false,
    cta: "Inizia con Casual",
  },
  {
    name: "Regular",
    price: "14,99",
    description: "Il piano ideale per chi cerca lavoro attivamente.",
    features: [
      "1 ora di interview al mese",
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
    price: "29,99",
    description: "Per professionisti che vogliono eccellere.",
    features: [
      "3 ore di interview al mese",
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
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3 text-center">
        <h2 className="text-light-100">Scegli il tuo piano</h2>
        <p className="text-light-400 max-w-lg mx-auto text-sm">
          Allenati con il tuo AI voice assistant e preparati al meglio per il
          prossimo colloquio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-0.5 rounded-2xl w-full ${
              plan.popular ? "border-gradient" : "bg-[#4B4D4F22]"
            }`}
          >
            <div className="card flex flex-col gap-6 p-6 h-full rounded-2xl">
              {/* Badge */}
              <div className="h-6 flex justify-center">
                {plan.popular && (
                  <span className="bg-primary-200 text-dark-100 text-xs font-bold px-3 py-1 rounded-full">
                    Più popolare
                  </span>
                )}
              </div>

              {/* Name & Price */}
              <div className="flex flex-col gap-1">
                <h3 className="text-light-100">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-light-100">
                    €{plan.price}
                  </span>
                  <span className="text-light-400 mb-1 text-sm">/mese</span>
                </div>
                <p className="text-light-400 text-sm">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 flex-1 list-none pl-0">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-light-100"
                    style={{ listStyle: "none" }}
                  >
                    <span className="text-success-100 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={
                  plan.popular
                    ? "btn-primary !w-full justify-center"
                    : "btn-secondary !w-full justify-center"
                }
              >
                <Link href="/sign-up">{plan.cta}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
