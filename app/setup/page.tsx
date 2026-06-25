"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { BucketEditor } from "@/components/BucketEditor";
import { Header } from "@/components/Header";
import { db, ensureSeeded } from "@/lib/db";

export default function SetupPage() {
  const buckets = useLiveQuery(async () => {
    await ensureSeeded();
    return db.buckets.orderBy("priority").toArray();
  });

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

      <div className="mb-6">
        <Link href="/" className="text-sm text-neutral-600 hover:text-teal-600">
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">
          Bucket setup
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Reorder by priority. Lower buckets run first in the waterfall.
        </p>
      </div>

      <BucketEditor
        initialBuckets={buckets}
        onSaved={() => {
          // liveQuery refreshes automatically
        }}
      />
    </main>
  );
}
