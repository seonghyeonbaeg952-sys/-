# History Cue Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public history timeline with the approved Figma Cue Sheet while preserving the existing CMS, route, submenu, header, and footer.

**Architecture:** Keep `getPublicAboutData()` and `HistoryRow` unchanged. Add a pure view-model module for derived folio/range/year data and accordion state helpers, then render it through one responsive `HistoryCueSheetExperience` component with a dedicated CSS file. `AboutPage` delegates only the history view to the new component.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS, Supabase public data, Node test runner

**Spec:** Figma file `nz8fKU1RqfasYhsIQEIVF5`, frames `347:321`, `347:322`, `347:323`, component set `357:430`

## Global Constraints

- Public history continues to receive only `is_visible = true` rows ordered by `display_order` and then `year`.
- Existing Supabase schema, Admin CRUD fields, authentication, RLS, header, submenu, and footer are not changed.
- Images use `object-fit: contain`; missing images remove the media region.
- Each disclosure header is a native button with at least a 44px target, `aria-expanded`, and `aria-controls`.
- Long month, title, and content values must wrap without fixed-height clipping.
- Motion is disabled under `prefers-reduced-motion: reduce`.
- Do not add production dependencies.
- Preserve unrelated dirty-worktree changes and do not commit.

---

### Task 1: History view model and state helpers

**Files:**
- Create: `src/components/about/historyCueSheetModel.ts`
- Test: `src/components/about/historyCueSheetModel.test.mjs`

**Interfaces:**
- Consumes: `HistoryRow[]` or legacy-compatible records with `id`, `year`, optional `month`, optional `title`, `content` or `description`, optional `image_url`.
- Produces: `buildHistoryCueSheetModel(rows)`, `toggleHistoryRecord(openIds, id)`, and `toggleAllHistoryRecords(openIds, ids)`.

- [ ] **Step 1: Write the failing tests**

Test that CMS order is preserved, `F01` numbering is derived, empty titles become `${year}년 활동 기록`, unique years/range/hero image are derived, and toggles remain independent.

- [ ] **Step 2: Verify RED**

Run: `node --test src/components/about/historyCueSheetModel.test.mjs`

Expected: FAIL because `historyCueSheetModel.ts` does not exist.

- [ ] **Step 3: Implement the minimal typed model**

Normalize `content ?? description ?? ''`, stringify years safely, preserve input order, use a `Set<string>` for open IDs, and return new sets without mutating inputs.

- [ ] **Step 4: Verify GREEN**

Run: `node --test src/components/about/historyCueSheetModel.test.mjs`

Expected: PASS.

### Task 2: Accessible responsive Cue Sheet component

**Files:**
- Create: `src/components/about/HistoryCueSheetExperience.tsx`
- Create: `src/styles/history-cue-sheet.css`
- Test: `src/components/about/HistoryCueSheetExperience.contract.test.mjs`

**Interfaces:**
- Consumes: `{ history: HistoryRow[]; shouldUseLegacyFallback: boolean; compact?: boolean }`.
- Produces: full dedicated history experience or compact section version, both using the same model.

- [ ] **Step 1: Write the failing contract test**

Assert the component imports the model and `OptimizedImage`, renders native buttons with `aria-expanded`/`aria-controls`, supports expand-all, and the CSS contains 390/768/1200 breakpoints, `min-height: 44px`, `object-fit: contain`, long-copy wrapping, and reduced-motion handling.

- [ ] **Step 2: Verify RED**

Run: `node --test src/components/about/HistoryCueSheetExperience.contract.test.mjs`

Expected: FAIL because the component and stylesheet do not exist.

- [ ] **Step 3: Implement the component and styles**

Render the Figma hero, derived year index, continuous ruled record list, independent disclosures, optional image, living-archive close, and an `EmptyState`. Reuse `/images/about/smyc-europe-2018.webp` only as the safe hero fallback.

- [ ] **Step 4: Verify GREEN**

Run both new tests and expect PASS.

### Task 3: Route integration without CMS changes

**Files:**
- Modify: `src/pages/public/AboutPage.tsx`
- Modify: `package.json`
- Test: `src/components/about/HistoryCueSheetExperience.contract.test.mjs`

**Interfaces:**
- Consumes: existing `history` and `aboutData.error` from `useAboutData()`.
- Produces: the full experience on `?section=history`; the compact experience when `?section=all` includes history.

- [ ] **Step 1: Extend the failing route contract**

Assert `AboutPage` imports and renders `HistoryCueSheetExperience`, skips the generic `PageHero` on the dedicated history route, and removes the old `HistoryList` card implementation.

- [ ] **Step 2: Verify RED**

Run the contract test and expect the missing import/render assertions to fail.

- [ ] **Step 3: Apply the minimal route change**

Add `shouldShowDedicatedHistory`, render the new component with existing data, preserve selector/error behavior, and append the two new tests to the existing `pnpm test` command.

- [ ] **Step 4: Verify GREEN**

Run `pnpm test` and expect all tests to pass.

### Task 4: Build and visual regression verification

**Files:**
- No production-file changes unless a failing check exposes a scoped defect.

**Interfaces:**
- Consumes: running Vite app at `http://127.0.0.1:5175/about?section=history`.
- Produces: verified desktop/tablet/mobile implementation.

- [ ] **Step 1: Run static verification**

Run `pnpm lint`, `pnpm test`, and `pnpm build`.

- [ ] **Step 2: Verify the rendered route**

Check 390px, 768px, and 1440px for horizontal overflow, clipped text, submenu overlap, image containment, independent accordion controls, expand-all/collapse-all, empty image rows, keyboard focus, and reduced motion.

- [ ] **Step 3: Compare against Figma**

Compare the implementation with Figma frames `347:321`, `347:322`, and `347:323`; correct only measurable spacing, typography, color, and responsive discrepancies.

