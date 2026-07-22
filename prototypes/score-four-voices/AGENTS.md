# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Selected visual direction

- Recreate the third generated concept displayed on 2026-07-22: one continuous warm-ivory score sheet, a centered two-line burgundy statement, four evenly spaced voice labels, and one edge-to-edge five-line staff with identical M-shaped notches at both ends.
- The final state must not contain four stacked panels, a center spine, a center fold, gradient bands, cards, or visibly different background images.
- Preserve the existing concert-program opening and page-turn animation, but let the book fully disappear into the single continuous score plane before the final statement settles.
- Keep the main website untouched. This folder is an isolated animation sample only.
- Preserve the Seoul Motet Youth Choir logo, ivory/orange/burgundy palette, wide editorial proportions, and Korean serif display typography.
- Verify in the user's existing Chrome window without changing its viewport dimensions.
