import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const baseline = JSON.parse(
  await fs.readFile("reports/baseline/summary.json", "utf8"),
);
const paths = (await fs.readdir("dist", { recursive: true })).map(
  (path) => "dist/" + path.replaceAll("\\", "/"),
);
const cssPaths = paths.filter((path) => path.endsWith(".css"));
const css = await Promise.all(cssPaths.map((path) => fs.readFile(path)));
const html = await fs.readFile("dist/index.html", "utf8");
const svg = (html.match(/<svg\b[\s\S]*?<\/svg>/g) || []).join("");
const external = paths.filter(
  (path) => path.includes("_astro") && path.endsWith(".svg"),
);
const externalBytes = (
  await Promise.all(
    external.map(async (path) => gzipSync(await fs.readFile(path)).length),
  )
).reduce((a, b) => a + b, 0);
const final = {
  visualGzipBytes:
    gzipSync(Buffer.concat([...css, Buffer.from(svg)])).length + externalBytes,
};
const cssHashes = Object.fromEntries(
  await Promise.all(
    cssPaths.map(async (path) => [
      path,
      createHash("sha256")
        .update(await fs.readFile(path))
        .digest("hex"),
    ]),
  ),
);
const delta = final.visualGzipBytes - baseline.visualGzipBytes;
assert.ok(
  delta <= 20 * 1024,
  `CSS/SVG gzip grew by ${delta} bytes (budget 20480)`,
);
const scripts = (html) =>
  (html.match(/<script\b[\s\S]*?<\/script>/g) || []).join("");
const before = scripts(
  await fs.readFile("reports/baseline/dist/index.html", "utf8"),
);
const after = scripts(await fs.readFile("dist/index.html", "utf8"));
assert.equal(
  after,
  before,
  "The refresh must not add or alter client JavaScript",
);
const result = {
  cssSvgGzipDeltaBytes: delta,
  currentVisualGzipBytes: final.visualGzipBytes,
  cssHashes,
  measuredAt: new Date().toISOString(),
  budgetBytes: 20480,
  clientScriptBytes: Buffer.byteLength(after),
  clientScriptSha256: createHash("sha256").update(after).digest("hex"),
  clientJavaScriptUnchanged: true,
};
await fs.writeFile("reports/budget.json", JSON.stringify(result, null, 2));
console.log(result);
