import { test, expect } from "@playwright/test";
import { clearGuestDraft, waitForEditor } from "./helpers/variants-api";

test.describe("Account settings dialog", () => {
  test.beforeEach(async ({ page }) => {
    await clearGuestDraft(page);
    await page.goto("/en");
    await waitForEditor(page);
  });

  async function openSettingsDialog(page: import("@playwright/test").Page) {
    await page.getByTestId("user-menu-trigger").click();
    await expect(page.getByTestId("user-menu-dropdown")).toBeVisible();
    await page.getByTestId("user-menu-profile-settings").click();
    await expect(page.getByTestId("settings-dialog")).toBeVisible();
  }

  test("user menu dropdown is visible below the avatar trigger", async ({ page }) => {
    const trigger = page.getByTestId("user-menu-trigger");
    await trigger.click();

    const dropdown = page.getByTestId("user-menu-dropdown");
    await expect(dropdown).toBeVisible();
    await expect(page.getByTestId("user-menu-profile-settings")).toBeVisible();

    const triggerBox = await trigger.boundingBox();
    const dropdownBox = await dropdown.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(dropdownBox).not.toBeNull();
    expect(dropdownBox!.y).toBeGreaterThan(triggerBox!.y);
  });

  test("opens from profile settings in the user menu", async ({ page }) => {
    await openSettingsDialog(page);

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Preferences & subscription")).toBeVisible();
    await expect(page.getByText("Subscription", { exact: true })).toBeVisible();
  });

  test("closes via the close button", async ({ page }) => {
    await openSettingsDialog(page);

    await page.getByTestId("settings-dialog-close").click();
    await expect(page.getByTestId("settings-dialog")).toHaveCount(0);
  });

  test("changing accent colour updates the app accent", async ({ page }) => {
    await openSettingsDialog(page);

    await page.getByTestId("accent-preset-4a8b7f").click();

    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()
    );
    expect(accent).toBe("#4A8B7F");
  });

  test("toggles AI always expanded preference", async ({ page }) => {
    await openSettingsDialog(page);

    const toggle = page.getByTestId("ai-always-expanded-toggle");
    await expect(toggle).not.toBeChecked();

    await page.getByText("Always expanded").click();
    await expect(toggle).toBeChecked();
  });
});
