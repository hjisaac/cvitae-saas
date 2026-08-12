import { test, expect } from "@playwright/test";
import {
  clearGuestDraft,
  readEditorValue,
  waitForEditor,
} from "./helpers/variants-api";

test.describe("Variant controls", () => {
  test.beforeEach(async ({ page }) => {
    await clearGuestDraft(page);
  });

  test("guest mode does not request account variants on load", async ({ page }) => {
    const variantRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/variants")) {
        variantRequests.push(request.url());
      }
    });

    await page.goto("/en");
    await waitForEditor(page);

    expect(variantRequests).toHaveLength(0);
  });

  test("guest variant combobox shows sign-in prompt", async ({ page }) => {
    await page.goto("/en");
    await waitForEditor(page);

    await expect(page.getByTestId("variant-selector-trigger")).toContainText("General");
    await expect(page.getByTestId("variant-selector-button")).toBeVisible();

    await page.getByTestId("variant-selector-trigger").click();
    await expect(page.getByTestId("variant-option-general")).toBeVisible();
    await expect(page.getByText("Sign in to manage multiple CV variants")).toBeVisible();
    await expect(page.getByTestId("variant-sign-in-button")).toBeVisible();

    await page.getByTestId("variant-sign-in-button").click();
    await expect(page.getByTestId("sign-in-dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByTestId("sign-in-with-google")).toBeVisible();
    await expect(page.getByTestId("sign-in-with-github")).toBeVisible();
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with GitHub")).toBeVisible();
    await expect(page.getByTestId("new-variant-name-input")).toHaveCount(0);

    const editorValue = await readEditorValue(page);
    expect(editorValue).toContain("Isaac Henri Joël Houngue");
    expect(editorValue).toContain("work_experience:");
  });

  test("show sections toggle switches between variant content and selector content", async ({ page }) => {
    await page.goto("/en");
    await waitForEditor(page);

    let editorValue = await readEditorValue(page);
    expect(editorValue).toContain("Isaac Henri Joël Houngue");

    await page.getByTestId("file-type-toggle").click();
    await expect(page.getByTestId("file-type-toggle")).toContainText("Show Content");

    editorValue = await readEditorValue(page);
    expect(editorValue).toContain("sections:");
    expect(editorValue).toContain('selector: "summary"');
    expect(editorValue).not.toContain("Isaac Henri Joël Houngue");

    await page.getByTestId("file-type-toggle").click();
    await expect(page.getByTestId("file-type-toggle")).toContainText("Show Sections");

    editorValue = await readEditorValue(page);
    expect(editorValue).toContain("Isaac Henri Joël Houngue");
    expect(editorValue).not.toContain("sections:");
  });
});
