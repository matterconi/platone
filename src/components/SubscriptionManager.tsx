"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import { PLAN_CREDITS, DEFAULT_CREDITS_PER_MINUTE } from "@/lib/credits";

const PLANS = [
  { name: "Casual", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!, credits: 100, price: "$9.90" },
  { name: "Regular", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!, credits: 200, price: "$14.90" },
  { name: "Pro", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!, credits: 350, price: "$24.99" },
];

const PLAN_LABELS: Record<string, string> = { casual: "Casual", regular: "Regular", pro: "Pro" };
const PLAN_COLORS: Record<string, string> = {
  casual: "bg-indigo-600/30 text-indigo-100",
  regular: "bg-violet-300/20 text-violet-300",
  pro: "bg-green-400/20 text-green-400",
};

type Transaction = {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  status: string;
};

type RenewalInfo = {
  nextBilledAt: string | null;
  scheduledChange: { action: string; effectiveAt: string } | null;
  price: string | null;
} | null;

type Props = {
  plan: string;
  credits: number;
  nextPlan: string | null;
  paddleSubscriptionId: string | null;
  userEmail: string;
  userId: string;
  transactions: Transaction[];
  renewalInfo: RenewalInfo;
};

export default function SubscriptionManager({
  plan,
  credits,
  nextPlan,
  paddleSubscriptionId,
  userEmail,
  userId,
  transactions,
  renewalInfo,
}: Props) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(nextPlan === "cancelled");
  const [refunding, setRefunding] = useState(false);
  const [refundResult, setRefundResult] = useState<{ previousPlan: string | null } | null>(null);
  const [downgrading, setDowngrading] = useState<string | null>(null); // priceId in corso
  const [downgradedPlan, setDowngradedPlan] = useState<string | null>(
    nextPlan && nextPlan !== "cancelled" ? nextPlan : null
  );

  const planCredits = PLAN_CREDITS[plan] ?? 0;
  const extraCredits = Math.max(0, credits - planCredits);
  const planCreditsRemaining = Math.min(credits, planCredits);
  const remainingMinutes = Math.floor(credits / DEFAULT_CREDITS_PER_MINUTE);
  const usagePercent = planCredits > 0 ? Math.min(100, Math.round(((planCredits - planCreditsRemaining) / planCredits) * 100)) : 0;
  const isLow = usagePercent >= 80;

  useEffect(() => {
    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then(setPaddle);
  }, []);

  const handleCheckout = (priceId: string) => {
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      customData: { clerkUserId: userId },
    });
  };

  const handleRefund = async () => {
    const msg = credits >= planCredits
      ? "Richiedere il rimborso completo e cancellare l'abbonamento?"
      : "Richiedere il rimborso? L'abbonamento verrà ridotto al piano precedente.";
    if (!confirm(msg)) return;
    setRefunding(true);
    try {
      const res = await fetch("/api/subscription/refund", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRefundResult(data);
        setCancelDone(true);
      } else {
        alert(data.error ?? "Errore nel rimborso. Riprova.");
      }
    } finally {
      setRefunding(false);
    }
  };

  const handleDowngrade = async (priceId: string, planName: string) => {
    if (!confirm(`Passare al piano ${planName}? Il cambio sarà attivo al prossimo rinnovo.`)) return;
    setDowngrading(priceId);
    try {
      const res = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (res.ok) setDowngradedPlan(planName.toLowerCase());
      else alert(data.error ?? "Errore nel downgrade. Riprova.");
    } finally {
      setDowngrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Sei sicuro di voler cancellare l'abbonamento? Rimarrà attivo fino alla fine del periodo.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (res.ok) setCancelDone(true);
      else alert("Errore nella cancellazione. Riprova.");
    } finally {
      setCancelling(false);
    }
  };

  const otherPlans = PLANS.filter((p) => p.name.toLowerCase() !== plan);

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      {/* Piano attuale */}
      <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33]">
        <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl flex flex-col gap-8 p-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-indigo-400 text-sm">Piano attuale</span>
              <span className="text-indigo-100 text-2xl font-bold">{PLAN_LABELS[plan] ?? plan}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_COLORS[plan] ?? "bg-slate-900 text-indigo-400"}`}>
                Attivo
              </span>
              {(cancelDone || nextPlan === "cancelled") && (
                <span className="text-xs text-red-400 font-medium">Cancellazione schedulata</span>
              )}
              {downgradedPlan && downgradedPlan !== "cancelled" && (
                <span className="text-xs text-yellow-400 font-medium">
                  Passa a {PLAN_LABELS[downgradedPlan] ?? downgradedPlan} al rinnovo
                </span>
              )}
            </div>
          </div>

          {/* Credits */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-indigo-400 text-sm">Credits piano</span>
              <span className="text-indigo-100 font-semibold tabular-nums">
                {planCreditsRemaining}{" "}
                <span className="text-indigo-400 font-normal text-sm">/ {planCredits}</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-violet-300"}`}
                style={{ width: `${100 - usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-indigo-400">
              <span className={isLow ? "text-red-400 font-medium" : ""}>
                ~{remainingMinutes} min rimanenti
              </span>
              {extraCredits > 0 ? (
                <span className="text-violet-400 font-medium">+{extraCredits} extra</span>
              ) : (
                <span>{planCreditsRemaining} credits</span>
              )}
            </div>
          </div>

          {/* Rinnovo */}
          {renewalInfo && !cancelDone && !refundResult && (() => {
            const sc = renewalInfo.scheduledChange;
            const fmt = (d: string) =>
              new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
            if (sc?.action === "cancel") {
              return (
                <span className="text-xs text-red-400">
                  Attivo fino al {fmt(sc.effectiveAt)}
                </span>
              );
            }
            if (renewalInfo.nextBilledAt) {
              return (
                <span className="text-xs text-indigo-400">
                  Rinnovo il {fmt(renewalInfo.nextBilledAt)}
                  {renewalInfo.price && <> · {renewalInfo.price}/mese</>}
                </span>
              );
            }
            return null;
          })()}

          {/* Rimborso */}
          {refundResult && (
            <span className="text-xs text-green-400 font-medium">
              {refundResult.previousPlan
                ? `Rimborso elaborato · piano ridotto a ${PLAN_LABELS[refundResult.previousPlan] ?? refundResult.previousPlan}`
                : "Rimborso elaborato · abbonamento cancellato"}
            </span>
          )}
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && credits >= planCredits && (
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="text-xs text-indigo-400 hover:text-green-400 transition-colors text-left disabled:opacity-50"
            >
              {refunding ? "Rimborso in corso…" : "Richiedi rimborso"}
            </button>
          )}

          {/* Cancellazione */}
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-indigo-400 hover:text-red-400 transition-colors text-left disabled:opacity-50"
            >
              {cancelling ? "Cancellazione in corso…" : "Cancella abbonamento"}
            </button>
          )}
        </div>
      </div>

      {/* Cambia piano */}
      {otherPlans.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-indigo-400 text-sm">Cambia piano</span>
          <div className="flex flex-col gap-2">
            {otherPlans.map((p) => {
              const isUpgrade = p.credits > (PLAN_CREDITS[plan] ?? 0);
              const isThisDowngrading = downgrading === p.priceId;
              const isScheduled = !isUpgrade && downgradedPlan === p.name.toLowerCase();
              return (
                <button
                  key={p.priceId}
                  onClick={() =>
                    isUpgrade
                      ? handleCheckout(p.priceId)
                      : handleDowngrade(p.priceId, p.name)
                  }
                  disabled={isThisDowngrading || isScheduled}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#1A1C20] border border-[#4B4D4F33] hover:border-[#4B4D4F] transition-colors text-left disabled:opacity-60 disabled:cursor-default"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-indigo-100 font-semibold">{p.name}</span>
                    <span className="text-indigo-400 text-xs">{p.credits} crediti/mese · {p.price}</span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isScheduled
                      ? "bg-yellow-400/20 text-yellow-400"
                      : isUpgrade
                      ? "bg-violet-300/20 text-violet-300"
                      : "bg-slate-800 text-indigo-400"
                  }`}>
                    {isThisDowngrading ? "…" : isScheduled ? "Schedulato" : isUpgrade ? "Upgrade" : "Downgrade"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Storico pagamenti */}
      {transactions.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-indigo-400 text-sm">Storico pagamenti</span>
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#1A1C20] border border-[#4B4D4F33]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-indigo-100 text-sm font-medium">
                    {new Date(tx.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="text-indigo-400 text-xs capitalize">{tx.status}</span>
                </div>
                <span className="text-indigo-100 font-semibold tabular-nums">
                  {tx.currency} {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
