import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";

const phase = process.argv[2];
if (!["baseline", "final"].includes(phase))
  throw new Error("Use baseline or final");
const directory = `reports/${phase}`;
await fs.mkdir(directory, { recursive: true });
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const selectedDevice = process.argv[3];
const measurements = selectedDevice
  ? JSON.parse(
      await fs.readFile(`${directory}/summary.json`, "utf8"),
    ).measurements.filter((row) => row.device !== selectedDevice)
  : [];
for (const device of selectedDevice
  ? [selectedDevice]
  : ["mobile", "desktop"]) {
  for (let run = 1; run <= 3; run++) {
    const chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless", "--disable-gpu", "--no-first-run"],
    });
    try {
      const result = await lighthouse(
        "http://127.0.0.1:4321/emerson-yurivilca/",
        {
          port: chrome.port,
          output: ["json", "html"],
          logLevel: "error",
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
        },
        device === "desktop" ? desktopConfig : undefined,
      );
      if (result.lhr.configSettings.formFactor !== device)
        throw new Error("Incorrect Lighthouse form factor");
      await fs.writeFile(
        `${directory}/lighthouse-${device}-${run}.json`,
        result.report[0],
      );
      await fs.writeFile(
        `${directory}/lighthouse-${device}-${run}.html`,
        result.report[1],
      );
      const { audits, categories } = result.lhr;
      const row = {
        device,
        run,
        lcp: audits["largest-contentful-paint"].numericValue,
        cls: audits["cumulative-layout-shift"].numericValue,
        tbt: audits["total-blocking-time"].numericValue,
        bytes: audits["total-byte-weight"].numericValue,
        requests: audits["network-requests"].details.items.filter((item) =>
          /^https?:/.test(item.url),
        ).length,
        scores: Object.fromEntries(
          Object.entries(categories).map(([key, category]) => [
            key,
            category.score * 100,
          ]),
        ),
      };
      measurements.push(row);
      console.log(JSON.stringify(row));
    } finally {
      chrome.kill();
    }
  }
}
const medians = Object.fromEntries(
  ["mobile", "desktop"].map((device) => {
    const rows = measurements.filter((row) => row.device === device);
    return [
      device,
      Object.fromEntries(
        ["lcp", "cls", "tbt", "bytes", "requests"].map((key) => [
          key,
          median(rows.map((row) => row[key])),
        ]),
      ),
    ];
  }),
);
async function files(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(root, entry.name))
          : path.join(root, entry.name),
      ),
    )
  ).flat();
}
const builtFiles = await files("dist");
const assetSizes = [];
for (const file of builtFiles.filter((file) =>
  /\.(css|svg|js|html)$/.test(file),
)) {
  const content = await fs.readFile(file);
  assetSizes.push({
    file: file.replaceAll("\\", "/"),
    bytes: content.length,
    gzip: gzipSync(content).length,
  });
}
// Count CSS/inline SVG plus each separately compressed emitted SVG asset.
const html = await fs.readFile("dist/index.html", "utf8");
const svg = (html.match(/<svg\b[\s\S]*?<\/svg>/g) || []).join("");
const css = await Promise.all(
  builtFiles
    .filter((file) => file.endsWith(".css"))
    .map((file) => fs.readFile(file)),
);
const inlineVisualGzipBytes = gzipSync(
  Buffer.concat([...css, Buffer.from(svg)]),
).length;
const externalSvgGzipBytes = (
  await Promise.all(
    builtFiles
      .filter((file) => file.includes("_astro") && file.endsWith(".svg"))
      .map(async (file) => gzipSync(await fs.readFile(file)).length),
  )
).reduce((a, b) => a + b, 0);
const visualGzipBytes = inlineVisualGzipBytes + externalSvgGzipBytes;
await fs.writeFile(
  `${directory}/summary.json`,
  JSON.stringify(
    {
      phase,
      measurements,
      medians,
      assetSizes,
      visualGzipBytes,
      capturedAt: new Date().toISOString(),
      method:
        "Production Astro preview; localhost; Lighthouse default simulated mobile / desktop preset; Chromium from Playwright; cold navigation per run; HTTP transfer bytes from Lighthouse; independent CSS/inline-SVG gzip stream plus individually gzipped external SVG assets.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ medians, visualGzipBytes }));
