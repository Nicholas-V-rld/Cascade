"use client";

import { useState } from "react";
import type { InflowRecord } from "@/lib/types";
import { formatNGN, fromMinor } from "@/lib/money";
import { AllocationResult } from "./AllocationResult";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUsd(cents: number): string {
  const dollars = fromMinor(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

interface InflowHistoryRowProps {
  inflow: InflowRecord;
}

export function InflowHistoryRow({ inflow }: InflowHistoryRowProps) {
  const [open, setOpen] = useState(false);

  const amountLabel =
    inflow.currency === "USD" && inflow.fxRate != null
      ? `${formatUsd(inflow.originalAmount)} @ ₦${inflow.fxRate.toLocaleString("en-NG")}/$ → ${formatNGN(inflow.amountNGN)}`
      : formatNGN(inflow.amountNGN);

  return (
    <li className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-medium text-neutral-900">{amountLabel}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {formatDate(inflow.createdAt)}
          </p>
        </div>
        <span className="text-neutral-400" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-100 px-4 py-3">
          <AllocationResult result={inflow.result} />
        </div>
      )}
    </li>
  );
}
