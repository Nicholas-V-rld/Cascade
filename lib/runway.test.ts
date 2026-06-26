import { describe, expect, it } from "vitest";
import { computeRunway, deriveMoveFundPace } from "./runway";
import type { InflowRecord } from "./types";

const NOW = new Date("2026-06-01T12:00:00.000Z");

function inflow(
  createdAt: string,
  moveFundAmount: number,
  bucketId = "mf",
): InflowRecord {
  return {
    id: createdAt,
    createdAt,
    currency: "NGN",
    originalAmount: moveFundAmount,
    fxRate: null,
    amountNGN: moveFundAmount,
    result: {
      inflow: moveFundAmount,
      allocations: [{ bucketId, bucketName: "Move Fund", amount: moveFundAmount }],
      free: 0,
    },
  };
}

describe("deriveMoveFundPace", () => {
  it("returns null with fewer than 2 inflows", () => {
    expect(deriveMoveFundPace([inflow("2026-01-01", 10_000_00)], "mf")).toBeNull();
  });

  it("averages Move Fund allocation over the window as a 30-day pace", () => {
    const inflows = [
      inflow("2026-01-01T00:00:00.000Z", 30_000_00),
      inflow("2026-03-02T00:00:00.000Z", 30_000_00),
    ];
    expect(deriveMoveFundPace(inflows, "mf")).toBe(30_000_00);
  });
});

describe("computeRunway", () => {
  it("projects completion from pace with a fixed now", () => {
    const result = computeRunway({
      now: NOW,
      target: 100_000_00,
      currentBalance: 40_000_00,
      monthlyPaceKobo: 20_000_00,
    });

    expect(result.remaining).toBe(60_000_00);
    expect(result.completionDate?.toISOString()).toBe("2026-08-30T12:00:00.000Z");
    expect(result.deadlineWeeksDelta).toBeNull();
  });

  it("reports weeks ahead of a deadline", () => {
    const result = computeRunway({
      now: NOW,
      target: 100_000_00,
      currentBalance: 40_000_00,
      monthlyPaceKobo: 20_000_00,
      deadline: "2026-12-01",
    });

    expect(result.deadlineWeeksDelta).toBeGreaterThan(0);
  });

  it("returns null completion when pace is zero", () => {
    const result = computeRunway({
      now: NOW,
      target: 100_000_00,
      currentBalance: 0,
      monthlyPaceKobo: 0,
    });

    expect(result.completionDate).toBeNull();
  });
});
