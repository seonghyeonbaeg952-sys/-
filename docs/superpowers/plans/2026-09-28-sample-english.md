# Sample English implementation plan

> **For agentic workers:** Follow this plan task-by-task with implementation and review checkpoints. Translation catalogues may be prepared independently; integration and final verification belong to the primary worker.

**Goal:** Add a working Korean/English switch to `/sample/` and its visitor pages, preserving the current objects, imagery, animation and source-site behaviour.

**Architecture:** A sample-only React provider owns locale and reviewed translation resources. The existing copy and public-data consumers receive translated display strings without modifying source records. URL query parameters carry language while retaining the current route, section and filters; no language key remounts the page tree.

**Tech Stack:** Existing React 19, React Router, TypeScript, Vite, CSS and Node test runner. No translation service, credentials or new production dependency.

**Spec:** User requests in this task; `docs/figma/2026-09-27-copybook.md`; the handoff from “홈 섹션별 한글 폰트 분석”. Current website markup is the object/layout baseline. Figma supplies English wording and typography guidance, not replacement sample data.

## Global constraints

- Activate only on `/sample` or `/sample/…`; never on `/`, other original routes, or CMS editing surfaces.
- Preserve photographs, logos, score/book objects, staff lines, orbital nodes, card structure and native interaction state.
- Keep the hero wordmark `SEOUL / MOTET / YOUTH / CHOIR` and its opening motion. Translate surrounding copy and actions.
- Translate known strings in React/data before render. Do not mutate rendered text nodes or replace markup with HTML.
- Preserve unpublished/CMS originals, IDs, URLs, dates, numerical rules, privacy masking and form input values.
- Unknown live posts and unconfirmed proper names retain their source wording; identify Korean passages with `lang` where rendered in English context.
- Use British English to match the existing copybook. Keep support pledges distinct from payment authorisation.
- Scope any typography adjustment to sample English. Use existing fonts and semantic wrapping; no clipping or forced single-line prose.
- Computer use remains prohibited. Distinguish automated/SSR/source checks from real browser visual checks.

## Task 1 — evidence and handoff

- [x] Read routing, copy adapters, home content pipeline, shared header and sample resource documents.
- [x] Ask the existing font-analysis task about hero, current frames, typography, objects, source mappings, language switching and unresolved translations.
- [x] Research W3C language declaration/text expansion, GOV.UK language navigation and React state preservation.
- [x] Record the returned decisions and follow up on any conflicting frame/source assumptions.

## Task 2 — reviewed resources

**Files:** `src/features/sample-language/types.ts`, `englishHome.ts`, `englishPages.ts`, `englishWorkflows.ts`.

**Interface:** `TranslationEntry = { source: string; target: string; key?: string }`; each resource exports a readonly array. `key` disambiguates labels; source strings are checked before reuse.

```ts
export type SampleLanguage = 'ko' | 'en'
export type TranslationEntry = { source: string; target: string; key?: string }
```

- [x] Reuse the 82 bilingual source/reference pairs, checking titles against current source fields.
- [x] Translate the active shared UI, editorial content, forms and feedback messages; preserve placeholders and substantive facts.
- [x] Audit missing and conflicting entries against existing copy definitions. Record intentional source-language exceptions explicitly.

## Task 3 — sample language state and controls

Confirmed choices: Korean is the initial default; remember explicit language selection inside the sample. Known translations use English, while untranslated new posts and unconfirmed proper names keep the source.

**Files:** `sampleLanguageModel.ts`, `SampleLanguageProvider.tsx`, `useSampleLanguage.ts`, `SampleLanguageSwitch.tsx`, `sample-language.css`; narrowly integrate `src/App.tsx` and the shared header.

**Interfaces:** `resolveSampleLanguage(pathname, search, saved): SampleLanguage`; `languageLocation(location, language): string`; context `{ enabled, language, setLanguage, translate, translateData }`.

```ts
const next = new URLSearchParams(location.search)
next.set('lang', language)
navigate(`${location.pathname}?${next}${location.hash}`, { preventScrollReset: true })
```

- [x] Validate only `ko`/`en`; direct URL choice wins over a sample-only stored preference.
- [x] Keep query filters/hash while switching. Preserve local form/menu/tab state and scroll position through existing component identity; verified by state harnesses, not a browser.
- [x] Provide keyboard-operable, explicitly named language controls using native buttons.
- [x] Update and restore document language; prevent indexing sample pages.

## Task 4 — translate existing content without publishing

**Files:** Copy-provider integration, home content resolution, public-data display hook, title accent rendering and sample metadata.

**Interfaces:** `translate(source, key?)` resolves a reviewed source match; `translateData<T>(value: T): T` returns immutable display values while keeping structural fields intact.

- [x] Apply translations to copy labels/placeholders/errors and known public content only while sample English is active.
- [x] Localise home structured content before it is split into animated lines and emphasized fragments.
- [x] Keep image-internal text, unconfirmed names and unknown posts intact; never invent a concert, venue or person.
- [x] Preserve Korean rich-copy formatting and layout configuration when switching back; original markup contracts pass.
- [x] Check source-language form validation and dates/counts where they are assembled at runtime.

## Task 5 — layout and object preservation

**Files:** `sample-language.css`, minimal related render adapters if required.

- [x] Give English headings deliberate semantic lines and natural word wrapping inside existing sections.
- [x] Add sample-scoped responsive navigation/action rules and 44px controls. Actual pixel overflow/visual-fit checks remain unperformed under the computer-use prohibition.
- [x] Retain established font roles and existing decorative objects; do not replace image assets or alter motion timing.
- [x] Check Korean markup and original routes against pre-change evidence (not a browser screenshot comparison).

## Task 6 — 20 distinct verification rounds

Run and record each round, repair any issue, and rerun its affected checks. These are separate concerns, not 20 repeats of one command.

1. Original-route activation exclusion.
2. Sample path boundary and admin exclusion.
3. Valid/invalid URL language values.
4. Stored preference, refresh and unavailable storage.
5. Query/filter/hash preservation.
6. Back/forward locale changes.
7. Component/form state preservation.
8. Scroll and intro/motion state contracts.
9. Shared menu, footer and accessibility labels.
10. Hero wordmark/images and translated companion copy.
11. Home about/join steps, semantic title lines and emphasis.
12. Scorebook/spirit/archive/support objects and copy.
13. Spirit/about/staff/history translations and factual exceptions.
14. Concert/notice/gallery lists, details and empty states.
15. Join form, required fields, review and validation strings.
16. Inquiry/pledge wording, consent, signature and form state.
17. Translation completeness, source matching and placeholder preservation.
18. 390/768/1440 layout constraints and original markup invariants (record visual-check limitations).
19. Type check/build, lint and relevant/full regressions.
20. Final correction review, source delivery and documentation of unresolved verification limits.

## Added requirement — English editing in CMS

The user explicitly added CMS English editing, then reiterated that the English website applies only to `/sample/`. Use independent `sample_english_editor_pages` and `sample_english_editor_revisions` storage and corresponding restricted RPCs. Do not mix English draft publication with pending Korean drafts or call original publication RPCs from the English workspace.

- [x] Add isolated sample-English storage, admin-only reads/writes, version conflict checks, published-only public projection and restoration-to-draft.
- [x] Reuse the editor through an explicit `sample-english` storage option. Keep original API defaults unchanged.
- [x] Provide an “영문 샘플 편집” CMS entry with English defaults, independent save/history, and `/sample/...&lang=en` preview.
- [x] Route preview draft messages to English documents only; retain original Korean documents as the translation source.
- [x] Verify anonymous/non-admin restrictions, draft isolation, publication isolation, restore/version conflicts and cleanup of test transactions. Fold these into verification rounds 15–20.

## Result

20 verification concerns and their correction/rerun evidence are recorded in `docs/sample-english-verification.md`. Final standard suite: 909 passed, 0 failed, 2 browser tests skipped; lint and build passed. Database test writes were rolled back and original publication/draft digest remained unchanged. No browser/native computer automation, original-site publication, commit, push or deployment was performed. Actual visual fit remains a stated verification limit.

## Research references

- https://www.w3.org/International/articles/article-text-size/ — text expansion and flexible wrapping.
- https://www.w3.org/International/questions/qa-html-language-declarations — page/inline language metadata.
- https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts — language changes and proper-name exceptions.
- https://design-system.service.gov.uk/components/language-navigation/ — recognisable language names and current-language semantics.
- https://react.dev/learn/preserving-and-resetting-state — preserve tree identity during locale changes.
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat — locale-aware date presentation.
