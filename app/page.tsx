"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BucketBar } from "@/components/BucketBar";
import { Header } from "@/components/Header";
import { InflowDialog } from "@/components/InflowDialog";
import {
  queryBucketsOrdered,
  queryInflowsDesc,
  querySettings,
} from "@/lib/db";
import { downloadCSV } from "@/lib/csv";
import Link from "next/link";

export default function HomePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setRefresh] = useState(0);

  const buckets = useLiveQuery(queryBucketsOrdered);
  const settings = useLiveQuery(querySettings);
  const inflows = useLiveQuery(queryInflowsDesc);

  const moveFund = buckets?.find((b) => b.name === "Move Fund");
  const otherBuckets = buckets?.filter((b) => b.name !== "Move Fund") ?? [];

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

      {moveFund && <BucketBar bucket={moveFund} variant="hero" />}

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
