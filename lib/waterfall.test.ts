import { describe, expect, it } from "vitest";
import { runWaterfall } from "./waterfall";
import type { Bucket } from "./types";

function bucket(
  overrides: Partial<Bucket> & Pick<Bucket, "id" | "name" | "priority" | "rule">,
): Bucket {
  return { balance: 0, ...overrides };
}

describe("runWaterfall", () => {
  it("exact-fill: inflow exactly fills the first bucket", () => {
    const buckets: Bucket[] = [
      bucket({
        id: "1",
        name: "Buffer",
        priority: 0,
        balance: 0,
        rule: { kind: "fill", target: 50_000_00 },
      }),
      bucket({
        id: "2",
        name: "Invest",
        priority: 1,
        balance: 0,
        rule: { kind: "percent", rate: 0.2 },
      }),
    ];

    const result = runWaterfall(50_000_00, buckets);

    expect(result.allocations).toEqual([
      { bucketId: "1", bucketName: "Buffer", amount: 50_000_00 },
    ]);
    expect(result.free).toBe(0);
  });

  it("partial-fill-runs-dry: inflow runs out before all buckets are filled", () => {
    const buckets: Bucket[] = [
      bucket({
        id: "1",
        name: "Buffer",
        priority: 0,
        balance: 0,
        rule: { kind: "fill", target: 100_000_00 },
      }),
      bucket({
        id: "2",
        name: "Move Fund",
        priority: 1,
        balance: 0,
        rule: { kind: "fill", target: 500_000_00 },
      }),
    ];

    const result = runWaterfall(30_000_00, buckets);

    expect(result.allocations).toEqual([
      { bucketId: "1", bucketName: "Buffer", amount: 30_000_00 },
    ]);
    expect(result.free).toBe(0);
  });

  it("percent-after-fill: fill bucket served first, then percent of remainder", () => {
    const buckets: Bucket[] = [
      bucket({
        id: "1",
        name: "Buffer",
        priority: 0,
        balance: 40_000_00,
        rule: { kind: "fill", target: 100_000_00 },
      }),
      bucket({
        id: "2",
        name: "Invest",
        priority: 1,
        balance: 0,
        rule: { kind: "percent", rate: 0.2 },
      }),
    ];

    const result = runWaterfall(100_000_00, buckets);

    expect(result.allocations).toEqual([
      { bucketId: "1", bucketName: "Buffer", amount: 60_000_00 },
      { bucketId: "2", bucketName: "Invest", amount: 8_000_00 },
    ]);
    expect(result.free).toBe(32_000_00);
  });

  it("all-targets-met-so-everything-free: fill targets already met", () => {
    const buckets: Bucket[] = [
      bucket({
        id: "1",
        name: "Buffer",
        priority: 0,
        balance: 100_000_00,
        rule: { kind: "fill", target: 100_000_00 },
      }),
      bucket({
        id: "2",
        name: "Move Fund",
        priority: 1,
        balance: 500_000_00,
        rule: { kind: "fill", target: 500_000_00 },
      }),
      bucket({
        id: "3",
        name: "Invest",
        priority: 2,
        balance: 0,
        rule: { kind: "percent", rate: 0.2 },
      }),
    ];

    const result = runWaterfall(50_000_00, buckets);

    expect(result.allocations).toEqual([
      { bucketId: "3", bucketName: "Invest", amount: 10_000_00 },
    ]);
    expect(result.free).toBe(40_000_00);
  });

  it("invariant: sum(allocations) + free === inflow", () => {
    const buckets: Bucket[] = [
      bucket({
        id: "1",
        name: "Debt",
        priority: 0,
        balance: 10_000_00,
        rule: { kind: "fill", target: 200_000_00 },
      }),
      bucket({
        id: "2",
        name: "Buffer",
        priority: 1,
        balance: 0,
        rule: { kind: "fill", target: 50_000_00 },
      }),
      bucket({
        id: "3",
        name: "Invest",
        priority: 2,
        balance: 5_000_00,
        rule: { kind: "percent", rate: 0.15 },
      }),
    ];

    const inflow = 237_500_00;
    const result = runWaterfall(inflow, buckets);
    const allocated = result.allocations.reduce((s, a) => s + a.amount, 0);

    expect(allocated + result.free).toBe(inflow);
    expect(result.inflow).toBe(inflow);
  });
});
