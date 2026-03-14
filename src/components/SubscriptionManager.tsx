"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { PLAN_CREDITS } from "@/lib/credits";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Casual", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!, credits: 100, price: "$9.90" },
  { name: "Regular", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!, credits: 200, price: "$14.90" },
  { name: "Pro", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!, credits: 350, price: "$24.99" },
];

const PLAN_LABELS: Record<string, string> = { casual: "Casual", regular: "Regular", pro: "Pro" };

const PLAN_ACCENT: Record<string, { dot: string; badge: string }> = {
  casual: { dot: "bg-[rgba(240,237,230,0.4)]", badge: "bg-[rgba(240,237,230,0.08)] text-[rgba(240,237,230,0.7)]" },
  regular: { dot: "bg-violet-400", badge: "bg-violet-400/15 text-violet-300" },
  pro:     { dot: "bg-accent",     badge: "bg-accent/15 text-accent" },
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
  renewalInfo: RenewalInfo;
};

export default function SubscriptionManager({
  plan,
  credits,
  nextPlan,
  paddleSubscriptionId,
  userEmail,
  userId,
  renewalInfo,
}: Props) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(nextPlan === "cancelled");
  const [refunding, setRefunding] = useState(false);
  const [refundResult, setRefundResult] = useState<{ previousPlan: string | null } | null>(null);
  const [downgrading, setDowngrading] = useState<string | null>(null);
  const [downgradedPlan, setDowngradedPlan] = useState<string | null>(
    nextPlan && nextPlan !== "cancelled" ? nextPlan : null
  );
  const [restoring, setRestoring] = useState(false);

  const planCredits = PLAN_CREDITS[plan] ?? 0;
  const accent = PLAN_ACCENT[plan] ?? PLAN_ACCENT.casual;

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
      if (res.ok) { setRefundResult(data); setCancelDone(true); }
      else alert(data.error ?? "Errore nel rimborso. Riprova.");
    } finally { setRefunding(false); }
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
    } finally { setDowngrading(null); }
  };

  const handleRestore = async () => {
    if (!confirm("Ripristinare l'abbonamento? La cancellazione o il downgrade schedulato verrà annullato.")) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/subscription/restore", { method: "POST" });
      if (res.ok) window.location.reload();
      else { const data = await res.json(); alert(data.error ?? "Errore nel ripristino. Riprova."); }
    } finally { setRestoring(false); }
  };

  const handleCancel = async () => {
    if (!confirm("Sei sicuro di voler cancellare l'abbonamento? Rimarrà attivo fino alla fine del periodo.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (res.ok) setCancelDone(true);
      else alert("Errore nella cancellazione. Riprova.");
    } finally { setCancelling(false); }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  const otherPlans = PLANS.filter((p) => p.name.toLowerCase() !== plan);

  return (
    <div className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] overflow-hidden flex flex-col h-full">

      {/* Plan name + status */}
      <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-2xl font-bold text-fg leading-none">
            {PLAN_LABELS[plan] ?? plan}
          </p>
          {downgradedPlan && downgradedPlan !== "cancelled" && (
            <span className="text-[10px] text-orange-300 font-medium">
              → {PLAN_LABELS[downgradedPlan] ?? downgradedPlan} al rinnovo
            </span>
          )}
        </div>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", accent.badge)}>
          {cancelDone && !refundResult ? "Cancellazione schedulata" : "Attivo"}
        </span>
      </div>

      <div className="h-px bg-[rgba(240,237,230,0.06)] mx-6" />

      {/* Renewal + actions */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {/* Renewal / status */}
        {renewalInfo && !refundResult && (() => {
          const sc = renewalInfo.scheduledChange;
          if (sc?.action === "cancel") return (
            <p className="text-xs text-red-400 bg-red-400/8 rounded-lg px-3 py-2">
              Attivo fino al {fmt(sc.effectiveAt)}
            </p>
          );
          if (renewalInfo.nextBilledAt) return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-widest text-[rgba(240,237,230,0.4)] font-semibold">
                Rinnovo il
              </span>
              <span className="text-fg text-sm font-medium">
                {fmt(renewalInfo.nextBilledAt)}
                {renewalInfo.price && (
                  <span className="text-[rgba(240,237,230,0.4)] font-normal"> · {renewalInfo.price}/mese</span>
                )}
              </span>
            </div>
          );
          return null;
        })()}

        {refundResult && (
          <p className="text-xs text-accent font-medium">
            {refundResult.previousPlan
              ? `Rimborso elaborato · piano ridotto a ${PLAN_LABELS[refundResult.previousPlan] ?? refundResult.previousPlan}`
              : "Rimborso elaborato · abbonamento cancellato"}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && credits >= planCredits && (
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="text-xs font-medium px-3.5 py-2 rounded-lg border border-[rgba(240,237,230,0.1)] text-[rgba(240,237,230,0.5)] hover:text-fg hover:border-[rgba(240,237,230,0.2)] transition-all duration-150 disabled:opacity-40"
            >
              {refunding ? "Rimborso in corso..." : "Richiedi rimborso"}
            </button>
          )}
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-medium px-3.5 py-2 rounded-lg border border-red-400/20 text-red-400/70 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/5 transition-all duration-150 disabled:opacity-40"
            >
              {cancelling ? "Cancellazione in corso..." : "Cancella abbonamento"}
            </button>
          )}
          {(cancelDone || downgradedPlan) && !refundResult && paddleSubscriptionId && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="text-xs font-medium px-3.5 py-2 rounded-lg border border-accent/30 text-accent/70 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all duration-150 disabled:opacity-40"
            >
              {restoring ? "Ripristino in corso..." : "Ripristina abbonamento"}
            </button>
          )}
        </div>
      </div>

      {/* ── Cambia piano ── */}
      {otherPlans.length > 0 && (
        <>
          <div className="h-px bg-[rgba(240,237,230,0.06)]" />

          <div className="px-6 pt-5 pb-2">
            <p className="text-sm font-semibold text-fg">Cambia piano</p>
            <p className="text-[rgba(240,237,230,0.4)] text-[11px] mt-0.5">
              Il cambio sarà attivo al prossimo rinnovo
            </p>
          </div>

          <div className="divide-y divide-[rgba(240,237,230,0.05)]">
            {otherPlans.map((p) => {
              const isUpgrade = p.credits > (PLAN_CREDITS[plan] ?? 0);
              const isThisDowngrading = downgrading === p.priceId;
              const isScheduled = !isUpgrade && downgradedPlan === p.name.toLowerCase();
              const pa = PLAN_ACCENT[p.name.toLowerCase()] ?? PLAN_ACCENT.casual;
              return (
                <div key={p.priceId} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-1.5 rounded-full shrink-0", pa.dot)} />
                      <span className="text-fg font-semibold text-sm">{p.name}</span>
                      {isScheduled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-400/15 text-orange-300">
                          Schedulato
                        </span>
                      )}
                    </div>
                    <span className="text-[rgba(240,237,230,0.4)] text-xs pl-3.5">
                      {p.credits} crediti · {p.price}/mese
                    </span>
                  </div>
                  {!isScheduled && (
                    <button
                      onClick={() => isUpgrade ? handleCheckout(p.priceId) : handleDowngrade(p.priceId, p.name)}
                      disabled={isThisDowngrading}
                      className={cn(
                        "shrink-0 h-8 px-4 rounded-lg border text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-default",
                        isUpgrade
                          ? "border-accent/50 text-accent hover:border-accent hover:bg-accent/8"
                          : "border-[rgba(240,237,230,0.12)] text-[rgba(240,237,230,0.55)] hover:text-fg hover:border-[rgba(240,237,230,0.22)] hover:bg-[rgba(240,237,230,0.04)]"
                      )}
                    >
                      {isThisDowngrading ? "..." : isUpgrade ? "Upgrade" : "Downgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
