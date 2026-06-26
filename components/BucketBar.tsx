"use client";

import type { Bucket } from "@/lib/types";
import type { RunwayResult } from "@/lib/runway";
import { formatNGN, formatNGNCompact } from "@/lib/money";

interface BucketBarProps {
  bucket: Bucket;
  variant?: "hero" | "thin";
  runway?: RunwayResult | null;
  monthlyPaceKobo?: number | null;
  showManualPace?: boolean;
  manualPaceInput?: string;
  onManualPaceInputChange?: (value: string) => void;
  onSaveManualPace?: () => void;
}

export function BucketBar({
  bucket,
  variant = "thin",
  runway,
  monthlyPaceKobo,
  showManualPace,
  manualPaceInput,
  onManualPaceInputChange,
  onSaveManualPace,
}: BucketBarProps) {
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
            {showManualPace && (
              <div className="mt-4 space-y-2">
                <label
                  htmlFor="manual-pace"
                  className="block text-xs font-medium text-neutral-600"
                >
                  Monthly contribution (NGN)
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-pace"
                    type="text"
                    inputMode="decimal"
                    placeholder="50000"
                    value={manualPaceInput ?? ""}
                    onChange={(e) => onManualPaceInputChange?.(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={onSaveManualPace}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            {runway && monthlyPaceKobo != null && monthlyPaceKobo > 0 && runway.completionDate && (
              <p className="mt-4 text-sm text-neutral-600">
                At ~{formatNGNCompact(monthlyPaceKobo)}/mo → on track for{" "}
                {runway.completionDate.toLocaleDateString("en-NG", {
                  month: "short",
                  year: "numeric",
                })}
                {runway.deadlineWeeksDelta != null && (
                  <>
                    {" "}
                    (
                    {Math.abs(runway.deadlineWeeksDelta)} week
                    {Math.abs(runway.deadlineWeeksDelta) === 1 ? "" : "s"}{" "}
                    {runway.deadlineWeeksDelta >= 0 ? "ahead" : "behind"} your
                    goal)
                  </>
                )}
              </p>
            )}
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
