"use client";

import { SerwistProvider } from "@serwist/next/react";
import { useEffect, useState } from "react";
import { ensureSeeded } from "@/lib/db";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void ensureSeeded().then(() => setReady(true));
  }, []);

  return (
    <SerwistProvider swUrl="/sw.js">
      {ready ? (
        children
      ) : (
        <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4">
          <p className="text-neutral-500">Loading…</p>
        </main>
      )}
    </SerwistProvider>
  );
}
