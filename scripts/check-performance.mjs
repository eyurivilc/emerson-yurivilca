import fs from "node:fs/promises";
import { evaluatePerformance } from "./performance-policy.mjs";
const baseline = JSON.parse(
  await fs.readFile("reports/baseline/summary.json", "utf8"),
);
const final = JSON.parse(
  await fs.readFile("reports/final/summary.json", "utf8"),
);
const results = ["mobile", "desktop"].map((device) => ({
  device,
  baseline: baseline.medians[device],
  final: final.medians[device],
  ...evaluatePerformance(baseline.medians[device], final.medians[device]),
}));
await fs.writeFile(
  "reports/performance-acceptance.json",
  JSON.stringify(results, null, 2),
);
console.dir(results, { depth: null });
if (results.some((result) => !result.passed)) {
  console.error(
    "Performance acceptance not met (LCP<=2500ms/10%, CLS<=0.1/+0.02, TBT<=10% or no increase from zero). Keep changes uncommitted.",
  );
  process.exitCode = 1;
}
