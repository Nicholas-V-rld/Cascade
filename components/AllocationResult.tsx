"use client";

import type { WaterfallResult } from "@/lib/types";
import { formatNGN } from "@/lib/money";

interface AllocationResultProps {
  result: WaterfallResult;
}

export function AllocationResult({ result }: AllocationResultProps) {
  const parts = result.allocations.map(
    (a) => `${formatNGN(a.amount)} → ${a.bucketName}`,
  );

  if (result.free > 0) {
    parts.push(`${formatNGN(result.free)} is yours`);
  }

  if (parts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {formatNGN(result.inflow)} is yours — no buckets to fill.
      </p>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-neutral-700">{parts.join(" · ")}</p>
  );
}
