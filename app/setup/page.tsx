"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { BucketEditor } from "@/components/BucketEditor";
import { Converter } from "@/components/Converter";
import { Header } from "@/components/Header";
import { MyRateField } from "@/components/MyRateField";
import { queryBucketsOrdered, querySettings, updateSettings } from "@/lib/db";

export default function SetupPage() {
  const buckets = useLiveQuery(queryBucketsOrdered);
  const settings = useLiveQuery(querySettings);

  if (!buckets || !settings) {
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
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">Setup</h1>
      </div>

      <section className="mb-10 space-y-4 rounded-xl border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">USD ↔ NGN</h2>
        <MyRateField userRate={settings.userRate} />
        <Converter
          userRate={settings.userRate}
          onApplyReferenceRate={(rate) => {
            void updateSettings({ userRate: rate });
          }}
        />
      </section>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Bucket setup</h2>
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
