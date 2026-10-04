# Vercel Link-Only Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Commit and push explicit Vercel build settings without creating a deployment.

**Architecture:** Keep the existing Vite SPA and Supabase clients unchanged. Vercel consumes `vercel.json` and `package.json`; preserve existing SPA rewrites and security headers. Automatic Git deployments are disabled for branches containing this configuration. This does not block manual deployments or change the older `main` branch.

**Tech Stack:** React, Vite 8, TypeScript, Node 24.x, pnpm 10.32.1, Vercel.

**Spec:** User request: prepare a Vercel-connectable environment, commit and push; connect only if it does not deploy. The requirements below are the complete scoped specification.

## Global Constraints

- No preview or production deployment, domain assignment, DNS change, database mutation, or secret registration.
- No change to public/CMS UI, Auth, RLS, production dependencies, or existing lockfile resolutions.
- Use the current `codex/recover-homepage-work` branch. Do not merge into `main`.
- Existing pushed checkpoint: `b263fc53f85fc1d15353bec8e4f978cc69427b9a`.
- Explicit Vercel preset `vite`, build command `pnpm build`, output `dist`.
- Node `24.x`; exact package manager `pnpm@10.32.1`, available from the official npm registry and within Vercel's documented pnpm support range.
- Install via `npx --yes pnpm@10.32.1 install --frozen-lockfile`, avoiding Vercel's documented oldest-pnpm selection for an unversioned custom install command.
- Keep `git.deploymentEnabled` false. A manual Dashboard Deploy or CLI deployment is outside this task.
- The connector's `INVALID_ARGUMENT` is unresolved; build configuration changes must not be represented as a successful project connection.

### Task 1: Explicit, non-deploying Vercel build contract

**Files:**
- Modify: `src/lib/vercelDeployment.contract.test.mjs` — Vercel-consumed boundary settings and package runtime contract.
- Modify: `vercel.json` — preset, install/build/output and Git deployment hold; retain headers/rewrites.
- Modify: `package.json` — Node and package-manager versions only.
- Modify: `README.md` — link-only instructions, branch warning, required public env names and manual deployment boundary.

**Interfaces:** Consumes existing `pnpm build`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`. Produces static platform configuration; no application API is added.

- [x] Add contract tests asserting explicit Vite/build/output, versioned frozen installer, matching package-manager pin, Node 24 and disabled automatic Git deployment.
- [x] Run `node --test --test-name-pattern='explicit Vite|pinned runtime|automatic Git' src/lib/vercelDeployment.contract.test.mjs`; verify failures are missing settings, not harness errors.
- [x] Add the specified manifest/config settings with `apply_patch` and retain existing headers/rewrites unchanged.
- [x] Update the README: connection does not prove deployment; required Supabase env names are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, never service-role/secret keys; current recovery branch is newer than remote main.
- [x] Run the full deployment contract and validate the existing lockfile using pnpm 10.32.1 in an external scratch directory, without reinstalling the active workspace's dependencies.
- [x] Run `pnpm lint` and `pnpm build`; smoke-test representative 390px/1440px public routes and unauthenticated CMS redirect. These are local checks, not a Vercel/Linux build.
- [x] Obtain an independent source/config diff review, including the static photo fixture repair.

**Git integration sequence:** Review the exact six staged paths for secrets/unrelated changes, commit with `chore: prepare Vercel link-only build configuration`, push only the current recovery branch, and compare a fresh remote SHA with HEAD. The completed Git result is recorded in the external verification evidence and final handoff, rather than claimed by the pre-commit plan.

### Verification Repair: Static Photo Test Watcher

The first full regression run failed one test process with `fs.watch UNKNOWN` on an unrelated OneDrive reference image. An isolated rerun passed the two existing photo assertions. A new characterization check then demonstrated that the static SSR fixture unnecessarily watches the workspace.

- Modify only `src/features/site-photos/SiteImage.test.mjs`: set the fixture's `server.watch` to `null`, preserving the real image component and both existing assertions.
- Assert the fixture's watched-directory count is zero. This check failed before the fixture configuration change.
- Rerun the three photo checks and the full regression suite. No production watcher or live development server setting changes.
- https://vite.dev/config/server-options#server-watch

### Verification Results Before Git Integration

- Focused deployment and static-photo tests: 10 passed, 0 failed, 0 skipped.
- Full retry using the pinned pnpm entry point and existing browser runtimes: Node test runner reports 1127 passed, 0 failed, 0 skipped. Preserve the first failed run as evidence of the watcher repair; do not describe that initial run as passing.
- Fresh pinned-pnpm lint and TypeScript/Vite build both exited 0. The build retained its plugin-timing advisory.
- Browser smoke checks: 27 unique route/viewport combinations passed with synthetic empty public data. Three history probes were corrected to recognize the valid empty-state heading and rerun; these are not claims about live CMS records or native devices.
- Security headers, SPA rewrites, production dependency declarations and lockfile resolutions remain unchanged.
- Independent review found no unintended production, UI, Auth/RLS or secret-value change across the six staged candidate files.
- No Linux/Vercel cloud build or clean dependency installation has been performed. The external pnpm 10 scratch check validates frozen-lockfile compatibility only.

## Research

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/package-managers
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/project-configuration/git-configuration
- https://registry.npmjs.org/pnpm/10.32.1

## Execution Choice

The user explicitly requested execution without more questions. Execute inline on the existing clean recovery branch; use a separate agent for read-only review. No additional worktree or main-branch operation is requested.
