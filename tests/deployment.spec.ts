import { test, expect } from "@playwright/test";

test("target serves canonical, local resources, and core interactions", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (
      new URL(response.url()).origin === "http://127.0.0.1:4322" &&
      response.status() >= 400
    )
      failures.push(response.url());
  });
  await page.route("https://static.cloudflareinsights.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  await page.goto("./");
  const cloudflare = process.env.DEPLOY_TARGET === "cloudflare";
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    cloudflare
      ? `${process.env.SITE_URL}/`
      : "https://eyurivilc.github.io/emerson-yurivilca/",
  );
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".portrait img")).toBeVisible();
  await page.getByRole("tab", { name: "Ventas" }).click();
  await expect(page.getByRole("tab", { name: "Ventas" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.locator("script[src*='cloudflareinsights.com']"),
  ).toHaveCount(process.env.CF_ANALYTICS_TOKEN ? 1 : 0);
  expect(failures).toEqual([]);
});
