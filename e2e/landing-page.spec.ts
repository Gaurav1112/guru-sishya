import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Guru Sishya/i);
  });

  test('has "Ace Your FAANG Interview" heading', async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toContainText("Ace Your FAANG Interview");
  });

  test('"Start Free" button links to /app/topics', async ({ page }) => {
    const startFreeBtn = page
      .getByRole("navigation")
      .getByRole("link", { name: /start free/i });
    await expect(startFreeBtn).toHaveAttribute("href", "/app/topics");
  });

  test("pricing section is visible", async ({ page }) => {
    const pricing = page.locator("#pricing");
    await pricing.scrollIntoViewIfNeeded();
    await expect(pricing).toBeVisible();
    await expect(pricing.locator("h2")).toContainText("Pricing");
  });

  test("footer has correct links", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer.getByRole("link", { name: /browse topics/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy policy/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms of service/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /github/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /contact/i })).toBeVisible();
  });
});
