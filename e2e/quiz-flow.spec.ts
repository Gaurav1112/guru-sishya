import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate through topics to reach a quiz page
    await page.goto("/app/topics");

    // Wait for topic cards to load
    const topicCards = page.locator(
      'button.group[type="button"]'
    );
    await expect(topicCards.first()).toBeVisible({ timeout: 15_000 });

    // Click first topic
    await topicCards.first().click();
    await page.waitForURL(/\/app\/topic\/\d+/, { timeout: 10_000 });

    // Navigate to quiz
    const quizLink = page.getByRole("link", { name: /quiz/i });
    await quizLink.click();
    await page.waitForURL(/\/app\/topic\/\d+\/quiz/, { timeout: 10_000 });
  });

  test("quiz page loads with question content", async ({ page }) => {
    // The quiz should show either a calibration intro or a question card
    // With static provider, it should load questions from the quiz bank
    const quizContent = page.locator(
      '[data-testid="quiz-question"], [data-testid="calibration-intro"], [data-testid="quiz-start"]'
    );
    await expect(quizContent.first()).toBeVisible({ timeout: 15_000 });
  });

  test("can start and interact with quiz", async ({ page }) => {
    // Wait for quiz to be ready
    // The static provider should show questions directly or a start button
    const startButton = page.getByRole("button", { name: /start|begin|next/i });
    const questionCard = page.locator('[data-testid="quiz-question"]');

    // Either we see a start button or questions directly
    const hasStart = await startButton.isVisible().catch(() => false);
    if (hasStart) {
      await startButton.click();
    }

    // Wait for a question to appear
    await expect(questionCard.or(page.locator("text=Question"))).toBeVisible({
      timeout: 15_000,
    });
  });
});
