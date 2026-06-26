import { describe, expect, it } from "vitest";
import { computeSpendable } from "./spendable";
import type { InflowRecord, Spend } from "./types";

function inflow(free: number): InflowRecord {
  return {
    id: "1",
    createdAt: "2026-01-01T00:00:00.000Z",
    currency: "NGN",
    originalAmount: free,
    fxRate: null,
    amountNGN: free,
    result: { inflow: free, allocations: [], free },
  };
}

function spend(amountMinor: number): Spend {
  return { id: "s1", createdAt: 1, amountMinor };
}

describe("computeSpendable", () => {
  it("sums free from inflows minus logged spends", () => {
    const inflows = [inflow(50_000_00), inflow(30_000_00)];
    const spends = [spend(10_000_00), spend(5_000_00)];
    expect(computeSpendable(inflows, spends)).toBe(65_000_00);
  });

  it("returns zero when nothing logged", () => {
    expect(computeSpendable([], [])).toBe(0);
  });

  it("allows negative when spends exceed free", () => {
    const inflows = [inflow(20_000_00)];
    const spends = [spend(25_000_00)];
    expect(computeSpendable(inflows, spends)).toBe(-5_000_00);
  });
});
