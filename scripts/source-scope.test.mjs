import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";
test("test-only class candidates never enter production CSS", async () => {
  const probe = "tests/tailwind-source-probe.html";
  await fs.writeFile(probe, '<div class="z-[9876]"></div>', { flag: "wx" });
  try {
    execSync("npm run build", { stdio: "pipe" });
    const names = (await fs.readdir("dist/_astro")).filter((name) =>
      name.endsWith(".css"),
    );
    const css = (
      await Promise.all(
        names.map((name) => fs.readFile(`dist/_astro/${name}`, "utf8")),
      )
    ).join("");
    assert.ok(
      !css.includes("9876"),
      "Test-only arbitrary z-index leaked into production CSS",
    );
  } finally {
    await fs.unlink(probe);
  }
});
