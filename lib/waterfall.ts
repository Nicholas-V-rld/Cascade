import type { Allocation, Bucket, WaterfallResult } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function runWaterfall(inflow: number, buckets: Bucket[]): WaterfallResult {
  if (inflow < 0) {
    throw new Error("Inflow must be non-negative");
  }

  const sorted = [...buckets].sort((a, b) => a.priority - b.priority);
  let remaining = inflow;
  const allocations: Allocation[] = [];

  for (const bucket of sorted) {
    let take: number;
    if (bucket.rule.kind === "fill") {
      take = clamp(bucket.rule.target - bucket.balance, 0, remaining);
    } else {
      take = clamp(Math.round(remaining * bucket.rule.rate), 0, remaining);
    }

    remaining -= take;

    if (take > 0) {
      allocations.push({
        bucketId: bucket.id,
        bucketName: bucket.name,
        amount: take,
      });
    }
  }

  const free = remaining;

  const total = allocations.reduce((sum, a) => sum + a.amount, 0) + free;
  if (total !== inflow) {
    throw new Error(`Waterfall invariant violated: ${total} !== ${inflow}`);
  }

  return { inflow, allocations, free };
}
