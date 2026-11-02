import { test, expect, observeFailures } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

const widths = [320, 375, 768, 1024, 1440];
const baseline = process.env.CAPTURE_PHASE === "baseline";

for (const width of widths) {
  test(`layout and accessibility at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    // Lazy images must enter the viewport before they can be asserted or captured.
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const phase = baseline ? "baseline" : "final";
    await fs.mkdir(`reports/${phase}/screenshots`, { recursive: true });
    await page.screenshot({
      path: `reports/${phase}/screenshots/${testInfo.project.name}-${width}.png`,
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await fs.writeFile(
      `reports/${phase}/${testInfo.project.name}-${width}-axe.json`,
      JSON.stringify({ overflow, violations: results.violations }, null, 2),
    );
    if (!baseline) {
      expect(overflow).toBe(false);
      expect(results.violations).toEqual([]);
      expect(errors).toEqual([]);
      for (const image of await page.locator("img").all()) {
        expect(
          await image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        ).toBe(true);
      }
    }
  });
}

test("refresh acceptance: readable copy and local SVG icons", async ({
  page,
}) => {
  test.skip(baseline, "Baseline captures do not assert new visuals");
  await page.goto("./");
  for (const selector of [
    ".hero-description",
    ".body-copy",
    ".service > p",
    ".about-copy > p",
    ".steps p",
    ".faq-list details > p",
  ]) {
    for (const element of await page.locator(selector).all()) {
      expect(
        await element.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        ),
        selector,
      ).toBeGreaterThanOrEqual(16);
    }
  }
  for (const selector of [
    ".button",
    ".nav-cta",
    ".demo-tabs button",
    ".contact select",
    ".contact textarea",
  ]) {
    for (const element of await page.locator(selector).all()) {
      expect(
        await element.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        ),
        selector,
      ).toBeGreaterThanOrEqual(15);
    }
  }
  await expect(
    page.locator(".tech-inner > div > span img[data-brand]"),
  ).toHaveCount(6);
  await expect(page.locator(".ai-tools > span img[data-brand]")).toHaveCount(3);
  await expect(
    page.locator('footer a[href*="wa.me"] svg[data-brand="whatsapp"]'),
  ).toHaveCount(1);
  const decorativeIcons = page.locator(
    ".tech-inner img, .ai-tools img, footer svg",
  );
  for (const icon of await decorativeIcons.all())
    await expect(icon).toHaveAttribute("aria-hidden", "true");
});

test("keyboard tabs, FAQ, skip link and mobile menu", async ({ page }) => {
  test.skip(baseline, "Functional final suite");
  await page.goto("./");
  // Explicit tabindex on the skip link also supports Windows WebKit traversal.
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenido$/);
  const reports = page.getByRole("tab", { name: "Reportes", exact: true });
  await reports.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Ventas", exact: true }),
  ).toBeFocused();
  await expect(page.locator("#metric-value")).toHaveText("S/ 18,400");
  await expect(page.locator("#panel-demo")).toHaveAttribute(
    "aria-labelledby",
    "tab-ventas",
  );
  await page.keyboard.press("End");
  await expect(page.locator("#metric-value")).toHaveText("36 / 40");
  await page.keyboard.press("ArrowRight");
  await expect(reports).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("tab", { name: "Operación", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(reports).toBeFocused();
  await page.getByRole("tab", { name: "Ventas", exact: true }).click();
  await expect(page.locator("#metric-secondary")).toHaveText("46");
  for (const faq of await page.locator(".faq-list details").all()) {
    await faq.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(faq).toHaveAttribute("open", "");
    await page.keyboard.press("Enter");
    await expect(faq).not.toHaveAttribute("open");
  }
  await page.setViewportSize({ width: 375, height: 812 });
  const menu = page.locator(".mobile-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await menu.getByRole("link", { name: "Servicios", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open");
  await expect(page).toHaveURL(/#servicios$/);
});

test("contact encoding and safe social links without external navigation", async ({
  page,
}) => {
  test.skip(baseline, "Functional final suite");
  await page.goto("./");
  for (const link of await page.locator('a[target="_blank"]').all()) {
    expect(await link.getAttribute("rel")).toContain("noopener");
    expect(await link.getAttribute("rel")).toContain("noreferrer");
  }
  await expect(
    page.locator('footer a[href="https://github.com/eyurivilc"]'),
  ).toHaveCount(1);
  await expect(
    page.locator(
      'footer a[href="https://www.linkedin.com/in/emersonyurivilca/"]',
    ),
  ).toHaveCount(1);
  for (const link of await page.locator('a[href*="wa.me"]').all()) {
    const url = new URL((await link.getAttribute("href"))!);
    expect(url.pathname).toBe("/51942795641");
    expect(url.searchParams.get("text")).toContain("Hola Emerson");
  }
  for (const link of await page.locator('a[href^="#"]').all()) {
    const target = await link.getAttribute("href");
    await expect(page.locator(target!)).toHaveCount(1);
  }
  const services = await page
    .locator("#service option")
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
  expect(services).toHaveLength(5);
  // Fulfill locally: tests must never send a message or contact WhatsApp.
  await page.route("https://wa.me/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "Intercepted contact navigation",
    }),
  );
  for (const service of services) {
    for (const note of ["", "  Datos & análisis + IA ¿sí?\nNueva línea  "]) {
      await page.goto("./");
      await page.locator("#service").selectOption(service);
      await page.locator("#message").fill(note);
      await page
        .getByRole("button", { name: "Conversar por WhatsApp" })
        .click();
      await page.waitForURL("https://wa.me/**");
      const url = new URL(page.url());
      expect(url.pathname).toBe("/51942795641");
      expect(url.searchParams.get("text")).toBe(
        `Hola Emerson, me gustaría cotizar ${service}.${note.trim() ? "\n\n" + note.trim() : ""}`,
      );
    }
  }
});

test("200% CSS zoom reflow and reduced motion", async ({ page }, testInfo) => {
  test.skip(baseline, "Functional final suite");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
  expect(
    await page
      .locator(".button")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  // CSS zoom exercises enlarged content; 640px viewport additionally verifies browser-zoom-equivalent reflow.
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `reports/final/screenshots/${testInfo.project.name}-zoom200.png`,
    fullPage: true,
  });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await page.setViewportSize({ width: 640, height: 450 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Conversar por WhatsApp" }),
  ).toBeVisible();
});

test("core content and contact fallback without JavaScript", async ({
  browser,
  baseURL,
}) => {
  test.skip(baseline, "Functional final suite");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const errors = observeFailures(page, baseURL!);
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Escríbeme directamente por WhatsApp" }),
  ).toBeVisible();
  await page.locator(".faq-list summary").first().click();
  await expect(page.locator(".faq-list details").first()).toHaveAttribute(
    "open",
    "",
  );
  expect(errors).toEqual([]);
  await context.close();
});

test("monochrome brand SVGs inherit visible text color", async ({ page }) => {
  test.skip(baseline, "New icon regression");
  await page.goto("./");
  for (const icon of await page
    .locator(
      'svg[data-brand]:not([data-brand="powerbi"]):not([data-brand="chatgpt"])',
    )
    .all()) {
    const paint = await icon
      .locator("path")
      .first()
      .evaluate((el) => ({
        fill: getComputedStyle(el).fill,
        color: getComputedStyle(el).color,
      }));
    expect(paint.fill).toBe(paint.color);
  }
});

test("below-fold technology SVGs stay outside critical HTML", async ({
  page,
  request,
}) => {
  test.skip(baseline, "External SVG acceptance");
  await page.goto("./");
  for (const image of await page
    .locator(".tech-inner img, .ai-tools img")
    .all()) {
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("fetchpriority", "low");
    await expect(image).toHaveAttribute("alt", "");
    const src = await image.getAttribute("src");
    expect(src).toMatch(/^\/emerson-yurivilca\/_astro\/.+\.svg$/);
    const response = await request.get(src!);
    expect(response.ok()).toBe(true);
    const svg = await response.text();
    expect(svg).not.toMatch(/<script|\bon\w+=|<filter/);
  }
});
