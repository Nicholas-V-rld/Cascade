"use client";

import { useMemo, useState } from "react";
import type { Bucket } from "@/lib/types";
import { previewWaterfall, saveInflow } from "@/lib/db";
import { parseToMinor, usdToNgn } from "@/lib/money";
import { AllocationResult } from "./AllocationResult";

interface InflowDialogProps {
  buckets: Bucket[];
  defaultFxRate?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export function InflowDialog({
  buckets,
  defaultFxRate,
  onClose,
  onSaved,
}: InflowDialogProps) {
  const [amount, setAmount] = useState("");
  const [useUsd, setUseUsd] = useState(false);
  const [fxRate, setFxRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNGN = useMemo(() => {
    const minor = parseToMinor(amount);
    if (minor === null) return null;
    if (!useUsd) return minor;
    const rate = Number(fxRate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    try {
      return usdToNgn(minor, rate);
    } catch {
      return null;
    }
  }, [amount, useUsd, fxRate]);

  const preview = useMemo(() => {
    if (amountNGN === null || amountNGN <= 0) return null;
    return previewWaterfall(amountNGN, buckets);
  }, [amountNGN, buckets]);

  async function handleConfirm() {
    if (amountNGN === null || amountNGN <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (useUsd) {
      const rate = Number(fxRate);
      if (!Number.isFinite(rate) || rate <= 0) {
        setError("Enter a valid FX rate");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const originalMinor = parseToMinor(amount) ?? 0;
      await saveInflow({
        currency: useUsd ? "USD" : "NGN",
        originalAmount: originalMinor,
        fxRate: useUsd ? Number(fxRate) : null,
        amountNGN,
      });
      onSaved();
      onClose();
    } catch {
      setError("Could not save inflow");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inflow-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="inflow-title" className="text-lg font-semibold text-neutral-900">
          Money came in
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
              Amount {useUsd ? "(USD)" : "(NGN)"}
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder={useUsd ? "500" : "100000"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={useUsd}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseUsd(checked);
                if (
                  checked &&
                  fxRate === "" &&
                  defaultFxRate != null &&
                  defaultFxRate > 0
                ) {
                  setFxRate(String(defaultFxRate));
                }
              }}
              className="rounded border-neutral-300 text-teal-600"
            />
            Enter in USD
          </label>

          {useUsd && (
            <div>
              <label htmlFor="fxRate" className="block text-sm font-medium text-neutral-700">
                FX rate (NGN per USD)
              </label>
              <input
                id="fxRate"
                type="text"
                inputMode="decimal"
                placeholder="1550"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          )}

          {preview && (
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Preview
              </p>
              <AllocationResult result={preview} />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !preview}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
