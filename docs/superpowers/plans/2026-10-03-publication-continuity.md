# Publication Continuity Implementation Plan

> **For agentic workers:** Use executing-plans inline. The user requested implementation, verification, commit and push without another planning handoff.

**Goal:** Preserve unsent input during publication loading, prevent stale publication responses, reduce unchanged photo updates and deliver compatible security headers.

**Architecture:** Keep the existing providers, storage APIs, language separation and route tree. Preserve mounted public content with React Activity. Resolve asynchronous publication reads by request order. Define response headers once in vercel.json and reuse them in Vite.

**Tech Stack:** React 19.2, Vite, TypeScript, Node test runner, existing Supabase boundaries.

**Spec:** User requests in this conversation and AGENTS.md.

## Global Constraints

- Preserve existing work, admin authorization, RLS and draft/public separation.
- No production data writes, new dependencies, force push or unrelated artifact deletion.
- Verify actual browser input, focused regressions, full tests, lint and build before commit.

## Tasks

- [x] Reproduce `/contact?lang=ko` → enter an unsent title → first English switch; observe lost input before changing the provider.
- [x] Add a real provider/form browser fixture and cancellation/completion regression; retain DOM/state with `Activity mode={publicationLoading ? 'hidden' : 'visible'}`.
- [x] Add deferred-response regressions for Korean and English; accept an awaited response only when its local request sequence is current.
- [x] Test unchanged photo snapshots, every mutable photo field, additions and removals; retain the current map only when keys and published values match.
- [x] Independently review same-origin CMS framing, forms, maps and video; add compatible deployment headers and share them with development/preview servers.
- [x] Update only the two reviewed map-referrer baseline fingerprints; retain all layout/copy contract assertions.
- [x] Cache immutable display translations with weak ownership; preserve unchanged content branches and isolate results by translator snapshot. No new runtime dependencies.
- [x] Exclude generated artifacts, documentation and test scripts from Tailwind class scanning; keep all production source classes in scope.
- [x] Run the full suite, lint, build and desktop/mobile/tablet route checks; resolve actual failures.
- [x] Review the final diff and stage only scoped source/tests/docs/configuration.

Integration decision: the user explicitly requested a commit and normal push on the existing branch after verification. No merge, force push, PR creation or unrelated artifact cleanup is authorized.

Verification commands: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm audit --prod --json`; browser regression with `SMYC_PLAYWRIGHT_MODULE`; in-app browser viewport checks at 390, 768 and 1440px plus landscape widths.
