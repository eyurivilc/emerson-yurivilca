import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePerformance } from "./performance-policy.mjs";
const baseline = { lcp: 1000, cls: 0, tbt: 0 };
test("unchanged zero baselines pass without division by zero", () =>
  assert.equal(evaluatePerformance(baseline, baseline).passed, true));
test("LCP absolute and relative limits are both enforced", () => {
  assert.equal(
    evaluatePerformance(baseline, { ...baseline, lcp: 1101 }).passed,
    false,
  );
  assert.equal(
    evaluatePerformance({ ...baseline, lcp: 2400 }, { ...baseline, lcp: 2501 })
      .passed,
    false,
  );
});
test("CLS absolute and increase limits are both enforced", () => {
  assert.equal(
    evaluatePerformance(baseline, { ...baseline, cls: 0.021 }).passed,
    false,
  );
  assert.equal(
    evaluatePerformance({ ...baseline, cls: 0.09 }, { ...baseline, cls: 0.101 })
      .passed,
    false,
  );
});
test("TBT increase from zero is flagged, never assigned an invented percent", () => {
  const result = evaluatePerformance(baseline, { ...baseline, tbt: 1 });
  assert.equal(result.passed, false);
  assert.equal(result.tbtChangePercent, null);
});
test("nonzero TBT allows at most ten percent", () => {
  assert.equal(
    evaluatePerformance({ ...baseline, tbt: 100 }, { ...baseline, tbt: 110 })
      .passed,
    true,
  );
  assert.equal(
    evaluatePerformance({ ...baseline, tbt: 100 }, { ...baseline, tbt: 111 })
      .passed,
    false,
  );
});
test("missing or nonfinite metrics fail closed", () =>
  assert.throws(() =>
    evaluatePerformance(baseline, { lcp: NaN, cls: 0, tbt: 0 }),
  ));
