import { test, expect } from "@playwright/test";

test.describe("Topic Flow", () => {
  test("topics page loads with topic grid", async ({ page }) => {
    await page.goto("/app/topics");

    // Wait for content to load (shimmer placeholders disappear)
    await expect(page.locator("h1")).toContainText("Browse All Topics");

    // Wait for at least one topic card to appear (the motion.button elements)
    const topicCards = page.locator(
      'button.group[type="button"]'
    );
    await expect(topicCards.first()).toBeVisible({ timeout: 15_000 });

    // Should have multiple topics
    const count = await topicCards.count();
    expect(count).toBeGreaterThan(10);
  });

  test("clicking a topic card navigates to topic hub", async ({ page }) => {
    await page.goto("/app/topics");

    // Wait for topic cards to load
    const topicCards = page.locator(
      'button.group[type="button"]'
    );
    await expect(topicCards.first()).toBeVisible({ timeout: 15_000 });

    // Click the first topic card
    await topicCards.first().click();

    // Should navigate to topic hub page /app/topic/[id]
    await page.waitForURL(/\/app\/topic\/\d+/, { timeout: 10_000 });

    // Verify topic hub loaded with feature cards
    const featureCards = page.locator('[data-testid="feature-card"]');
    await expect(featureCards.first()).toBeVisible({ timeout: 10_000 });

    // Should have 6 feature cards
    await expect(featureCards).toHaveCount(6);
  });

  test("feature cards have correct titles", async ({ page }) => {
    await page.goto("/app/topics");

    const topicCards = page.locator(
      'button.group[type="button"]'
    );
    await expect(topicCards.first()).toBeVisible({ timeout: 15_000 });
    await topicCards.first().click();
    await page.waitForURL(/\/app\/topic\/\d+/, { timeout: 10_000 });

    // Check feature card titles
    const expectedTitles = [
      "Learning Path",
      "Quick Summary",
      "Quiz",
      "Skill Levels",
      "Resources",
      "Teach Mode",
    ];

    for (const title of expectedTitles) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
  });

  test("clicking Quiz navigates to quiz page", async ({ page }) => {
    await page.goto("/app/topics");

    const topicCards = page.locator(
      'button.group[type="button"]'
    );
    await expect(topicCards.first()).toBeVisible({ timeout: 15_000 });
    await topicCards.first().click();
    await page.waitForURL(/\/app\/topic\/\d+/, { timeout: 10_000 });

    // Click the Quiz feature card
    const quizLink = page.getByRole("link", { name: /quiz/i });
    await quizLink.click();

    // Should navigate to quiz page
    await page.waitForURL(/\/app\/topic\/\d+\/quiz/, { timeout: 10_000 });
  });
});
