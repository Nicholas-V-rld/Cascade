"use client";

import type { Bucket } from "@/lib/types";
import { formatNGN, formatNGNCompact } from "@/lib/money";

interface BucketBarProps {
  bucket: Bucket;
  variant?: "hero" | "thin";
}

export function BucketBar({ bucket, variant = "thin" }: BucketBarProps) {
  const target =
    bucket.rule.kind === "fill" ? bucket.rule.target : null;
  const progress =
    target && target > 0
      ? Math.min(100, Math.round((bucket.balance / target) * 100))
      : null;

  if (variant === "hero") {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="text-sm font-medium text-neutral-500">{bucket.name}</p>
        {target && target > 0 ? (
          <>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
              {formatNGNCompact(bucket.balance)} of {formatNGNCompact(target)}
              {progress !== null && (
                <span className="ml-2 text-xl font-normal text-neutral-400">
                  · {progress}%
                </span>
              )}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-lg text-neutral-500">
            Set a target in{" "}
            <a href="/setup" className="text-teal-600 underline">
              setup
            </a>
          </p>
        )}
      </section>
    );
  }

  const label =
    bucket.rule.kind === "fill"
      ? target && target > 0
        ? `${formatNGNCompact(bucket.balance)} / ${formatNGNCompact(target)}`
        : formatNGN(bucket.balance)
      : `${formatNGN(bucket.balance)} · ${Math.round(bucket.rule.rate * 100)}% of inflow`;

  const barWidth =
    bucket.rule.kind === "fill" && target && target > 0
      ? Math.min(100, (bucket.balance / target) * 100)
      : bucket.balance > 0
        ? 100
        : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-neutral-700">{bucket.name}</span>
        <span className="text-neutral-500">{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-teal-500/70 transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
