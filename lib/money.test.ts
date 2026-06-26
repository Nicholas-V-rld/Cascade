import { describe, expect, it } from "vitest";
import { ngnToUsd, usdToNgn } from "./money";

describe("usdToNgn / ngnToUsd", () => {
  it("converts a known case: 100 USD at rate 1500 → ₦150,000", () => {
    expect(usdToNgn(10_000, 1500)).toBe(15_000_000);
  });

  it("round-trip stays within 1 USD cent", () => {
    const rate = 1750.5;
    const usdCents = 12_345;
    const ngnKobo = usdToNgn(usdCents, rate);
    const back = ngnToUsd(ngnKobo, rate);
    expect(Math.abs(back - usdCents)).toBeLessThanOrEqual(1);
  });

  it("rejects rate 0", () => {
    expect(() => usdToNgn(10_000, 0)).toThrow("Invalid FX rate");
    expect(() => ngnToUsd(15_000_000, 0)).toThrow("Invalid FX rate");
  });

  it("rejects null rate", () => {
    expect(() => usdToNgn(10_000, null as unknown as number)).toThrow(
      "Invalid FX rate",
    );
    expect(() => ngnToUsd(15_000_000, null as unknown as number)).toThrow(
      "Invalid FX rate",
    );
  });
});
