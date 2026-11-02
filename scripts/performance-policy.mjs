/** Evaluate the approved lab thresholds; zero TBT baselines use an explicit absolute increase check. */
export function evaluatePerformance(before, after) {
  for (const metrics of [before, after])
    for (const key of ["lcp", "cls", "tbt"]) {
      if (!Number.isFinite(metrics[key]) || metrics[key] < 0)
        throw new Error(`Invalid ${key} measurement`);
    }
  const checks = {
    lcpAbsolute: after.lcp <= 2500,
    lcpRegression: after.lcp <= before.lcp * 1.1,
    clsAbsolute: after.cls <= 0.1,
    clsIncrease: after.cls - before.cls <= 0.02 + Number.EPSILON,
    tbtRegression:
      before.tbt === 0 ? after.tbt === 0 : after.tbt <= before.tbt * 1.1,
  };
  return {
    checks,
    lcpChangePercent:
      before.lcp === 0 ? null : (after.lcp / before.lcp - 1) * 100,
    clsIncrease: after.cls - before.cls,
    tbtChangeMs: after.tbt - before.tbt,
    tbtChangePercent:
      before.tbt === 0 ? null : (after.tbt / before.tbt - 1) * 100,
    passed: Object.values(checks).every(Boolean),
  };
}
