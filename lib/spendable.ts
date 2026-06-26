import type { InflowRecord, Spend } from "./types";

/** Derived spendable envelope: Σ(inflow.result.free) − Σ(spend.amountMinor). */
export function computeSpendable(
  inflows: InflowRecord[],
  spends: Spend[],
): number {
  const totalFree = inflows.reduce((sum, inflow) => sum + inflow.result.free, 0);
  const totalSpent = spends.reduce((sum, spend) => sum + spend.amountMinor, 0);
  return totalFree - totalSpent;
}
