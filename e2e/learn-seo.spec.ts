import { test, expect } from "@playwright/test";

test.describe("Learn SEO Pages", () => {
  test("learn index page renders topic list", async ({ page }) => {
    await page.goto("/learn");

    // Verify the page heading
    await expect(page.locator("h1")).toContainText(
      "Learn Software Engineering Interview Topics"
    );

    // Should have topic link cards
    const topicLinks = page.locator('a[href^="/learn/"]');
    await expect(topicLinks.first()).toBeVisible({ timeout: 10_000 });

    const count = await topicLinks.count();
    expect(count).toBeGreaterThan(10);
  });

  test("clicking a topic navigates to learn/[slug] with content", async ({
    page,
  }) => {
    await page.goto("/learn");

    // Click the first topic link
    const topicLinks = page.locator('a[href^="/learn/"]');
    await expect(topicLinks.first()).toBeVisible({ timeout: 10_000 });

    const firstTopicText = await topicLinks.first().locator("h3").textContent();
    await topicLinks.first().click();

    // Should navigate to /learn/[slug]
    await page.waitForURL(/\/learn\/[a-z0-9-]+/, { timeout: 10_000 });

    // Verify content loaded
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    if (firstTopicText) {
      await expect(heading).toContainText(firstTopicText);
    }

    // Verify breadcrumb navigation exists
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
  });

  test("learn topic page has meta tags", async ({ page }) => {
    await page.goto("/learn");

    // Get first topic slug
    const topicLinks = page.locator('a[href^="/learn/"]');
    await expect(topicLinks.first()).toBeVisible({ timeout: 10_000 });
    const href = await topicLinks.first().getAttribute("href");

    // Navigate to the topic page
    await page.goto(href!);

    // Check meta description exists
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(20);
  });

  test("learn topic page has structured data", async ({ page }) => {
    await page.goto("/learn");

    const topicLinks = page.locator('a[href^="/learn/"]');
    await expect(topicLinks.first()).toBeVisible({ timeout: 10_000 });
    const href = await topicLinks.first().getAttribute("href");

    await page.goto(href!);

    // Check for JSON-LD structured data (Course schema)
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Parse and verify the Course schema
    const schemaText = await jsonLd.first().textContent();
    expect(schemaText).toBeTruthy();
    const schema = JSON.parse(schemaText!);
    expect(schema["@type"]).toBe("Course");
    expect(schema.isAccessibleForFree).toBe(true);
  });

  test("learn index page has ItemList structured data", async ({ page }) => {
    await page.goto("/learn");

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd.first()).toBeAttached();

    const schemaText = await jsonLd.first().textContent();
    const schema = JSON.parse(schemaText!);
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.numberOfItems).toBeGreaterThan(10);
  });
});
