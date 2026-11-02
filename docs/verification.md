# Local visual refresh — verification

**Status: PARTIAL acceptance. Visual implementation and functional checks pass; mobile LCP remains 18.6% above baseline, exceeding the 10% allowance. No commits or publication.**

The refresh preserves the existing dark/green identity and Spanish content. Body copy is enlarged to 16–18px, controls to 15–16px and most secondary copy to 13–14px. Small uppercase decorative labels remain distinct. Gradients and diagonal texture are static CSS, not animation or filter-based noise.

## Preview

`http://127.0.0.1:4321/emerson-yurivilca/`

The production preview listens only on `127.0.0.1`. Run `npm run build` followed by `npm run preview` to restart it. This is a local review, not a deployment.

## Functional and visual coverage

- Playwright: Chromium, Firefox and WebKit; widths 320, 375, 768, 1024 and 1440.
- Axe WCAG A/AA checks at every viewport; no horizontal page overflow, missing images or uncaught page errors.
- Tab keyboard navigation/wrapping, all FAQ toggles, mobile menu close-on-navigation, valid internal anchors and safe external-link attributes.
- All five contact services with empty and Unicode/multiline notes. WhatsApp requests are intercepted locally; no message is sent.
- No-JavaScript content/contact fallback, reduced motion, CSS zoom 200% plus 640px reflow.
- Readable copy and controls, decorative icon names/alt semantics, visible SVG fill and external SVG safety/loading attributes.
- Before/after full-page screenshots. Desktop and mobile captures were visually inspected; tests are not a substitute for final human design approval.

Final production suite: **36/36 passed** in 137.52s, with 0 failures, 0 skipped and 0 flaky cases. Fifteen axe/viewport combinations report 0 violations. `npm run check`: 0 errors/warnings/hints; build and format checks pass.

### TDD evidence and fixes

1. Initial RED: `.body-copy` was 14px and failed the new >=16px acceptance test. Updated typography passed.
2. Visual QA caught SVGs rendered black: inherited CSS `color` does not change default SVG `fill`. A regression test failed with black versus text color; explicit paint fixed it. External technology assets now carry their intended pale-green color; Power BI retains its original gradients.
3. Windows WebKit skipped plain anchor links during Tab traversal. A minimal fixture confirmed explicit `tabindex="0"` works; the skip link now uses it, and keyboard tests pass. Alt+Tab did not resolve this runtime's behavior.
4. Lazy-image test assertions initially ran before the below-fold logo loaded. Tests now scroll images into view and wait before capture/assertion; no production eager-loading workaround was introduced.

## Performance method and results

Baseline: unchanged source at `d8170d7`, production build. Lighthouse 13.5.0, bundled Playwright Chromium, localhost, cold navigation, default simulated mobile and explicit desktop config. Three sequential runs per device; compare medians, not the fastest run. Transfer bytes are Lighthouse network transfer sizes; independent gzip accounting includes CSS/inline SVG plus each emitted external SVG.

| Metric | Baseline mobile | First final mobile | Baseline desktop | First final desktop |
|---|---:|---:|---:|---:|
| LCP | 1206.46ms | 1507.11ms | 326.79ms | 366.51ms |
| CLS | 0 | 0 | 0 | 0 |
| TBT, median | 0ms | 0ms | 0ms | 0ms |
| Transfer | 65,686B | 77,880B | 65,686B | 77,880B |
| Requests | 5 | 5 | 5 | 5 |

Baseline scores: performance 100, accessibility 97, best practices 100, SEO 100. The first final scored 100 in all categories, but **mobile LCP rose 25%**, so it did not satisfy the <=10% regression allowance. A score of 100 is not evidence of unchanged speed.

### Bounded correction

The original all-inline SVG approach added 11,342B compressed to critical HTML; the SQL Server mark alone is about 4.9KB gzip. Technologies and AI marks now load as local, cacheable SVG images with `loading="lazy"`, `fetchpriority="low"`, explicit dimensions and empty alt. Social/WhatsApp icons remain inline. This trades additional deferred requests for smaller critical HTML without adding client JavaScript or changing the visual treatment.

Only the SVG imports use Vite `?url&no-inline`. A global assets-inline setting was rejected because it also moved the existing client script to a separate request. The gzip budget includes the external assets, not just HTML, to avoid hiding their cost.

### Final optimized results

| Metric | Mobile | Desktop |
|---|---:|---:|
| LCP median | 1430.89ms | 326.14ms |
| Change versus baseline | +18.60% — FAIL | -0.20% — PASS |
| CLS median | 0 | 0 |
| TBT median | 0ms | 0ms |
| Transfer | 78,780B | 81,515B |
| Requests | 11 | 14 |
| Performance / accessibility / best practices / SEO | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

The mobile LCP samples were 1430.89,1440.19,1357.61ms. Even the fastest sample remains above the 10% allowance, so variance does not remove the concern. Desktop samples were 330.49,325.78,326.14ms. One mobile TBT sample was 11ms; median remained 0ms.

Critical HTML transfer fell from 18,550B to 8,642B (baseline 7,208B). The browser still requests six technology SVGs inside its native lazy-loading distance on mobile, at Low priority; desktop also requests the three AI marks. Extra requests and payload are a real tradeoff, not zero-cost decoration.

**Budget passes:** final CSS/SVG gzip 19,090B versus baseline 6,063B; delta 13,027B <20,480B, including emitted external SVGs (even emitted-but-unrequested assets). Client script is byte-for-byte unchanged: 2242B, SHA256 `0d5d216a2ae8ac268304157b045738176ef0349cf8bb245bf485ab0df10a06b9`.

Reproduce the acceptance decision with `npm run test:performance`: it intentionally exits 1 for the observed mobile regression. `npm run test:budget` passes. The bounded correction improved mobile LCP but did **not** close performance acceptance. No further optimization or measurement loop was performed.

**Next decision:** review the visual result and decide whether to accept the measured mobile tradeoff or authorize a separate scoped performance pass (for example, lower-complexity marks or a smaller image payload). Do not commit as fully accepted yet.

### Measurement accounting

- Six valid baseline runs and six first-final runs retained.
- Three early desktop attempts were actually mobile because the Node API ignores the CLI `preset` flag. These are excluded and retained under `reports/baseline/invalid-desktop-config/`; the corrected harness asserts `configSettings.formFactor`.
- One bounded repeat of three mobile and three desktop runs follows the performance correction. No loop-until-green measurement selection.
- Raw reports, summaries and screenshots are under `reports/baseline/`, `reports/preoptimization/` and `reports/final/`. They are ignored by Git, not hidden from local inspection.

## Provenance and dependencies

Local sources: Simple Icons 16.36.0 (CC0 collection and disclaimer), Devicon 2.17.0 (MIT), Tabler Icons 3.35.0 (MIT), and Microsoft Power BI (CC BY 4.0). Attribution, modifications, source URLs and complete license copies are served through the footer credits link and `public/licenses/`. Collection licenses do not grant trademark rights or imply endorsement. There are no runtime icon CDN requests.

`npm audit` reports **five existing vulnerable packages: one critical, three high and one low**, in the Astro 5 dependency chain. The suggested remediation includes a major Astro 7 upgrade. It was not applied within this visual change. Static output does not itself run the build/server dependency stack, but that is not a security clearance. A dependency-upgrade/security review remains separate work before broader exposure. Lighthouse was pinned to 13.5.0 so the added audit tooling introduces no additional reported vulnerabilities.

## Limits and delivery

- Automated CSS zoom/reflow is not a manual native browser zoom check, actual iPhone/Safari hardware test, screen-reader certification or complete WCAG conformance audit.
- Local lab results are not field Core Web Vitals and do not predict a specific hosting/network environment.
- RDD is off globally. Read-only risk assessment refused due to undeclared untracked inventory; no review lifecycle ran and no approval is claimed.
- No commits, push, pull request or publication. Final visual approval remains with the user.

## Coverage follow-up — current build, 2026-11-02

The latest observed suite is **63/63 passed in 137.51s**, no skipped, failed or flaky tests, across Chromium/Firefox/WebKit. Earlier 33/36-test counts above are historical. Added checks cover 1000-character Unicode WhatsApp notes and maxlength; page exceptions, console errors and same-origin HTTP >=400; sticky-header anchor destinations; mobile menu keyboard traversal and visible focus; and critical navigation/button/tab/contact control bounds, text clipping, center-point obstruction and pairwise overlap at all five widths. These targeted geometric checks are not exhaustive page-overlap detection or WCAG certification.

Playwright now builds production itself, owns a separate loopback port4322 with reuseExistingServer=false, and compares served HTML with current dist/index.html. The user preview remains on4321 (HTTP200 verified). Mobile menu anchors now explicitly use tabindex=0 after an observed WebKit keyboard RED, followed by GREEN.

Tailwind source detection is scoped to src using `@import "tailwindcss" source("../")`; official reference: https://tailwindcss.com/docs/detecting-classes-in-source-files. A test-only arbitrary-class sentinel leaked before the fix (RED), then was absent after it (GREEN, 1 source-scope test). The retained unscoped comparison includes the sentinel candidate from the test source itself: reports/source-scope-diff.json shows only removed utility selectors, no added or changed retained rules. No production component rule changed in this hygiene correction.

Current artifact budget: CSS/SVG gzip19036B, baseline6063B, delta12973B <20480B. Current CSS SHA256 b8b570799fd5e55c0cecc5f5ea3a9d3641f7a987e07d8de48865502beda249bf. Client script remains byte-identical2242B with the previously recorded SHA256. npm run test:budget passes against current dist, not a stale Lighthouse summary.

Performance policy has six passing unit tests and checks LCP<=2500ms plus <=10% regression, CLS<=0.1 plus increase<=0.02, and TBT<=10% regression (any increase flagged when baseline is zero; percentage null). npm run test:performance still exits1 for retained mobile LCP+18.60%; CLS/TBT pass. Lighthouse results above describe the last measured snapshot, before four keyboard tabindex attributes and source-scanning hygiene, NOT an exact measurement of the latest build. No further Lighthouse runs were performed.

Final npm run check:18files,0errors/warnings/hints; npm run format:check and git diff --check passed (Git emitted only line-ending warnings). Build passed as part of fresh-server validation. Native browser200% zoom and human visual approval remain pending. T3 remains partial for performance acceptance; no commits, push or publication.
