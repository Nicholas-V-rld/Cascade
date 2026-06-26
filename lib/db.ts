import Dexie, { type EntityTable } from "dexie";
import type { Bucket, InflowRecord, Settings, Spend, WaterfallResult } from "./types";
import { runWaterfall } from "./waterfall";

const SETTINGS_ID = "settings";

export class CascadeDB extends Dexie {
  buckets!: EntityTable<Bucket, "id">;
  inflows!: EntityTable<InflowRecord, "id">;
  settings!: EntityTable<Settings, "id">;
  spends!: EntityTable<Spend, "id">;

  constructor() {
    super("cascade");
    this.version(1).stores({
      buckets: "id, priority",
      inflows: "id, createdAt",
      settings: "id",
    });
    this.version(2).stores({
      buckets: "id, priority",
      inflows: "id, createdAt",
      settings: "id",
      spends: "id, createdAt",
    });
  }
}

export const db = new CascadeDB();

function defaultBuckets(): Bucket[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Buffer",
      priority: 0,
      balance: 0,
      rule: { kind: "fill", target: 0 },
    },
    {
      id: crypto.randomUUID(),
      name: "Move Fund",
      priority: 1,
      balance: 0,
      rule: { kind: "fill", target: 0 },
    },
    {
      id: crypto.randomUUID(),
      name: "Invest",
      priority: 2,
      balance: 0,
      rule: { kind: "percent", rate: 0.2 },
    },
  ];
}

export async function ensureSeeded(): Promise<void> {
  const count = await db.buckets.count();
  if (count === 0) {
    await db.buckets.bulkAdd(defaultBuckets());
  }

  const settings = await db.settings.get(SETTINGS_ID);
  if (!settings) {
    await db.settings.add({
      id: SETTINGS_ID,
      baseCurrency: "NGN",
      onboarded: false,
      userRate: null,
    });
  }
}

/** Read-only queries for useLiveQuery — never write here. */
export function queryBucketsOrdered(): Promise<Bucket[]> {
  return db.buckets.orderBy("priority").toArray();
}

export function querySettings(): Promise<Settings | undefined> {
  return db.settings.get(SETTINGS_ID);
}

export function queryInflowsDesc(): Promise<InflowRecord[]> {
  return db.inflows.orderBy("createdAt").reverse().toArray();
}

export async function getBuckets(): Promise<Bucket[]> {
  await ensureSeeded();
  return db.buckets.orderBy("priority").toArray();
}

export async function getBucketByName(name: string): Promise<Bucket | undefined> {
  const buckets = await getBuckets();
  return buckets.find((b) => b.name === name);
}

export async function saveBuckets(buckets: Bucket[]): Promise<void> {
  await db.transaction("rw", db.buckets, async () => {
    await db.buckets.clear();
    await db.buckets.bulkAdd(buckets);
  });
}

export async function getSettings(): Promise<Settings> {
  await ensureSeeded();
  const settings = await db.settings.get(SETTINGS_ID);
  if (!settings) {
    throw new Error("Settings not found after seed");
  }
  return settings;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id">>,
): Promise<void> {
  await db.settings.update(SETTINGS_ID, patch);
}

export async function getInflows(): Promise<InflowRecord[]> {
  await ensureSeeded();
  return db.inflows.orderBy("createdAt").reverse().toArray();
}

export interface SaveInflowInput {
  currency: "NGN" | "USD";
  originalAmount: number;
  fxRate: number | null;
  amountNGN: number;
}

export async function saveInflow(input: SaveInflowInput): Promise<InflowRecord> {
  await ensureSeeded();
  const buckets = await getBuckets();
  const result = runWaterfall(input.amountNGN, buckets);

  const record: InflowRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currency: input.currency,
    originalAmount: input.originalAmount,
    fxRate: input.fxRate,
    amountNGN: input.amountNGN,
    result,
  };

  await db.transaction("rw", [db.inflows, db.buckets], async () => {
    await db.inflows.add(record);
    for (const allocation of result.allocations) {
      const bucket = buckets.find((b) => b.id === allocation.bucketId);
      if (bucket) {
        await db.buckets.update(allocation.bucketId, {
          balance: bucket.balance + allocation.amount,
        });
      }
    }
  });

  return record;
}

export async function hasDebtBucket(): Promise<boolean> {
  const buckets = await getBuckets();
  return buckets.some((b) => b.name === "Debt");
}

export async function toggleDebtBucket(enable: boolean): Promise<void> {
  const buckets = await getBuckets();
  const hasDebt = buckets.some((b) => b.name === "Debt");

  if (enable && !hasDebt) {
    const reindexed = buckets.map((b) => ({ ...b, priority: b.priority + 1 }));
    const debt: Bucket = {
      id: crypto.randomUUID(),
      name: "Debt",
      priority: 0,
      balance: 0,
      rule: { kind: "fill", target: 0 },
    };
    await saveBuckets([debt, ...reindexed]);
    return;
  }

  if (!enable && hasDebt) {
    const withoutDebt = buckets
      .filter((b) => b.name !== "Debt")
      .map((b, i) => ({ ...b, priority: i }));
    await saveBuckets(withoutDebt);
  }
}

export function previewWaterfall(amountNGN: number, buckets: Bucket[]): WaterfallResult {
  return runWaterfall(amountNGN, buckets);
}
