"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { PLAN_CREDITS, DEFAULT_CREDITS_PER_MINUTE } from "@/lib/credits";
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

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("transition-transform duration-200", open && "rotate-180")}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [downgrading, setDowngrading] = useState<string | null>(null);
  const [downgradedPlan, setDowngradedPlan] = useState<string | null>(
    nextPlan && nextPlan !== "cancelled" ? nextPlan : null
  );
  const [restoring, setRestoring] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const planCredits = PLAN_CREDITS[plan] ?? 0;
  const extraCredits = Math.max(0, credits - planCredits);
  const planCreditsRemaining = Math.min(credits, planCredits);
  const remainingMinutes = Math.floor(credits / DEFAULT_CREDITS_PER_MINUTE);
  const usagePercent = planCredits > 0
    ? Math.min(100, Math.round(((planCredits - planCreditsRemaining) / planCredits) * 100))
    : 0;
  const isLow = usagePercent >= 80;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl items-start">

      {/* ── Piano attuale ── */}
      <div className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] overflow-hidden">

        {/* Header strip */}
        <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
              Piano attuale
            </p>
            <p className="font-display text-2xl font-bold text-fg leading-none">
              {PLAN_LABELS[plan] ?? plan}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", accent.badge)}>
              {cancelDone && !refundResult ? "Cancellazione schedulata" : "Attivo"}
            </span>
            {downgradedPlan && downgradedPlan !== "cancelled" && (
              <span className="text-[10px] text-orange-300 font-medium">
                → {PLAN_LABELS[downgradedPlan] ?? downgradedPlan} al rinnovo
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(240,237,230,0.06)] mx-6" />

        {/* Credits block */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Numbers row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-widest text-[rgba(240,237,230,0.4)] font-semibold">
                Crediti rimanenti
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-fg tabular-nums">
                  {planCreditsRemaining}
                </span>
                <span className="text-[rgba(240,237,230,0.35)] text-sm">/ {planCredits}</span>
                {extraCredits > 0 && (
                  <span className="text-accent text-xs font-semibold ml-1">+{extraCredits} extra</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-widest text-[rgba(240,237,230,0.4)] font-semibold block">
                Minuti
              </span>
              <span className={cn("font-display text-3xl font-bold tabular-nums", isLow ? "text-red-400" : "text-fg")}>
                ~{remainingMinutes}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-1.5 bg-[rgba(240,237,230,0.06)] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  isLow ? "bg-red-400" : "bg-accent"
                )}
                style={{ width: `${100 - usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[rgba(240,237,230,0.35)]">
              <span>{usagePercent}% utilizzato</span>
              <span className={isLow ? "text-red-400 font-medium" : ""}>{isLow ? "Crediti in esaurimento" : `${100 - usagePercent}% disponibile`}</span>
            </div>
          </div>

          {/* Renewal / status */}
          {renewalInfo && !refundResult && (() => {
            const sc = renewalInfo.scheduledChange;
            if (sc?.action === "cancel") return (
              <p className="text-xs text-red-400 bg-red-400/8 rounded-lg px-3 py-2">
                Attivo fino al {fmt(sc.effectiveAt)}
              </p>
            );
            if (renewalInfo.nextBilledAt) return (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-widest text-[rgba(240,237,230,0.4)] font-semibold">
                  Rinnovo il
                </span>
                <span className="text-fg text-sm font-medium">
                  {fmt(renewalInfo.nextBilledAt)}
                  {renewalInfo.price && <span className="text-[rgba(240,237,230,0.4)] font-normal"> · {renewalInfo.price}/mese</span>}
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
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(240,237,230,0.06)] mx-6" />

        {/* Actions footer */}
        <div className="px-6 py-4 flex flex-wrap gap-2">
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && credits >= planCredits && (
            <button
              onClick={handleRefund}
              disabled={refunding}
              className={cn(
                "text-xs font-medium px-3.5 py-2 rounded-lg border border-[rgba(240,237,230,0.1)]",
                "text-[rgba(240,237,230,0.5)] hover:text-fg hover:border-[rgba(240,237,230,0.2)]",
                "transition-all duration-150 disabled:opacity-40"
              )}
            >
              {refunding ? "Rimborso in corso…" : "Richiedi rimborso"}
            </button>
          )}
          {!cancelDone && !refundResult && nextPlan !== "cancelled" && paddleSubscriptionId && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className={cn(
                "text-xs font-medium px-3.5 py-2 rounded-lg border border-red-400/20",
                "text-red-400/70 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/5",
                "transition-all duration-150 disabled:opacity-40"
              )}
            >
              {cancelling ? "Cancellazione in corso…" : "Cancella abbonamento"}
            </button>
          )}
          {(cancelDone || downgradedPlan) && !refundResult && paddleSubscriptionId && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className={cn(
                "text-xs font-medium px-3.5 py-2 rounded-lg border border-accent/30",
                "text-accent/70 hover:text-accent hover:border-accent/50 hover:bg-accent/5",
                "transition-all duration-150 disabled:opacity-40"
              )}
            >
              {restoring ? "Ripristino in corso…" : "Ripristina abbonamento"}
            </button>
          )}
        </div>
      </div>

      {/* ── Right column: Cambia piano + Storico ── */}
      <div className="flex flex-col gap-5">

      {/* ── Cambia piano ── */}
      {otherPlans.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
            Cambia piano
          </p>
          <div className="bg-[#0f0f13] rounded-xl ring-1 ring-[rgba(240,237,230,0.07)] divide-y divide-[rgba(240,237,230,0.06)]">
            {otherPlans.map((p) => {
              const isUpgrade = p.credits > (PLAN_CREDITS[plan] ?? 0);
              const isThisDowngrading = downgrading === p.priceId;
              const isScheduled = !isUpgrade && downgradedPlan === p.name.toLowerCase();
              const pa = PLAN_ACCENT[p.name.toLowerCase()] ?? PLAN_ACCENT.casual;
              return (
                <div key={p.priceId} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("size-2 rounded-full shrink-0", pa.dot)} />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-fg font-semibold text-sm">{p.name}</span>
                      <span className="text-[rgba(240,237,230,0.4)] text-xs">
                        {p.credits} crediti/mese · {p.price}
                      </span>
                    </div>
                    {isScheduled && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-orange-400/15 text-orange-300">
                        Schedulato
                      </span>
                    )}
                  </div>
                  {!isScheduled && (
                    <button
                      onClick={() => isUpgrade ? handleCheckout(p.priceId) : handleDowngrade(p.priceId, p.name)}
                      disabled={isThisDowngrading}
                      className={cn(
                        isUpgrade
                          ? "cta-primary w-full justify-center h-10 text-sm"
                          : cn(
                            "w-full h-10 rounded border border-[rgba(240,237,230,0.12)] text-sm font-semibold",
                            "text-[rgba(240,237,230,0.6)] hover:text-fg hover:border-[rgba(240,237,230,0.22)] hover:bg-[rgba(240,237,230,0.04)]",
                            "transition-all duration-150"
                          ),
                        "disabled:opacity-40 disabled:cursor-default"
                      )}
                    >
                      {isThisDowngrading ? "…" : `Passa a ${p.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Storico pagamenti (toggle) ── */}
      {transactions.length > 0 && (
        <div className="flex flex-col gap-0">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "flex items-center justify-between w-full px-5 py-4 rounded-2xl",
              "bg-[#0f0f13] ring-1 ring-[rgba(240,237,230,0.07)]",
              "hover:ring-[rgba(240,237,230,0.12)] transition-all duration-200 text-left",
              showHistory && "rounded-b-none ring-b-0"
            )}
          >
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="10" rx="2" stroke="rgba(240,237,230,0.4)" strokeWidth="1.2" />
                <path d="M5 7h6M5 10h4" stroke="rgba(240,237,230,0.4)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-[rgba(240,237,230,0.6)] text-sm font-medium">
                Storico pagamenti
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(240,237,230,0.07)] text-[rgba(240,237,230,0.4)]">
                {transactions.length}
              </span>
            </div>
            <span className="text-[rgba(240,237,230,0.35)]">
              <ChevronDown open={showHistory} />
            </span>
          </button>

          {showHistory && (
            <div className="bg-[#0f0f13] ring-1 ring-[rgba(240,237,230,0.07)] ring-t-0 rounded-b-2xl overflow-hidden">
              <div className="h-px bg-[rgba(240,237,230,0.06)]" />
              <div className="flex flex-col divide-y divide-[rgba(240,237,230,0.05)]">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-fg text-sm font-medium">
                        {new Date(tx.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[rgba(240,237,230,0.35)] text-xs capitalize">{tx.status}</span>
                    </div>
                    <span className="text-fg font-semibold text-sm tabular-nums">
                      {tx.currency} {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      </div>{/* end right column */}
    </div>
  );
}
