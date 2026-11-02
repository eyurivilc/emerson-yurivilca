import { test, expect } from "./fixtures";
import fs from "node:fs/promises";

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`critical controls are unclipped and do not overlap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    for (const group of [
      ".nav",
      ".hero-actions",
      ".demo-tabs",
      ".contact form",
    ]) {
      const controls = page.locator(
        `${group} a, ${group} button, ${group} summary, ${group} select, ${group} textarea`,
      );
      const visible = [];
      for (const control of await controls.all()) {
        if (!(await control.isVisible())) continue;
        await control.evaluate((el) =>
          el.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        const issues = await control.evaluate((el) => {
          const box = el.getBoundingClientRect();
          const html = el as HTMLElement;
          const problems = [];
          if (
            html.scrollWidth > html.clientWidth + 1 ||
            html.scrollHeight > html.clientHeight + 1
          )
            problems.push("content overflow");
          if (box.left < 0 || box.right > innerWidth + 1)
            problems.push("outside viewport");
          const hit = document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
          if (!hit || !(el === hit || el.contains(hit)))
            problems.push("center obstructed");
          if (!["SELECT", "TEXTAREA"].includes(el.tagName)) {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent?.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(walker.currentNode);
              for (const rect of range.getClientRects())
                if (
                  rect.width &&
                  (rect.left < box.left - 1 ||
                    rect.right > box.right + 1 ||
                    rect.top < box.top - 1 ||
                    rect.bottom > box.bottom + 1)
                )
                  problems.push("text clipped");
            }
          }
          return problems;
        });
        expect(issues, (await control.textContent()) || group).toEqual([]);
        visible.push(control);
      }
      const rectangles = await Promise.all(
        visible.map((control) => control.boundingBox()),
      );
      for (let i = 0; i < rectangles.length; i++)
        for (let j = i + 1; j < rectangles.length; j++) {
          const a = rectangles[i]!,
            b = rectangles[j]!;
          const overlapX =
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
          const overlapY =
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
          expect(
            overlapX > 1 && overlapY > 1,
            `${group} controls ${i}/${j} overlap`,
          ).toBe(false);
        }
    }
  });
}

test("mobile menu keyboard traversal and visible focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./");
  const summary = page.locator(".mobile-menu summary");
  for (
    let i = 0;
    i < 15 && !(await summary.evaluate((el) => el === document.activeElement));
    i++
  )
    await page.keyboard.press("Tab");
  await expect(summary).toBeFocused();
  const focus = await summary.evaluate((el) => ({
    style: getComputedStyle(el).outlineStyle,
    width: parseFloat(getComputedStyle(el).outlineWidth),
  }));
  expect(focus.style).not.toBe("none");
  expect(focus.width).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Enter");
  await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
  const links = page.locator(".mobile-menu a");
  for (const link of await links.all()) {
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    expect(
      await link.evaluate((el) =>
        parseFloat(getComputedStyle(el).outlineWidth),
      ),
    ).toBeGreaterThanOrEqual(2);
  }
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contacto$/);
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open");
});

test("anchor destinations remain below sticky header", async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    for (const id of [
      "contenido",
      "servicios",
      "enfoque",
      "sobre-mi",
      "contacto",
    ]) {
      await page.evaluate((target) => {
        location.hash = target;
      }, id);
      await expect
        .poll(
          () =>
            page.locator(`#${id}`).evaluate((el) => {
              const box = el.getBoundingClientRect();
              const header = document
                .querySelector(".header")!
                .getBoundingClientRect();
              return box.top >= header.bottom - 1 && box.top < innerHeight;
            }),
          { message: `#${id} visible below header at ${width}` },
        )
        .toBe(true);
    }
  }
});

test("maximum-length WhatsApp note is preserved and input limit enforced", async ({
  page,
}) => {
  await page.goto("./");
  const note = "Á&+".repeat(333) + "Z";
  await expect(page.locator("#message")).toHaveAttribute("maxlength", "1000");
  await page.locator("#message").fill(note);
  await page.locator("#message").press("End");
  await page.locator("#message").pressSequentially("extra");
  await expect(page.locator("#message")).toHaveValue(note);
  const service = await page.locator("#service").inputValue();
  await page.route("https://wa.me/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "Intercepted",
    }),
  );
  await page.getByRole("button", { name: "Conversar por WhatsApp" }).click();
  await page.waitForURL("https://wa.me/**");
  expect(new URL(page.url()).searchParams.get("text")).toBe(
    `Hola Emerson, me gustaría cotizar ${service}.\n\n${note}`,
  );
});

test("test server serves the current production build", async ({ request }) => {
  const response = await request.get("./");
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe(
    await fs.readFile("dist/index.html", "utf8"),
  );
});
