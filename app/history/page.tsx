"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Header } from "@/components/Header";
import { InflowHistoryRow } from "@/components/InflowHistoryRow";
import { queryInflowsDesc } from "@/lib/db";

export default function HistoryPage() {
  const inflows = useLiveQuery(queryInflowsDesc);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <Header />

      <div className="mb-6">
        <Link href="/" className="text-sm text-neutral-600 hover:text-teal-600">
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">
          Inflow history
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Past inflows and where each one went.
        </p>
      </div>

      {!inflows ? (
        <p className="text-neutral-500">Loading…</p>
      ) : inflows.length === 0 ? (
        <p className="text-sm text-neutral-500">No inflows yet.</p>
      ) : (
        <ul className="space-y-3">
          {inflows.map((inflow) => (
            <InflowHistoryRow key={inflow.id} inflow={inflow} />
          ))}
        </ul>
      )}
    </main>
  );
}
