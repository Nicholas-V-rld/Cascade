import type { InflowRecord } from "./types";

export interface RunwayInput {
  now: Date;
  target: number;
  currentBalance: number;
  /** NGN kobo allocated to Move Fund per 30-day month. */
  monthlyPaceKobo: number;
  /** ISO date YYYY-MM-DD */
  deadline?: string;
}

export interface RunwayResult {
  remaining: number;
  completionDate: Date | null;
  /** Weeks ahead (+) or behind (−) the deadline; null if no deadline or no pace. */
  deadlineWeeksDelta: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Average Move Fund allocation per 30-day month over the inflow window. */
export function deriveMoveFundPace(
  inflows: InflowRecord[],
  moveFundBucketId: string,
): number | null {
  if (inflows.length < 2) return null;

  const sorted = [...inflows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const windowMs =
    new Date(sorted[sorted.length - 1].createdAt).getTime() -
    new Date(sorted[0].createdAt).getTime();
  const windowDays = Math.max(windowMs / MS_PER_DAY, 1);

  let totalMoveFund = 0;
  for (const inflow of sorted) {
    const alloc = inflow.result.allocations.find(
      (a) => a.bucketId === moveFundBucketId,
    );
    totalMoveFund += alloc?.amount ?? 0;
  }

  if (totalMoveFund <= 0) return null;

  return Math.round((totalMoveFund / windowDays) * 30);
}

export function computeRunway(input: RunwayInput): RunwayResult {
  const remaining = Math.max(0, input.target - input.currentBalance);

  if (input.monthlyPaceKobo <= 0) {
    return { remaining, completionDate: null, deadlineWeeksDelta: null };
  }

  const monthsNeeded = remaining / input.monthlyPaceKobo;
  const completionDate = new Date(
    input.now.getTime() + monthsNeeded * 30 * MS_PER_DAY,
  );

  let deadlineWeeksDelta: number | null = null;
  if (input.deadline) {
    const deadlineDate = new Date(`${input.deadline}T00:00:00`);
    deadlineWeeksDelta = Math.round(
      (deadlineDate.getTime() - completionDate.getTime()) / MS_PER_WEEK,
    );
  }

  return { remaining, completionDate, deadlineWeeksDelta };
}
