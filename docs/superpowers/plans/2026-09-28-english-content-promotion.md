# English content completion and production promotion

**Goal:** Complete missing English copy and editing controls, repair the English application date, then make English available on the original public site without changing the Korean default or design.

**Architecture:** Keep the shared CMS records and site layout. Store English per record/field in the existing versioned, admin-only English-content table; preserve IDs, visibility, dates, images, and Korean values. Reuse the existing English dictionary for fixed UI copy. Split "language available" from "sample/no-write" mode before enabling English on production. Never overwrite an existing English draft or publication in the backfill.

**Evidence:** The sample public route currently translates from a static registry, while four About CMS rows have no persisted English record and consequently show "원본 사용". The About tabs bypass translation. Conductor/performer resources are missing from the English-content allowlist. Browser-native date controls display in the user's locale despite ISO storage (MDN).

### Task 1: Characterize and protect current behavior

- [ ] Inventory live source rows and existing English variants; record gaps and avoid overwrites.
- [ ] Write failing tests for the date, About tab labels, English CMS defaults, staff content, and sample-versus-production routing/submit guards.

### Task 2: English copy and CMS

- [ ] Extend the existing English-content schema/model/editor to relevant profile fields, including the conductor; preserve RLS/admin-only writes.
- [ ] Translate fixed About option labels and history display copy in English mode, with no Korean layout change.
- [ ] Backfill safe, source-grounded English copy into missing CMS variants for existing About/history/profile content. Keep unverified proper names in source language rather than inventing official English names.
- [ ] Change CMS labels from English sample to English version and make missing/published state truthful.

### Task 3: Date and production promotion

- [ ] Reuse the existing segmented English Month/Day/Year input in the membership form; retain validation, accessibility, mobile layout, and Korean native input.
- [ ] Mount language support on original public routes with Korean as default, while keeping `/sample/` as a non-submitting preview. Route links, SEO, and forms according to actual sample status.
- [ ] Keep all visual changes gated to English so the original Korean homepage remains unchanged.

### Task 4: Verification

- [ ] Run focused tests, lint, build, and full tests; verify allowed routes over HTTP and remote DB row counts/status.
- [ ] Check Korean and English states at desktop/mobile via non-computer-use means available; explicitly report any visual QA limitation.
- [ ] Update the usage guide and summarize changed behavior, research, and remaining risks.
