import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--project=chromium",
    "-g",
    "layout and accessibility",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, CAPTURE_PHASE: "baseline" },
  },
);
process.exit(result.status ?? 1);
