import test from "node:test";
import assert from "node:assert/strict";
import { deploymentConfig, analyticsToken } from "../src/deployment.mjs";

test("Pages remains default and Cloudflare uses explicit root origin", () => {
  assert.deepEqual(deploymentConfig({}), {
    site: "https://eyurivilc.github.io",
    base: "/emerson-yurivilca",
  });
  assert.deepEqual(
    deploymentConfig({
      DEPLOY_TARGET: "cloudflare",
      SITE_URL: "https://example.workers.dev",
    }),
    { site: "https://example.workers.dev", base: "/" },
  );
});
test("Cloudflare requires a secure origin and valid analytics token", () => {
  assert.throws(() => deploymentConfig({ DEPLOY_TARGET: "cloudflare" }));
  assert.throws(() =>
    deploymentConfig({
      DEPLOY_TARGET: "cloudflare",
      SITE_URL: "https://example.workers.dev/path",
    }),
  );
  assert.throws(() => deploymentConfig({ DEPLOY_TARGET: "unknown" }));
  assert.equal(analyticsToken(undefined), undefined);
  assert.equal(analyticsToken("a1b2-34"), "a1b2-34");
  assert.throws(() => analyticsToken('bad"token'));
});
