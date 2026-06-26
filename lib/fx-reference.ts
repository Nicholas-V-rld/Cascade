/** Best-effort reference USD→NGN rate. Never throws; returns null on failure. */
export async function fetchReferenceUsdNgnRate(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=NGN",
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { NGN?: number } };
    const rate = data.rates?.NGN;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return null;
    }
    return rate;
  } catch {
    return null;
  }
}
