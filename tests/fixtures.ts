import { test as base, expect, type Page } from "@playwright/test";
export function observeFailures(page: Page, baseURL: string) {
  const errors: string[] = [];
  const origin = new URL(baseURL).origin;
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`console.error: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400)
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return errors;
}
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const errors = observeFailures(page, baseURL!);
    await use(page);
    expect(
      errors,
      "No local HTTP errors, console errors or uncaught exceptions",
    ).toEqual([]);
  },
});
export { expect };
