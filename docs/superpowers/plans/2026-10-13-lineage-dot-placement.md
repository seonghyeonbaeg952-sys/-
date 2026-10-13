# NOW/NEXT dot placement implementation plan

> **For agentic workers:** Execute inline using the existing editor bridge and browser checkpoints. No separate agent is required for this focused change.

**Goal:** Place the two dots beside NOW/NEXT and allow CMS operators to move each dot independently.

**Architecture:** Reuse `EditableLayout`, `textLayouts`, the authenticated placement bridge and its undo/redo. Give the two decorative targets a position-only catalog capability; keep typography/width tools available only for text. Anchor each dot inside its native year label, not inside the text-editable copy node.

**Tech Stack:** React, TypeScript, Motion, existing CSS/editor storage.

**Spec:** User requests: dots must be beside NOW/NEXT, their positions must be editable, and verified changes must be pushed.

## Constraints

- Preserve KO/EN copy, fonts, first two milestones, curve and motion timing.
- Keep device/language isolation, existing auth/RLS and publication confirmation.
- No new dependencies or database migration; existing bounded numeric offsets are sufficient.
- Never publish temporary QA offsets. A bounded draft-save/reload check may use the existing admin RPC only after confirming the original target and document hashes; remove only the test dot override afterward and verify exact content restoration.

## Task 1: Position-only decorative editor targets

Files: `textLayoutCatalog.ts`, `EditableLayout.tsx`, `EditorPlacementToolbar.tsx`, `editorPlacementController.ts`, `canvasPlacementRuntime.ts` and their existing tests.

- [x] Add failing tests: dot IDs resolve as position-only; a native dot consumes only its device offsets; toolbar emits `{offsetX:12,offsetY:-8}` without text/width controls; controller rejects `{width:80}` on a dot; resize runtime returns the unchanged dot position. Observed 5 intended failures before implementation.
- [x] Extend `TextLayoutDefinition` with `positionOnly?: boolean`; declare `spirit.lineage.now.dot` and `spirit.lineage.next.dot` with labels `NOW 옆 점`/`NEXT 옆 점`.
- [x] Support ref-forwarding native `span` in `EditableLayout`; filter dot values to offsets. Hide typography/resize actions for position-only targets and fail closed at placement commits.
- [x] Rerun the real component/controller/runtime tests and confirm ordinary text targets retain existing controls: 95 passed, 0 failed.

## Task 2: Anchor and register both dots

Files: `SpiritHeritageExperience.tsx`, `FormattedCopy.tsx`, `spirit-heritage.css`, preview coverage tests.

- [x] Add a preview-render test requiring exactly one native target per dot and year, dot nested under its year, and no text-editable dot registry. Observed missing native targets before implementation.
- [x] Allow `FormattedCopy` to opt out of its own layout target when its native year already owns that identity. Render each year with `EditableLayout`, and each nested dot with its own position-only identity.
- [x] Position dots at `left: -24px`, `bottom: .08em`, `top: auto`; keep years relatively positioned in existing grid cells. Remove only the obsolete NOW/NEXT dot pixel overrides. Give preview-only dot hit areas 44px without enlarging the visible dot.
- [x] Verify KO/EN at 390, 768, 1440 and 1920: 8 viewport/device conditions, 12px mark, 12px adjacent gap and no horizontal overflow. Normal motion also reaches opacity 1 and the original 12px dot size. Native label movement shifts label and dot equally. Text editing leaves the sibling dot intact; dot X/Y changes, reset and undo/redo confirmed in the actual CMS.
- [x] Verify a bounded draft save/reload and restore the temporary dot override. English NEXT dot `{offsetX:10}` persisted at version 86 and reloaded as X=10, then only that override was removed and saved at version 87. Final EN draft/published hashes both `34cee27e6a9bec2a559367e13bc80f2c`; KO version 118 and hashes `ce92d5c42d9b412cef26e79a2bb16209` remained unchanged. Neither test offset nor copy was published. Actual CMS KO/EN × three devices registered the point-only targets with independent empty defaults.

## Task 3: Delivery

- [x] Run affected tests, full suite, lint/build and diff checks. Related tests 138 passed plus 17 source-contract tests. Full rerun: 1,174 passed, 0 failed, 11 skipped. First full run caught the intentional dot DOM snapshot update and an unrelated SiteImage test-process exit; all 3 SiteImage assertions passed in isolated rerun, with no SiteImage code change. Only the reviewed Spirit source/SSR fingerprints were updated for dot nesting; no broad contract exceptions added.
- [x] Browser regression: 8 public routes × 390/768/1440 = 24 loaded conditions, zero horizontal overflow and no captured console errors. Join verification waited for the actual guide rather than accepting its loading header. Existing support route is the pledge form; no form data was entered or submitted. Evidence saved outside the repository under the session's `lineage-dots` folder.
- [x] Commit/push main under user authorization. Code commit `a563a8652e66f3cb0085aaf02aa21349b86200d7`; exact production deployment `dpl_43KPqXW76My92kKDQfVavkwkg382` READY with actual-domain aliases. Production KO/EN desktop dots both measure 12px, adjacent gap 12px and horizontal overflow 0. The authenticated production CMS exposes the point-only controls at X=0/Y=0 with the draft and published document equal. Verification values were never published; screenshots/viewport evidence remain outside Git. Actual iOS Safari and physical touch/IME remain untested.
