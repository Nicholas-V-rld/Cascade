"use client";

import { useState } from "react";
import type { AllocationRule, Bucket } from "@/lib/types";
import { fromMinor, parseToMinor } from "@/lib/money";
import {
  saveBuckets,
  updateSettings,
} from "@/lib/db";

interface BucketEditorProps {
  initialBuckets: Bucket[];
  onSaved: () => void;
}

function ruleLabel(rule: AllocationRule): string {
  if (rule.kind === "fill") return "Fill to target";
  return `${Math.round(rule.rate * 100)}% of remainder`;
}

export function BucketEditor({ initialBuckets, onSaved }: BucketEditorProps) {
  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets);
  const [debtEnabled, setDebtEnabled] = useState(
    initialBuckets.some((b) => b.name === "Debt"),
  );
  const [saving, setSaving] = useState(false);

  function moveBucket(index: number, direction: -1 | 1) {
    const next = [...buckets];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBuckets(next.map((b, i) => ({ ...b, priority: i })));
  }

  function updateBucket(id: string, patch: Partial<Bucket>) {
    setBuckets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function updateFillTarget(id: string, majorStr: string) {
    if (majorStr.trim() === "") {
      setBuckets((prev) =>
        prev.map((b) =>
          b.id === id && b.rule.kind === "fill"
            ? { ...b, rule: { kind: "fill", target: 0 } }
            : b,
        ),
      );
      return;
    }
    const minor = parseToMinor(majorStr);
    if (minor === null) return;
    setBuckets((prev) =>
      prev.map((b) =>
        b.id === id && b.rule.kind === "fill"
          ? { ...b, rule: { kind: "fill", target: minor } }
          : b,
      ),
    );
  }

  function updatePercentRate(id: string, percentStr: string) {
    const pct = Number(percentStr);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    setBuckets((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, rule: { kind: "percent", rate: pct / 100 } }
          : b,
      ),
    );
  }

  function toggleRuleKind(id: string) {
    setBuckets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (b.rule.kind === "fill") {
          return { ...b, rule: { kind: "percent", rate: 0.2 } };
        }
        return { ...b, rule: { kind: "fill", target: b.balance } };
      }),
    );
  }

  function removeBucket(id: string) {
    const bucket = buckets.find((b) => b.id === id);
    if (bucket?.name === "Debt") setDebtEnabled(false);
    setBuckets((prev) =>
      prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, priority: i })),
    );
  }

  function addBucket() {
    const bucket: Bucket = {
      id: crypto.randomUUID(),
      name: "New bucket",
      priority: buckets.length,
      balance: 0,
      rule: { kind: "fill", target: 0 },
    };
    setBuckets((prev) => [...prev, bucket]);
  }

  async function handleDebtToggle(checked: boolean) {
    setDebtEnabled(checked);
    if (checked) {
      const reindexed = buckets.map((b) => ({ ...b, priority: b.priority + 1 }));
      const debt: Bucket = {
        id: crypto.randomUUID(),
        name: "Debt",
        priority: 0,
        balance: 0,
        rule: { kind: "fill", target: 0 },
      };
      setBuckets([debt, ...reindexed]);
    } else {
      setBuckets((prev) =>
        prev
          .filter((b) => b.name !== "Debt")
          .map((b, i) => ({ ...b, priority: i })),
      );
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBuckets(buckets.map((b, i) => ({ ...b, priority: i })));
      const hasTargets = buckets.some(
        (b) => b.rule.kind === "fill" && b.rule.target > 0,
      );
      if (hasTargets) {
        await updateSettings({ onboarded: true });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
        <input
          type="checkbox"
          checked={debtEnabled}
          onChange={(e) => handleDebtToggle(e.target.checked)}
          className="rounded border-neutral-300 text-teal-600"
        />
        <span>
          <span className="font-medium text-neutral-800">Debt bucket</span>
          <span className="block text-neutral-500">
            Always highest priority when enabled
          </span>
        </span>
      </label>

      <ul className="space-y-4">
        {buckets.map((bucket, index) => (
          <li
            key={bucket.id}
            className="rounded-xl border border-neutral-200 p-4"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveBucket(index, -1)}
                  disabled={index === 0}
                  className="rounded px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBucket(index, 1)}
                  disabled={index === buckets.length - 1}
                  className="rounded px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={bucket.name}
                  onChange={(e) => updateBucket(bucket.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
                />

                <p className="text-xs text-neutral-500">
                  Balance: ₦{fromMinor(bucket.balance).toLocaleString("en-NG")}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRuleKind(bucket.id)}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
                  >
                    {ruleLabel(bucket.rule)}
                  </button>

                  {bucket.rule.kind === "fill" ? (
                    <>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Target (NGN)"
                        value={
                          bucket.rule.target > 0
                            ? String(fromMinor(bucket.rule.target))
                            : ""
                        }
                        onChange={(e) => updateFillTarget(bucket.id, e.target.value)}
                        className="w-32 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      />
                      {bucket.name === "Move Fund" && (
                        <input
                          type="date"
                          value={bucket.deadline ?? ""}
                          onChange={(e) =>
                            updateBucket(bucket.id, {
                              deadline: e.target.value || undefined,
                            })
                          }
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-700"
                          aria-label="Move Fund deadline"
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(bucket.rule.rate * 100)}
                      onChange={(e) => updatePercentRate(bucket.id, e.target.value)}
                      className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                    />
                  )}
                </div>

                {buckets.length > 1 && bucket.name !== "Move Fund" && (
                  <button
                    type="button"
                    onClick={() => removeBucket(bucket.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addBucket}
        className="text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        + Add bucket
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save buckets"}
      </button>
    </div>
  );
}
