/** Convert a major-unit amount (e.g. naira) to minor units (kobo). */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

/** Convert minor units (kobo) to major units (naira). */
export function fromMinor(minor: number): number {
  return minor / 100;
}

/** Format kobo as ₦ display string with thousands separators. */
export function formatNGN(minor: number): string {
  const major = fromMinor(minor);
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(major);
  return `₦${formatted}`;
}

/** Compact format for hero display, e.g. ₦220k of ₦1.4M */
export function formatNGNCompact(minor: number): string {
  const major = fromMinor(minor);
  if (major >= 1_000_000) {
    const m = major / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (major >= 1_000) {
    const k = major / 1_000;
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return formatNGN(minor);
}

/** Parse user input string to minor units (kobo). Strips ₦, commas, spaces. */
export function parseToMinor(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (cleaned === "") return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return toMinor(num);
}
