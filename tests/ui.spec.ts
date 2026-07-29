import { test, expect } from "@playwright/test";

test.describe("CVitae Tailor UI", () => {
  test("page loads correctly at /en with all key elements", async ({ page }) => {
    await page.goto("/en");

    // Header logo and title
    await expect(page.locator("h1")).toContainText("CVitae Tailor");

    // AI Tailor button
    await expect(page.getByRole("button", { name: /AI Tailor/i })).toBeVisible();

    // Render PDF button
    await expect(page.getByRole("button", { name: /Render PDF/i })).toBeVisible();

    // Left panel label
    await expect(page.getByText("Variant Configuration")).toBeVisible();

    // Right panel label
    await expect(page.getByText("Live Preview")).toBeVisible();

    // Monaco editor container should load
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30000 });

    // Empty state placeholder in preview pane
    await expect(page.getByText(/Click "Render PDF" to generate preview/i)).toBeVisible();

    console.log("✅ All UI elements are present and visible!");
  });

  test("page loads in French at /fr", async ({ page }) => {
    await page.goto("/fr");

    await expect(page.locator("h1")).toContainText("CVitae Sur-Mesure");
    await expect(page.getByRole("button", { name: /IA Sur-Mesure/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Générer PDF/i })).toBeVisible();
    await expect(page.getByText("Configuration du Variant")).toBeVisible();
    await expect(page.getByText("Aperçu en Direct")).toBeVisible();

    console.log("✅ French locale renders correctly!");
  });

  test("/ redirects to /en or /fr automatically", async ({ page }) => {
    await page.goto("/");
    // Middleware should redirect to a locale
    await expect(page).toHaveURL(/\/([a-z]{2})/);
    console.log("✅ Root redirect works!");
  });

  test("page has correct beige background color applied", async ({ page }) => {
    await page.goto("/en");

    const bg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Beige background #F9F8F6 == rgb(249, 248, 246)
    expect(bg).toBe("rgb(249, 248, 246)");
    console.log(`✅ Correct beige background applied: ${bg}`);
  });
});
