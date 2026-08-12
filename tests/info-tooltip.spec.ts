import { test, expect } from "@playwright/test";
import { clearGuestDraft, waitForEditor } from "./helpers/variants-api";

test.describe("Native title tooltips", () => {
  test.beforeEach(async ({ page }) => {
    await clearGuestDraft(page);
  });

  test("variant selector exposes translated title in English", async ({ page }) => {
    await page.goto("/en");
    await waitForEditor(page);

    await expect(page.getByTestId("variant-selector-trigger")).toHaveAttribute(
      "title",
      /variants let you customize/i,
    );
  });

  test("variant selector exposes translated title in French", async ({ page }) => {
    await page.goto("/fr");
    await waitForEditor(page);

    await expect(page.getByTestId("variant-selector-trigger")).toHaveAttribute(
      "title",
      /Les variants vous permettent/i,
    );
  });
});
