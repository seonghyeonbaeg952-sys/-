# CMS Character Editor and Popup Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make copy editing approachable: choose one phrase, select individual characters, change font/size, preview, save draft, then publish. Prevent invalid popup date ranges without weakening database checks.

**Architecture:** Keep ordinary text and HTML attributes as strings. Store optional, validated text-range annotations alongside the existing document and render React spans only for an explicitly styled visible-text leaf. No DOM text matching, HTML storage, public default redesign, or automatic publication.

**Tech Stack:** Existing React 19, TypeScript, Vite, Supabase JSONB/CAS, node:test; no new production dependency.

**Spec:** User requests dated 2026-09-17: intuitive PPT-like text editing, per-character font and size, popup date error investigation and matching CMS design. Existing constraints: Figma first, ten self-reviews; public default design unchanged; draft and publish separate.

## Global Constraints

- Public website default DOM, text, fonts, layout and motion remain unchanged.
- Font choices are the existing six allowlisted fonts; selected sizes are 10–120px.
- HTML, arbitrary CSS and URL execution are never accepted as text formatting.
- Copy text and range annotations participate in validation, conflict handling, undo/reset, preview, save, publication and history.
- Private records and actual public content are not test fixtures; no test submissions to production.
- Scrollbar and English sample remain separate later work requiring user approval.

### Task 1: Figma and interaction specification

**Files:** `docs/cms-character-editor-review.md`; existing CMS Figma page `609:1253`.

- [ ] Reuse existing CMS controls, typography and colors. Create desktop phrase editor, selected-range state, narrow-screen state and popup scheduling state.
- [ ] Review ten axes with evidence: hierarchy, terminology, selection scope, keyboard, touch, wrapping, error recovery, save/publish safety, default-design invariance and component consistency.
- [ ] The editor has a search/list, one focused phrase, clear selected-range status, font and numeric size controls, clear formatting, undo/redo and live formatted sample. Plain text fields such as URLs/alt labels do not offer misleading formatting controls.

### Task 2: Structured formatting model

**Files:** `src/types/siteEditor.ts`, `src/lib/siteEditorTextStyles.ts`, `src/lib/siteEditorModel.ts`, `src/components/admin/site-editor/editorSessionModel.ts`, tests and one generated Supabase migration.

**Interfaces:** `EditorTextStyle={fontFamily?:EditorFont;fontSize?:number}`, `EditorTextRun={start:number;end:number;style:EditorTextStyle}`, `EditorStyledCopy={text:string;runs:EditorTextRun[]}`; optional `textStyles[scope][key]` on version 1 documents.

- [ ] RED: test partial overlap (font on 0–3 then size on 1–2), clear formatting, emoji/grapheme boundaries, text insertion/deletion rebasing, stale text, malformed data and conflict preservation.
- [ ] GREEN: implement pure range functions; validate at client/server boundaries; preserve old four-key documents and exact-text fallback.
- [ ] Test server changes in a rollback-only transaction before applying additive validator change. Never alter existing drafts or published rows.

### Task 3: Focused copy editor and explicit public rendering

**Files:** `EditorCopyPanel.tsx`, new `EditorTextSelection.tsx`, `SiteCopy.tsx`, explicit visible-copy consumers, scoped `admin-site-editor.css`, test files.

**Interfaces:** selected phrase editor emits `(text,runs)` as one update. Existing `copy()` stays string-only. Visible leaves opt into a `SiteCopy`/explicit rich-copy renderer.

- [ ] RED: test selecting one phrase, search stability, preserved selection while using toolbar, undo/redo and no implicit all-text style action.
- [ ] GREEN: native text selection with safe controlled text input and formatted selection surface; no deprecated execCommand or arbitrary contentEditable HTML.
- [ ] Add explicit rendering only at known leaves; mark unsupported attribute/model fields as text-only, not pretend formatted output is connected.
- [ ] Verify no-override SSR output equals baseline and selected style survives draft/preview/publication/history payload round trips.

### Task 4: Popup dates and CMS consistency

**Files:** `AdminPopupNoticesPage.tsx`, popup model/tests, narrow optional validation hook in `AdminRecordForm`/`AdminCrudListPage`, known constraint translation in `cms.ts`.

- [ ] RED: reversed dates must stop submission, equal dates and either blank boundary accepted, corrected date clears relevant error.
- [ ] GREEN: compare strict calendar DATE values without timezone conversion; field-level Korean error and focus; retain DB CHECK.
- [ ] Match existing quiet CMS styling; clarify scheduling/publication rather than change public popup appearance without evidence.

### Task 5: Verification and handoff

- [ ] Run targeted tests, `pnpm test`, `pnpm lint`, `pnpm build`.
- [ ] Browser-check native selection, font/size changes, long text, clear/undo, keyboard, mobile/tablet/desktop widths, popup invalid/valid dates using isolated data.
- [ ] Check preview origin/nonce and public default contracts, document real coverage and limitations, update operator instructions.
- [ ] Commit only verified relevant changes, review staged diff for secrets, push authorized branch. Never claim unrun checks.
