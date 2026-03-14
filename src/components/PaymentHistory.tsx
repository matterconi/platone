"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  status: string;
};

export default function PaymentHistory({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false);

  if (!transactions.length) return null;

  return (
    <>
      <div className="h-px bg-[rgba(240,237,230,0.06)]" />

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-3 hover:opacity-80 transition-opacity text-left"
      >
        <div className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="2" stroke="rgba(240,237,230,0.4)" strokeWidth="1.2" />
            <path d="M5 7h6M5 10h4" stroke="rgba(240,237,230,0.4)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[rgba(240,237,230,0.6)] text-sm font-medium">Storico pagamenti</span>
          <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-[rgba(240,237,230,0.06)] text-[rgba(240,237,230,0.4)]">
            {transactions.length}
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={cn("transition-transform duration-200 text-[rgba(240,237,230,0.35)]", open && "rotate-180")}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col divide-y divide-[rgba(240,237,230,0.05)] -mx-6 border-t border-[rgba(240,237,230,0.05)]">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-3">
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
      )}
    </>
  );
}
