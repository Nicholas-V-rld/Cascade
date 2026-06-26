# Cascade — project context for Claude

## What this is
A personal-finance PWA. Core mechanic: a priority **waterfall** that allocates each
income inflow into buckets (in priority order) before any money is "free to spend."
It is a GUARDRAIL, not a tracker. The win is seeing what's actually yours BEFORE you spend.

## Architecture
- Next.js 15 (App Router) + TypeScript (strict) + Tailwind.
- Client-first, single-user, **no auth, no backend**. All data in IndexedDB via Dexie.
- PWA via Serwist; offline-capable; installable.
- Money is stored as integer **minor units (kobo)**. Never use floats for money.
  Format to ₦ only at the display boundary (`lib/money.ts`).

## The engine (most important file)
`lib/waterfall.ts` — `runWaterfall(inflow, buckets)` is a PURE function. No I/O, fully
tested. Invariant: sum(allocations) + free === inflow, always. Don't break this.

## Domain glossary
- Bucket: a named savings/goal pot with a priority and an allocation rule.
- Rule `fill`: take up to (target − balance). Rule `percent`: take rate% of what reaches it.
- Waterfall: run buckets by ascending priority; remainder cascades down; leftover = free.
- Free: the money that is genuinely spendable after buckets are served.
- Spendable: **derived**, never stored — `Σ(inflow.result.free) − Σ(spend.amountMinor)`.
- userRate: NGN per 1 USD in `settings.userRate`; sole source for USD↔NGN conversion.
- Spend-check: a single spendable envelope guardrail, not categorized expense tracking.

## v1 scope discipline
Build ONLY: buckets, "money came in" → allocation, Move Fund progress + runway, inflow
history, spend-check guardrail, USD↔NGN converter (your rate), CSV export, PWA.
NOT in v1: categorized spend tracking, charts, investment picker, sync, login.
If tempted to add one of those, leave a `// v2:` comment instead.

## Conventions
- Strict TS, no `any`. Prefer pure functions in `lib/`, side effects at the edges.
- Components are presentational; data access goes through `lib/db.ts` helpers.
- Keep UI calm and flat. Primary color teal #0D9488. Tagline: "allocate before you spend."
