> 보존 기록: 아래는 초기 담당자의 당시 검증 보고서이며 현재 작업 지시나 최종 완료 판정이 아닙니다. CMS 사용자 승인 대기 문구는 이후 사용자의 자율 적용 지시로 대체되었습니다. 루트의 후속 검증과 현재 한계는 cms-browser-qa-progress.md 및 cms-audit-results.md를 기준으로 합니다.

# CMS editor Task 5 local QA evidence

Date: 2026-09-17 Asia/Seoul. Agent: security_baseline.

Implementation and additional UI/design work stopped on the latest parent/user instruction: show a Figma CMS sample and obtain user approval before further application. Existing work is preserved. This report is evidence, not a claim of approval or production readiness.

## Isolation

- Test URL: http://127.0.0.1:5177/admin/editor . Vite served the actual repository App, admin route, editor and public preview provider.
- Only the temporary Vite entry/client module is substituted. The production Supabase module, authentication guard and role checks were not modified by this fixture.
- The fake client uses only same-origin /__editor_fixture/query and /__editor_fixture/rpc. Synthetic identity fixture@example.invalid and invented copy only. No private production data was read for this QA.
- envDir points at this temporary directory, not repository .env files. The fixture server makes no external API calls.
- Observed response CSP: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'self' ws://127.0.0.1:5177; frame-src 'self'; object-src 'none'. External fonts/images may therefore be blocked; their visual delivery is not covered.
- The fixture UI/status value 'productionRequests: 0' is a static assertion, NOT a measured network counter. Isolation evidence is the actual local-only transport, environment selection and observed CSP. No complete browser-network capture was obtained.
- Browser actions were performed through CUA Edge. Existing parent Supabase tab was not used. Hidden-tab support was unavailable in the Edge surface; no in-app browser was available.

## Fresh automated checks

- node --test src/components/admin/site-editor/editorSessionModel.test.mjs src/components/admin/site-editor/editorPreviewModel.test.mjs: 15 tests, 15 passed, 0 failed.
- Last two cases were first observed RED for missing busy exit guard and stale conflict comparison. After fixes both passed.
- pnpm exec tsc --noEmit: exit 0.
- pnpm exec eslint src/pages/admin/AdminSiteEditorPage.tsx src/components/admin/site-editor: exit 0.
- No full build or full-repository lint is claimed by this report; parent performs integration checks.

## Browser flows actually observed

1. Actual admin route loaded through synthetic authenticated admin profile. Original home field fallback displayed the synthetic existing CMS value before overrides.
2. Real iframe ready/draft/applied flow showed draft text immediately. Preview reload/device change also acknowledged current drafts.
3. Delayed save (5 seconds): submitted copy was saved while later typing stayed in the editor, remained dirty, and appeared in the preview. Draft save did not create a published document.
4. Injected 503 save failure displayed an error and preserved the input. Explicit retry saved successfully.
5. Explicit publish confirmation published only the selected home page. A separate public homepage tab displayed the published mobile text.
6. An independently modified fake server draft caused version-conflict rejection. '입력 유지하며 최신 초안과 비교' retained local text and showed server/local values; saving was blocked until a choice. '내 입력 유지' then saved against the new version.
7. Second publish created a second history item. Restoring the first item updated only the draft; public text remained the second publication.
8. Page switching kept unsaved home changes in memory and showed the other-page unsaved indicator.
9. Mobile h2Size=32 preview override yielded a 32px public iframe heading; administrator heading remained 20px. Switching preview to desktop used iframe clientWidth 1440 and original desktop-specific home text rather than the mobile override.
10. Actual admin viewport widths 390, 768 and 1440 were measured. Document scroll widths were 375, 753 and 1425 respectively: no horizontal page overflow in those observed states. Mobile fixed save actions were inside the viewport and 44px high. Screenshots were visually reviewed during the tool session, not saved as files.
11. Contact preview rendered after matching the fake sponsor RPC to the real chainable API. Invented name/email/message were entered. Checkbox keyboard Space worked. Keyboard Enter on the submit button displayed: '미리보기에서는 접수할 수 없습니다. 실제 홈페이지에서 작성해 주세요.' No submission request appeared in the local journal.
12. Strict preview model tests reject mismatched origin, source, nonce, page, version, malformed/extra message fields, and invalid sequence.

## Final local-state snapshot

- home.version: 7
- draft mobile home.mobile.current.about.title: '저장 중 더 입력한 목소리'
- published mobile home.mobile.current.about.title: '내가 선택한 다음 제목'
- published revision count: 2
- mutation journal request count: 8 (includes intentionally failed/conflicting requests).
- Mutation sequence: save, save, save, publish, save, save, publish, restore.
- Journal direct forbidden-write or submission requests: [] after the preview submission attempt.

## Limits and fixture issues

- This fake transport validates frontend state transitions and preview integration, not deployed SQL/RLS behavior or production concurrency.
- Actual iOS/Android devices, Safari, full keyboard journey, browser back/forward guarding, every catalog field and every public route were not comprehensively verified.
- Busy exit protection and conflict-card freshness were regression-tested in the pure model; no additional pending-publish browser exit test was performed after those final fixes.
- CUA checkbox coordinate click in a scaled iframe did not toggle it; keyboard Space succeeded. No product pointer bug is concluded from that automation result.
- Fixture-only initial duplicate React root and entry timestamp matching problems were corrected in temporary files. HMR was disabled to keep unrelated concurrent edits from resetting the fixture workflow.
- Contact initial loading error was fixture-only: the get_public_sponsors mock originally returned a Promise instead of the chainable query API. Corrected in fixture-client.mjs; no production change was made for that error.
- No production dependencies, migration execution, live submissions, production publication or security-policy changes were made by this QA.

## Cleanup and retained files

Fixture server session 47886 was stopped with Ctrl-C. Temporary browser viewport override was reset. No files were deleted and no existing source changes were reverted.

Owned directory (and only permitted future recursive cleanup target):
C:/Users/seong/AppData/Local/Temp/motet-site-editor-qa-4ba53e3c97474614b8dc2043d3ff7435

Owned contents: server.mjs, fixture-client.mjs, fixture-entry.tsx, seed-state.json, seed-stable.json, manifest.txt, qa-evidence.md and generated vite-cache/.

Task-created browser IDs: 1750147553, 1750147557, 1750147562, 1750147576. These are local QA tabs, not deliverables; no persistence mark was applied.
