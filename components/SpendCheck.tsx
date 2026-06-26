"use client";

import { useMemo, useState } from "react";
import { logSpend } from "@/lib/db";
import { formatNGN, parseToMinor } from "@/lib/money";

interface SpendCheckProps {
  spendable: number;
  onLogged?: () => void;
}

export function SpendCheck({ spendable, onLogged }: SpendCheckProps) {
  const [amount, setAmount] = useState("");
  const [logging, setLogging] = useState(false);

  const amountMinor = useMemo(() => parseToMinor(amount), [amount]);

  const verdict = useMemo(() => {
    if (amountMinor === null || amountMinor <= 0) return null;
    const remaining = spendable - amountMinor;
    if (remaining >= 0) {
      return {
        ok: true,
        message: `clear — ${formatNGN(remaining)} spendable left after this`,
      };
    }
    return {
      ok: false,
      message: `not clear — this dips ${formatNGN(Math.abs(remaining))} into your buckets`,
    };
  }, [amountMinor, spendable]);

  async function handleLog() {
    if (amountMinor === null || amountMinor <= 0) return;
    setLogging(true);
    try {
      await logSpend(amountMinor);
      setAmount("");
      onLogged?.();
    } finally {
      setLogging(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Spend check</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Can I spend this right now?
      </p>

      <input
        type="text"
        inputMode="decimal"
        placeholder="Amount (NGN)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />

      {verdict && (
        <p
          className={`mt-3 text-sm ${verdict.ok ? "text-teal-700" : "text-amber-700"}`}
        >
          {verdict.message}
        </p>
      )}

      {verdict && (
        <button
          type="button"
          onClick={handleLog}
          disabled={logging}
          className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
        >
          {logging ? "Logging…" : "Log this spend"}
        </button>
      )}
    </section>
  );
}
