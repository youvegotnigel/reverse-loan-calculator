# Reverse Loan Calculator V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved V1 of the Reverse Loan Calculator (spec: `docs/superpowers/specs/2026-07-12-reverse-loan-calculator-design.md`) — a static LKR reverse loan calculator deployed to GitHub Pages.

**Architecture:** Pure-function calculation engine (`src/engine/`, zero DOM, Vitest-tested) feeding a single state → recompute → render pipeline (`src/state.ts`) that drives hand-written DOM modules (`src/ui/`). Vite vanilla-ts, no framework.

**Tech Stack:** Vite 6, TypeScript strict, Vitest, ESLint flat + Prettier, @fontsource (Fraunces, Inter), GitHub Actions + actions/deploy-pages.

## Global Constraints

- Node 22 (`.nvmrc`), `vite.config.ts` `base: '/reverse-loan-calculator/'`.
- No network calls at runtime: fonts self-hosted, no analytics, no CDN.
- All monetary values rendered with `Intl.NumberFormat('en-LK')`-based "Rs." formatting and tabular numerals.
- WCAG AA contrast; visible `:focus-visible` rings; `prefers-reduced-motion` disables count-up/transitions; results region `aria-live="polite"`.
- Palette/typography tokens exactly as in spec §4.
- Zero ESLint errors; Prettier-formatted; `npm run lint && npm test && npm run build` green before every commit claim.
- Conventional commits; commit at the end of every task.

---

### Task 0: Scaffold and tooling

**Files:** Create Vite vanilla-ts project in repo root (`index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `src/main.ts`), plus `eslint.config.js`, `.prettierrc`, `.nvmrc` (`22`), `.gitignore`, `.github/` later.

- [ ] `npm create vite@latest . -- --template vanilla-ts` (into existing dir), remove demo counter files.
- [ ] Add dev deps: `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `prettier`; deps: `@fontsource-variable/fraunces`, `@fontsource-variable/inter`.
- [ ] `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- [ ] `vite.config.ts` with `base: '/reverse-loan-calculator/'`; `package.json` scripts: `dev`, `build` (`tsc && vite build`), `preview`, `test` (`vitest run`), `lint` (eslint + prettier check), `format`.
- [ ] Smoke: `npm run lint && npm test && npm run build` all pass (0 tests OK at this point via `--passWithNoTests`).
- [ ] Commit: `chore: scaffold vite vanilla-ts with strict TS, eslint flat, prettier, vitest`

### Task 1: Engine — loan math (`src/engine/loan.ts`)

**Files:** Create `src/engine/loan.ts`, `src/engine/loan.test.ts`.

**Produces (contract for later tasks):**

```ts
export interface LoanInputs {
  monthlySalary: number; dsrPercent: number; existingCommitments: number;
  years: number; months: number; annualRatePercent: number;
}
export interface LoanResult {
  monthlyInstallment: number;   // capacity after commitments (M)
  maxLoan: number;              // P
  totalPayments: number;        // n
  totalRepaid: number;          // M*n
  totalInterest: number;        // totalRepaid - P
  principalSharePercent: number; interestSharePercent: number;
}
export function totalMonths(years: number, months: number): number;
export function monthlyCapacity(salary: number, dsrPercent: number, commitments: number): number; // floor 0
export function maxPrincipal(installment: number, monthlyRate: number, n: number): number; // 0% => M*n
export function computeLoan(inputs: LoanInputs): LoanResult;
export function stressTest(inputs: LoanInputs, rateBumpPercent: number): { maxLoan: number; drop: number };
```

- [ ] TDD, key test values: `maxPrincipal(10000, 0.01, 12)` ≈ `112550.77` (±0.5); `maxPrincipal(10000, 0, 12)` = `120000`; round-trip: forward installment `P·i/(1−(1+i)^−n)` returns M (±1e-6); `monthlyCapacity(150000, 40, 20000)` = `40000`, never negative; `n=0` → maxLoan 0; shares sum to 100.
- [ ] Commit: `feat(engine): reverse annuity loan math with 0% edge case`

### Task 2: Engine — amortization (`src/engine/schedule.ts`)

**Produces:**

```ts
export interface YearRow { year: number; principalPaid: number; interestPaid: number; closingBalance: number; }
export interface Schedule { years: YearRow[]; monthlyBalances: number[]; } // balances length n+1: [P, ..., 0]
export function buildSchedule(principal: number, installment: number, monthlyRate: number, n: number): Schedule;
```

- [ ] TDD: final balance exactly 0 (last payment absorbs drift); Σ yearly principal ≈ P (±1); Σ yearly interest ≈ totalInterest (±1); partial final year (n=18 → 2 rows, second covers 6 months); 0% rate schedule linear; `monthlyBalances[0] === principal`.
- [ ] Commit: `feat(engine): amortization schedule with yearly rollup`

### Task 3: Engine — formatting (`src/engine/format.ts`)

**Produces:**

```ts
export function formatLKR(amount: number): string;      // "Rs. 8,842,190" (rounded, en-LK grouping)
export function formatPercent(value: number, dp?: number): string; // "11.5%"
export function amountInWords(amount: number): string;
// >= 1_000_000: "about 8.8 million rupees"; 100_000..<1_000_000: "about 5.5 lakhs";
// 1_000..<100_000: "about 85,000 rupees"; < 1000: "less than a thousand rupees"
```

- [ ] TDD: the four branches above, rounding to 1 decimal ("about 12 million rupees" not "12.0"), 0 → empty-safe string.
- [ ] Commit: `feat(engine): LKR formatting and Sri Lankan plain-words amounts`

### Task 4: Engine — validation (`src/engine/validate.ts`)

**Produces:**

```ts
export const LIMITS: Record<'salary'|'dsr'|'commitments'|'years'|'months'|'rate', { min: number; max: number }>;
// salary 0..10_000_000; dsr 1..100; commitments 0..10_000_000; years 0..40; months 0..11; rate 0..36
export const DEFAULT_INPUTS: LoanInputs; // salary 150000, dsr 40, commitments 0, years 10, months 0, rate 11.5
export function clampField(field: keyof typeof LIMITS, value: number): number; // also NaN → min
export type InputStatus = 'ok' | 'no-salary' | 'no-capacity' | 'no-term';
export function statusFor(inputs: LoanInputs): InputStatus;
```

- [ ] TDD: clamping incl. NaN; `no-salary` when salary ≤ 0; `no-capacity` when commitments ≥ salary×dsr%; `no-term` when years+months = 0; precedence no-salary > no-term > no-capacity.
- [ ] Commit: `feat(engine): input limits, clamping, and status detection`

### Task 5: Engine — URL state (`src/engine/url-state.ts`)

**Produces:**

```ts
export function encodeState(inputs: LoanInputs): string; // "s=150000&d=40&c=0&y=10&m=0&r=11.5"
export function decodeState(query: string): LoanInputs;  // missing/invalid params → DEFAULT_INPUTS field, clamped
```

- [ ] TDD: round-trip identity; garbage/partial query falls back per-field; values clamped through `clampField`.
- [ ] Commit: `feat(engine): shareable URL state codec`

### Task 6: Static shell — HTML, tokens, base styles, guilloche

**Files:** Rewrite `index.html`; create `src/styles/tokens.css`, `base.css`, `components.css`, `print.css`; `src/ui/guilloche.ts`; `public/favicon.svg`.

**DOM contract (IDs used by later tasks):** inputs `#salary #dsr-range #dsr-number #commitments #years #months #rate-range #rate-number`, chips `.dsr-chip[data-dsr]`, theme `#theme-toggle`, results `#note-plate #max-loan #in-words #empty-state #installment #total-repaid #total-interest #payments-count #capacity-line #split-bar #split-principal-pct #split-interest-pct #stress-line #copy-link #copy-summary`, `#sticky-result`, chart `#balance-chart`, table `#schedule-body` inside `<details id="schedule">`.

- [ ] Semantic structure: `header` (brand + theme toggle) / `main` with `form` (inputs card) and `output aria-live="polite"` (Note plate + stats + chart + schedule) / `footer` (disclaimer, "nothing leaves your browser").
- [ ] `tokens.css`: spec §4 palette as CSS custom properties under `:root`, `@media (prefers-color-scheme: dark)`, and `[data-theme="light"|"dark"]` overrides; type scale; spacing scale; radius; shadows.
- [ ] `base.css`: reset, fonts (`@fontsource-variable` imports in `main.ts`), `font-feature-settings: "tnum"` utility class `.num`, `:focus-visible` ring, reduced-motion global override.
- [ ] `guilloche.ts`: `renderGuilloche(target: SVGElement, opts?)` — 24 rotated ellipses, stroke `saffron-500` at 6–8% opacity, deterministic.
- [ ] Static page renders with placeholder values via `npm run dev`; keyboard-tab through all controls shows focus rings.
- [ ] Commit: `feat(ui): semantic shell, design tokens, banknote hero plate, guilloche`

### Task 7: State pipeline, input bindings, theme

**Files:** Create `src/state.ts`, `src/ui/inputs.ts`, `src/ui/theme.ts`; wire in `src/main.ts`.

**Produces:**

```ts
// state.ts
export type Listener = (inputs: LoanInputs, status: InputStatus) => void;
export function initState(initial: LoanInputs): { get(): LoanInputs; set(patch: Partial<LoanInputs>): void; subscribe(fn: Listener): void };
// inputs.ts
export function bindInputs(store: Store): void; // slider⇄number two-way sync, chips set dsr, clamp on blur
// theme.ts
export function initTheme(): void; // manual toggle persists 'theme' in localStorage, else follows prefers-color-scheme
```

- [ ] Slider and number stay in sync both directions without feedback loops; typing partial values doesn't fight the user (clamp on change/blur, not on every keystroke).
- [ ] Every `set()` triggers listeners synchronously (live recalc, no submit).
- [ ] URL: on init read `location.search` via `decodeState`; on change `history.replaceState` with `encodeState` (debounced ~150 ms).
- [ ] Commit: `feat(ui): live state pipeline, synced sliders, theme toggle, URL state`

### Task 8: Results rendering — the Note

**Files:** Create `src/ui/results.ts` (+ count-up helper); extend `components.css`.

- [ ] `renderResults(inputs, status)`: status ≠ ok → empty-state copy per status (`no-salary`: "Enter your take-home salary…", `no-capacity`: commitments message, `no-term`: term message), figure hidden, plate dimmed. status ok → figure, words line, installment/total/interest/payments, capacity line (when commitments > 0), split bar widths + percents, stress line ("If rates rise 2%… drops to X", hidden at rate ≥ 34).
- [ ] Count-up: ~300 ms `requestAnimationFrame` ease-out tween on `#max-loan` (tabular, no layout shift); skipped when `matchMedia('(prefers-reduced-motion: reduce)')`.
- [ ] Sticky mobile bar: IntersectionObserver on the Note toggles `#sticky-result` visibility.
- [ ] Commit: `feat(ui): hero Note rendering, count-up, split bar, stress test, empty states`

### Task 9: Balance chart and schedule table

**Files:** Create `src/ui/chart.ts`, `src/ui/schedule-table.ts`.

- [ ] **Read the `dataviz` skill before writing chart code.** `renderChart(svg, monthlyBalances)`: inline SVG area chart (teal stroke, translucent fill), x = years, y = balance, min axis labels, `role="img"` + `aria-label` summary.
- [ ] `renderScheduleTable(tbody, years: YearRow[])`: rows Year | Principal paid | Interest paid | Remaining balance, `.num` tabular cells, `<details>` collapsible with row count in summary.
- [ ] Commit: `feat(ui): balance decay chart and yearly amortization table`

### Task 10: Sharing and print

**Files:** Create `src/ui/share.ts`; finish `src/styles/print.css`.

- [ ] Copy link: writes `location.href` (already carrying state) to clipboard, button flashes "Copied ✓".
- [ ] Copy summary: plain-text block (inputs + max loan + installment + totals) via `navigator.clipboard.writeText`.
- [ ] `print.css`: hide controls/chrome, one A4 page with figure, inputs recap, yearly table.
- [ ] Commit: `feat(ui): copy link, copy text summary, print stylesheet`

### Task 11: CI/CD

**Files:** Create `.github/workflows/deploy.yml`.

- [ ] Workflow on push to `main`: checkout → setup-node 22 + npm cache → `npm ci` → lint → test → build → `actions/upload-pages-artifact` (dist) → `actions/deploy-pages` (needs `pages: write`, `id-token: write`, environment `github-pages`).
- [ ] Commit: `ci: lint, test, build, deploy to GitHub Pages`

### Task 12: README

- [ ] `README.md`: hero description, screenshots section (placeholder paths `docs/screenshots/*.png` + real captures if possible), features, formula explanation with the reverse annuity derivation, local dev (`nvm use && npm i && npm run dev`), test/lint commands, deployment steps (enable Pages → GitHub Actions source), privacy note.
- [ ] Commit: `docs: README with features, formula, dev and deploy guide`

### Task 13: Final verification

- [ ] `npm run lint && npm test && npm run build` — all green, zero warnings tolerated for lint.
- [ ] `npm run preview` and fetch `http://localhost:4173/reverse-loan-calculator/` — page serves with correct base path, assets load.
- [ ] Use the `verify` skill: drive the real app (dev or preview) — change salary, confirm live results, toggle theme, check empty state, print preview sanity.
- [ ] Manual checks: keyboard-only pass, reduced-motion emulation, 360 px viewport, dark mode contrast.
- [ ] Commit any fixes; final state pushed-ready.
