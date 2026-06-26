"use client";

import { useEffect, useState } from "react";
import { fetchReferenceUsdNgnRate } from "@/lib/fx-reference";
import { fromMinor, ngnToUsd, parseToMinor, usdToNgn } from "@/lib/money";

interface ConverterProps {
  userRate: number | null | undefined;
  onApplyReferenceRate?: (rate: number) => void;
}

function stripCurrencySymbols(input: string): string {
  return input.replace(/[$₦,\s]/g, "");
}

export function Converter({ userRate, onApplyReferenceRate }: ConverterProps) {
  const [usdInput, setUsdInput] = useState("");
  const [ngnInput, setNgnInput] = useState("");
  const [referenceRate, setReferenceRate] = useState<number | null>(null);

  useEffect(() => {
    void fetchReferenceUsdNgnRate().then(setReferenceRate);
  }, []);

  const rateReady = userRate != null && userRate > 0;

  function syncFromUsd(value: string) {
    setUsdInput(value);
    if (!rateReady) {
      setNgnInput("");
      return;
    }
    const cents = parseToMinor(stripCurrencySymbols(value));
    if (cents === null) {
      setNgnInput("");
      return;
    }
    try {
      const kobo = usdToNgn(cents, userRate);
      setNgnInput(String(fromMinor(kobo)));
    } catch {
      setNgnInput("");
    }
  }

  function syncFromNgn(value: string) {
    setNgnInput(value);
    if (!rateReady) {
      setUsdInput("");
      return;
    }
    const kobo = parseToMinor(stripCurrencySymbols(value));
    if (kobo === null) {
      setUsdInput("");
      return;
    }
    try {
      const cents = ngnToUsd(kobo, userRate);
      setUsdInput(String(cents / 100));
    } catch {
      setUsdInput("");
    }
  }

  return (
    <div className="space-y-4">
      {!rateReady && (
        <p className="text-sm text-neutral-500">
          Set your rate below to use the converter.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="conv-usd" className="block text-sm font-medium text-neutral-700">
            USD
          </label>
          <input
            id="conv-usd"
            type="text"
            inputMode="decimal"
            placeholder="100"
            value={usdInput}
            onChange={(e) => syncFromUsd(e.target.value)}
            disabled={!rateReady}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:bg-neutral-50 disabled:text-neutral-400"
          />
        </div>
        <div>
          <label htmlFor="conv-ngn" className="block text-sm font-medium text-neutral-700">
            NGN
          </label>
          <input
            id="conv-ngn"
            type="text"
            inputMode="decimal"
            placeholder="175000"
            value={ngnInput}
            onChange={(e) => syncFromNgn(e.target.value)}
            disabled={!rateReady}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:bg-neutral-50 disabled:text-neutral-400"
          />
        </div>
      </div>

      {referenceRate != null && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          <span>
            Reference rate — not yours: ₦
            {referenceRate.toLocaleString("en-NG", { maximumFractionDigits: 2 })}{" "}
            per $1
          </span>
          {onApplyReferenceRate && (
            <button
              type="button"
              onClick={() => onApplyReferenceRate(referenceRate)}
              className="font-medium text-teal-600 hover:text-teal-700"
            >
              Use as my rate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
