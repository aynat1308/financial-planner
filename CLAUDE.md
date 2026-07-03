# Financial Planner — Project Context

Single-page **Financial Independence (FIRE) planner** for an Israeli financial
context (assets like *Hishtalmut*/*Gemel*, allowances like *Pension*/*Kitzbat
Zikna*, all amounts in ₪). Projects wealth over time, models a withdrawal
strategy, computes a Financial Independence year, and exports to PDF/CSV.

- **Repo:** github.com/aynat1308/financial-planner (`main` is the only branch)
- **Live:** https://aynat1308.github.io/financial-planner/ (GitHub Pages)
- **Local:** `~/financial_planner`

---

## Architecture (read this first)

- **`index.html` is the entire live app.** All application code is inlined in a
  single `<script type="text/babel">` block and transpiled **in the browser** by
  `@babel/standalone`. There is **no build step** and **no separate JS files**.
- Loaded from CDNs: React 18 (UMD), Recharts 2.5, jsPDF, xlsx, html2canvas,
  Tailwind (`cdn.tailwindcss.com`), and Babel standalone.
- One giant component, `FinancialPlanner` (~3,600 lines), holds **26 `useState`**
  vars + handlers + derived memos and renders everything.
- **Data model** (all editable, persisted to `localStorage` key
  `financial-planner-data`): `initialParams`, `assets`, `salaries`,
  `allowances`, `loans`, `mortgages`, `baseExpenses`, `yearlyExpenseOverrides`,
  `yearlyLaborIncomeOverrides`, `manualFIYear`, `calculateFI`, `timeHorizon`,
  `targetFinalBalance`, `currentAge`. Defaults seed 3 assets at ₪100,000 each.
- **Views** (`DashboardView`, `IncomesView`, `AssetsView`, `ExpensesView`,
  `DebtsView`, `ParametersView`, `ExportPopup`, `ParamsForm`) are rendered as JSX
  **elements** but defined **inside** `FinancialPlanner`, so they remount on
  every parent render. **Leaf** components (`SalaryRow`, `AllowanceRow`,
  `LoanRow`, `MortgageRow`, `AssetRow`, `DashInlineInput`, `MonthlyAmountInput`,
  `ChangeRateInput`, `AssetDetailChart`, `LaborIncomeEditPopup`,
  `ExpenseEditPopup`) are prop-driven and use a local-state / commit-on-blur
  pattern (with `useEffect` resyncs) that currently masks the remount problem.
- An **`ErrorBoundary`** wraps the app: any render crash shows a recovery screen
  with a "Reset saved data & reload" button instead of a blank page.

---

## Critical gotchas (do not regress these)

1. **Babel must stay pinned.** `index.html` loads
   `@babel/standalone@7.26.4`. Do **not** revert to the unpinned
   `.../babel.min.js`: unpkg "latest" is Babel 8, whose automatic JSX runtime
   emits bare `import`s that a non-module script can't run → the app
   white-screens on cold load.
2. **`.nojekyll` must exist at repo root.** GitHub Pages runs Jekyll by default,
   and the JSX inline styles (`style={{ ... }}`) collide with Liquid `{{ }}`,
   which broke the Pages build (it was stuck from 2026-04-13). `.nojekyll`
   disables Jekyll so Pages serves files as-is. Deleting it re-breaks deploys.
3. **`yearlyExpenseOverrides` canonical shape is an ARRAY:**
   `{ [year]: [{ categoryId:Number, monthlyAmount:Number }] }`. Every reader
   calls `.find` on it. `normalizeStoredData()` converts legacy OBJECT-shaped
   data (`{ [year]: { [categoryId]: amount } }`) on load — that mismatch used to
   white-screen the app for anyone with old saved data. Keep writers on the
   array shape.

---

## How to run

- **Serve it (most reliable):** `python3 -m http.server 8000` in the repo, then
  open `http://localhost:8000/index.html`. Opening via `file://` also works.
- After any change goes live, **hard-refresh** (Cmd+Shift+R) to beat the cache.

## How to test

Playwright + Chromium drive `index.html` via the Python static server. Node was
installed via **nvm** (this machine had none; only Python 3.7). Node/npm are
only on PATH after sourcing nvm:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npx playwright test
```

Tests live in `tests/` and assert **behavioral invariants** (boot, view
switching, incomes CRUD/total, assets + localStorage persistence, a recorded
focus baseline, and the object-shaped-data regression). The tag
`pre-refactor-baseline` marks the green baseline. Tests start from empty
`localStorage`, so seed data explicitly to reproduce data-dependent bugs.

## How to deploy

Push to `main` → GitHub Pages (classic "deploy from branch", `main` root)
rebuilds in ~1 min. Verify with:
`curl -s "https://aynat1308.github.io/financial-planner/index.html?cb=$(date +%s)" | grep babel/standalone`
(should show `@babel/standalone@7.26.4`). `gh` CLI is **not installed** here
despite environment notes — use the git remote / REST API via `curl`.

---

## Working agreements (this project)

- **Behavior-preserving by default.** Do not change dashboard behavior/appearance
  or calculation logic without explicit approval. Global workflow rules in
  `~/CLAUDE.md` also apply (plan first, small focused PRs, explain decisions).
- Work on a branch off `main`, verify tests green, then merge. Commits are
  co-authored; **never commit `docs/`** (local planning artifacts).

## Status & roadmap

- **Done:** fixed the Babel-v8 breakage, the localStorage crash, and the stuck
  Pages deploy; added the Playwright safety net; removed dead code + duplicate
  files.
- **Deferred — Stage 2 refactor** (designed, approved in principle, not started):
  move the 19 components to module scope behind a single `PlannerContext`, staying
  in `index.html` (no build). Value is code-quality/perf, not a visible fix
  (focus loss is already masked). Do it incrementally, one view per step, gated
  by the test suite.
- **Known latent issues:** `deleteExpense` doesn't clean up orphaned per-year
  overrides; the giant single component; the `useEffect` resync hacks.
- **Next phase (user's stated intent):** improve calculation/logic and add
  features — brainstorm + plan each before implementing.
