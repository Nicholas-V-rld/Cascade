import type { InflowRecord } from "./types";
import { formatNGN, fromMinor } from "./money";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatAllocations(inflow: InflowRecord): string {
  return inflow.result.allocations
    .map((a) => `${a.bucketName}:${fromMinor(a.amount)}`)
    .join("; ");
}

export function inflowsToCSV(inflows: InflowRecord[]): Blob {
  const headers = [
    "date",
    "currency",
    "original_amount",
    "fx_rate",
    "amount_ngn",
    "allocations",
    "free_ngn",
  ];

  const rows = inflows.map((inflow) => [
    inflow.createdAt,
    inflow.currency,
    String(fromMinor(inflow.originalAmount)),
    inflow.fxRate !== null ? String(inflow.fxRate) : "",
    String(fromMinor(inflow.amountNGN)),
    formatAllocations(inflow),
    String(fromMinor(inflow.result.free)),
  ]);

  const lines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => escapeCSV(cell)).join(",")),
  ];

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

export function downloadCSV(inflows: InflowRecord[], filename = "cascade-ledger.csv"): void {
  const blob = inflowsToCSV(inflows);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatAllocationSummary(inflow: InflowRecord): string {
  const parts = inflow.result.allocations.map(
    (a) => `${formatNGN(a.amount)} → ${a.bucketName}`,
  );
  if (inflow.result.free > 0) {
    parts.push(`${formatNGN(inflow.result.free)} is yours`);
  }
  return parts.join(" · ");
}
