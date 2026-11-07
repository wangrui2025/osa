# OSA interactive method walkthrough — visual review

These screenshots document the browser-rendered, bilingual, responsive teaching explainer introduced in PR #13.

| Viewport | Screenshot |
| --- | --- |
| 1280 px Chromium desktop | [Desktop preview](desktop.webp) |
| 390 px Chromium mobile | [Mobile preview](mobile.webp) |

## Scope and provenance

- Source: `src/components/MethodExplorer.astro`, `src/scripts/method-explorer.ts`; rendered on both `/en/` and `/zh/`.
- APFE: deterministic 88 × 88 scalar feature map, 11 × 11 average pooling, `ReLU(X - M)` and `ReLU(M - X)`, with tunable *speckle-like* synthetic texture and depth bias.
- OSU: 2 × 2 gated state recurrence (Eq. 1), with ideal polar projection to clarify the Stiefel constraint. The paper's actual implementation instead uses an approximate, finite-step Newton–Schulz projection.
- **Not clinical data, measured singular-value trajectories, or learned OSA segmentation predictions.** The colored APFE residuals are contrast-enhanced for visualization.
- Underlying technical definitions and measured results remain in the paper and the site's original figures.
- The screenshots were captured from local static build via Playwright Chromium on November 7, 2026; desktop and mobile sizes correspond to screenshot dimensions.

## Validation

`npm run build` succeeded with 0 Astro diagnostics, and `npx playwright test` passed all 10 browser tests (6 existing + 4 new). These are rendering, interaction and accessibility preference checks, **not a clinical/scientific reproduction**.

## Review checklist

- Do visual proportions and labels improve understanding on desktop and mobile?
- Are both toy-model caveats prominently understandable to general readers?
- Verify the scientific description against the paper before publishing.
