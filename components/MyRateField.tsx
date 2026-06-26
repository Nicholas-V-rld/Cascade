"use client";

import { useEffect, useState } from "react";
import { updateSettings } from "@/lib/db";

interface MyRateFieldProps {
  userRate: number | null | undefined;
}

export function MyRateField({ userRate }: MyRateFieldProps) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInput(userRate != null ? String(userRate) : "");
  }, [userRate]);

  async function handleSave() {
    const trimmed = input.trim();
    if (trimmed === "") {
      setSaving(true);
      await updateSettings({ userRate: null });
      setSaving(false);
      setSaved(true);
      return;
    }
    const val = Number(trimmed);
    if (!Number.isFinite(val) || val <= 0) return;

    setSaving(true);
    await updateSettings({ userRate: val });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-2">
      <label htmlFor="my-rate" className="block text-sm font-medium text-neutral-700">
        My rate
      </label>
      <p className="text-xs text-neutral-500">
        ₦ per $1 — the rate you actually get when you cash out.
      </p>
      <div className="flex gap-2">
        <input
          id="my-rate"
          type="text"
          inputMode="decimal"
          placeholder="1750"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSaved(false);
          }}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
      {saved && (
        <p className="text-xs text-teal-600">Rate saved.</p>
      )}
    </div>
  );
}
