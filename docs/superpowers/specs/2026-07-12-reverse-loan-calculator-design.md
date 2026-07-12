# Reverse Loan Calculator — Design Spec

**Date:** 2026-07-12 · **Status:** Approved for V1 implementation

A production-quality static website for Sri Lanka (LKR) that works backwards from
salary to borrowing power: the user enters their net monthly salary and how much of
it they can commit to repayment, and the tool calculates the maximum loan a bank
would allow. Hosted on GitHub Pages. No data leaves the browser — no analytics, no
backend, no API calls, no third-party CDNs (fonts self-hosted).

## 1. Scope

### V1 — approved

**Core (from the validated prototype):**

- Inputs: net monthly salary (LKR); % of salary committed to repayment
  (slider ⇄ number, hint: SL banks cap DSR ~40–60% of net income); loan period as
  years + months; annual interest rate, reducing balance (slider ⇄ number, hint:
  AWPLR-linked floating rates).
- Live results on every input change (no submit): **maximum loan amount** as the
  hero figure via the reverse annuity formula `P = M·(1 − (1+i)^−n)/i`
  (M = monthly installment, i = monthly rate, n = payments); 0% edge case
  `P = M·n`. Also: monthly installment, total repaid, total interest, number of
  payments, principal-vs-interest proportional bar with percentages, and a
  plain-words line ("about 8.8 million rupees" / "about 12.5 lakhs") using Sri
  Lankan conventions.
- Amortization: collapsible year-by-year table (principal paid, interest paid,
  remaining balance per year).
- Currency: `Intl.NumberFormat`, "Rs." prefix, tabular numerals everywhere.
- Quality floor: responsive to mobile, visible keyboard focus, reduced-motion
  respected, semantic HTML, WCAG AA contrast, `aria-live` results region.
- Designed empty/invalid state (e.g. salary 0): dimmed hero plate with guidance
  copy, never a broken "Rs. 0".
- Dark mode via `prefers-color-scheme` **plus** manual toggle (localStorage).

**V1 additions (approved from the feature menu):**

| ID | Feature | Design |
|----|---------|--------|
| A | Existing monthly commitments | Input deducted from repayment capacity after DSR; "usable capacity" readout line |
| B | Shareable URL state | Inputs encoded in query string via `history.replaceState`; "Copy link" button on the Note |
| C | Print/PDF summary | `@media print` stylesheet: one clean A4 page (figure, inputs, yearly table) |
| D | Balance decay chart | SVG area chart of remaining balance over the term, above the yearly table |
| I | Rate stress test | Line under results: "If rates rise 2%, your max loan drops to Rs. X" |
| J | DSR preset chips | 40 / 50 / 60% chips (Conservative / Typical / Aggressive) above the commitment slider |
| K | Copy summary as text | Button copying a plain-text summary for WhatsApp/email sharing |

### V2 backlog — deferred, tracked here

| ID | Feature | Design sketch | Effort |
|----|---------|---------------|--------|
| E | Max property price mode (LTV) | Toggle chip "Add a property purchase": down-payment % → max property price alongside max loan | M |
| F | Bank/rate comparison mode | Three rate columns (e.g. 9% / 11.5% / 14%) showing max loan under each | M |
| G | PWA / offline support | Manifest + service worker; app is fully static so nearly free UX-wise | M |
| H | English / Sinhala / Tamil toggle | Header language toggle, JSON string tables, self-hosted Noto Sans Sinhala/Tamil | L |
| L | Scenario compare ("pin this scenario") | Pin current result; compact strip compares pinned vs. current (localStorage only) | M |

Candidate additions for V2+ (unranked): loan-type rate presets (housing / personal /
vehicle, clearly illustrative), lakh/million numeric display toggle, early
settlement / extra-payment explorer.

## 2. Architecture

Vite + vanilla TypeScript (strict). No UI framework — one screen, one state object,
pure-function engine. Vitest for engine tests. ESLint (flat) + Prettier.

**Hard boundary:** `src/engine/` is pure and DOM-free (loan math, schedule,
validation, formatting) and is the only code under unit test. `src/ui/` renders and
binds. `src/state.ts` owns the single input-state → recompute → render pipeline.

```
reverse-loan-calculator/
├── .github/workflows/deploy.yml    # lint → test → build → actions/deploy-pages
├── public/                         # favicon.svg, og assets
├── src/
│   ├── engine/                     # pure, zero-DOM, fully tested (co-located *.test.ts)
│   │   ├── loan.ts                 # reverse annuity, installment, totals, 0% case
│   │   ├── schedule.ts             # monthly amortization + yearly rollup
│   │   ├── validate.ts             # clamping/validation → typed results
│   │   └── format.ts               # Intl LKR "Rs." formatting, plain-words lakhs/millions
│   ├── ui/
│   │   ├── inputs.ts               # slider ⇄ number sync, live binding, preset chips
│   │   ├── results.ts              # Note plate, count-up, stats, split bar, stress line
│   │   ├── chart.ts                # SVG balance-decay area chart
│   │   ├── schedule-table.ts       # collapsible yearly table
│   │   ├── share.ts                # URL state (B), copy link/summary (K)
│   │   ├── theme.ts                # color-scheme + manual toggle
│   │   └── guilloche.ts            # SVG rosette generation
│   ├── styles/                     # tokens.css, base.css, components.css, print.css
│   ├── state.ts
│   └── main.ts
├── index.html                      # semantic: header/main/form/output/footer
├── vite.config.ts                  # base: '/reverse-loan-calculator/'
├── tsconfig.json · eslint.config.js · .prettierrc · .nvmrc (22) · .gitignore
└── README.md                       # screenshots, features, formula, dev + deploy
```

## 3. Formulas

- Monthly capacity: `M = salary × dsr% − existingCommitments` (floor 0).
- Monthly rate: `i = annualRate / 12 / 100`; payments: `n = years×12 + months`.
- Max principal: `i > 0 → P = M·(1 − (1+i)^−n)/i`; `i = 0 → P = M·n`.
- Totals: `totalRepaid = M·n` (from the rounded working installment),
  `totalInterest = totalRepaid − P`.
- Schedule: standard reducing-balance amortization from P at installment M;
  yearly rollup of principal/interest/closing balance; final payment absorbs
  rounding drift so the balance ends at exactly 0.
- Stress test (I): recompute P at `annualRate + 2%`, report the drop.
- Display rounding: whole rupees; engine keeps full precision internally.

## 4. Visual design — "Ceylon Note"

**Palette** (WCAG AA-checked; saffron only on `ceylon-950` or as non-text accent):

| Token | Light | Dark | Role |
|---|---|---|---|
| `ceylon-950` | `#0A2E2C` | same | Hero plate background (both themes) |
| `ceylon-700` | `#155E56` | `#2E8C7F` | Primary interactive (sliders, focus, links) |
| `saffron-500` | `#D99A2B` | `#E5B75C` | Hero figure, slider thumb, key accents only |
| `paper-50` | `#F7F4EE` | `#0D1716` | Page background |
| `surface-0` | `#FFFFFF` | `#14211F` | Cards |
| `ink-900` | `#1C2B29` | `#E9EFEC` | Primary text |
| `ink-500` | `#5B6E6A` | `#93A5A0` | Secondary text, hints |
| `line-200` | `#E3DED2` | `#243230` | Hairlines, table rules |
| `positive-600` / `negative-600` | `#1E7A46` / `#B3382E` | lightened | Principal/interest split, validation |

**Type:** Fraunces (variable, optical sizing) for hero figure + headings; Inter for
UI/body with `"tnum"` on all monetary values. Self-hosted woff2 via `@fontsource`.
Hero ~`clamp(2.5rem, 8vw, 4.5rem)`.

**Signature element — "the Note":** hero result as a security-printed banknote
plate: `ceylon-950` panel, fine double-rule frame, inline-SVG guilloche rosette
(layered rotated ellipses, low-opacity strokes) bleeding off one corner,
microprint-style rule under the figure, amount in saffron Fraunces. Value changes
animate as a ~300 ms tabular count-up; instant under reduced motion.

**Layout:** desktop two-column (inputs card left, Note + results right); mobile
single column with a slim sticky result bar (Rs. figure only) once the Note scrolls
out of view. Results region `aria-live="polite"`.

## 5. Testing

Vitest on the engine only: annuity math against known values, 0% rate edge case,
rounding behaviour, schedule generation (yearly sums reconcile with totals; final
balance exactly 0), validation/clamping, LKR + plain-words formatting (millions and
lakhs branches), stress-test delta, URL state encode/decode round-trip.

## 6. Deployment

GitHub Actions on push to `main`: install (Node 22) → lint → test → build → upload
artifact → `actions/deploy-pages`. Vite `base: '/reverse-loan-calculator/'`.
Production build verified locally with `vite preview` before finishing.
