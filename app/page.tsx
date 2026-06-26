"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BucketBar } from "@/components/BucketBar";
import { Header } from "@/components/Header";
import { InflowDialog } from "@/components/InflowDialog";
import {
  queryBucketsOrdered,
  queryInflowsDesc,
  querySettings,
  querySpends,
  updateSettings,
} from "@/lib/db";
import { downloadCSV } from "@/lib/csv";
import { computeSpendable } from "@/lib/spendable";
import { computeRunway, deriveMoveFundPace } from "@/lib/runway";
import { formatNGN, parseToMinor } from "@/lib/money";
import { SpendCheck } from "@/components/SpendCheck";
import Link from "next/link";

export default function HomePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setRefresh] = useState(0);
  const [manualPaceInput, setManualPaceInput] = useState("");

  const buckets = useLiveQuery(queryBucketsOrdered);
  const settings = useLiveQuery(querySettings);
  const inflows = useLiveQuery(queryInflowsDesc);
  const spends = useLiveQuery(querySpends);

  const spendable =
    inflows && spends ? computeSpendable(inflows, spends) : null;

  const moveFund = buckets?.find((b) => b.name === "Move Fund");
  const otherBuckets = buckets?.filter((b) => b.name !== "Move Fund") ?? [];

  const historyPace = useMemo(() => {
    if (!moveFund || !inflows) return null;
    return deriveMoveFundPace(inflows, moveFund.id);
  }, [moveFund, inflows]);

  const useManualPace = historyPace === null || historyPace <= 0;

  const monthlyPaceKobo = useManualPace
    ? settings?.manualMoveFundMonthlyMinor ?? 0
    : historyPace ?? 0;

  const runway = useMemo(() => {
    if (
      !moveFund ||
      moveFund.rule.kind !== "fill" ||
      moveFund.rule.target <= 0 ||
      monthlyPaceKobo <= 0
    ) {
      return null;
    }
    return computeRunway({
      now: new Date(),
      target: moveFund.rule.target,
      currentBalance: moveFund.balance,
      monthlyPaceKobo,
      deadline: moveFund.deadline,
    });
  }, [moveFund, monthlyPaceKobo]);

  function handleExport() {
    if (inflows && inflows.length > 0) {
      downloadCSV(inflows);
    }
  }

  if (!buckets) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
        <Header />
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <Header />

      {settings && !settings.onboarded && (
        <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Set your bucket targets in{" "}
          <Link href="/setup" className="font-medium underline">
            setup
          </Link>{" "}
          to start allocating.
        </div>
      )}

      {moveFund && (
        <BucketBar
          bucket={moveFund}
          variant="hero"
          runway={runway}
          monthlyPaceKobo={monthlyPaceKobo > 0 ? monthlyPaceKobo : null}
          showManualPace={useManualPace}
          manualPaceInput={
            manualPaceInput ||
            (settings?.manualMoveFundMonthlyMinor != null &&
            settings.manualMoveFundMonthlyMinor > 0
              ? String(settings.manualMoveFundMonthlyMinor / 100)
              : "")
          }
          onManualPaceInputChange={setManualPaceInput}
          onSaveManualPace={() => {
            const minor = parseToMinor(manualPaceInput);
            if (minor === null || minor <= 0) return;
            void updateSettings({ manualMoveFundMonthlyMinor: minor });
          }}
        />
      )}

      {spendable !== null && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Spendable
          </p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatNGN(spendable)}
          </p>
        </div>
      )}

      {spendable !== null && (
        <div className="mt-4">
          <SpendCheck spendable={spendable} />
        </div>
      )}

      {otherBuckets.length > 0 && (
        <section className="mt-6 space-y-4">
          {otherBuckets.map((bucket) => (
            <BucketBar key={bucket.id} bucket={bucket} variant="thin" />
          ))}
        </section>
      )}

      <div className="mt-10 space-y-4">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-lg bg-teal-600 px-4 py-3.5 text-base font-medium text-white hover:bg-teal-700"
        >
          Money came in
        </button>

        <Link
          href="/history"
          className="block w-full text-center text-sm text-neutral-600 hover:text-teal-600"
        >
          Inflow history
        </Link>

        <button
          type="button"
          onClick={handleExport}
          disabled={!inflows?.length}
          className="w-full text-center text-sm text-neutral-600 hover:text-teal-600 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {dialogOpen && (
        <InflowDialog
          buckets={buckets}
          defaultFxRate={settings?.userRate}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setRefresh((n) => n + 1)}
        />
      )}
    </main>
  );
}
