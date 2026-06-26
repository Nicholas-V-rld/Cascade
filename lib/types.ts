export type AllocationRule =
  | { kind: "fill"; target: number }
  | { kind: "percent"; rate: number };

export interface Bucket {
  id: string;
  name: string;
  priority: number;
  balance: number;
  rule: AllocationRule;
  /** ISO date YYYY-MM-DD — optional goal deadline for fill buckets. */
  deadline?: string;
}

export interface Allocation {
  bucketId: string;
  bucketName: string;
  amount: number;
}

export interface WaterfallResult {
  inflow: number;
  allocations: Allocation[];
  free: number;
}

export interface InflowRecord {
  id: string;
  createdAt: string;
  currency: "NGN" | "USD";
  originalAmount: number;
  fxRate: number | null;
  amountNGN: number;
  result: WaterfallResult;
}

export interface Settings {
  id: string;
  baseCurrency: "NGN";
  onboarded: boolean;
  /** NGN per 1 USD — the rate you actually get when you cash out. */
  userRate?: number | null;
}

export interface Spend {
  id: string;
  createdAt: number;
  amountMinor: number;
  note?: string;
}
