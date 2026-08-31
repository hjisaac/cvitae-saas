import { test, expect } from "@playwright/test";
import { clearGuestDraft, waitForEditor } from "./helpers/variants-api";

test.describe("Startup content", () => {
  test("loads with valid YAML and no validation errors from our defaults", async ({ page }) => {
    await clearGuestDraft(page);
    await page.goto("/en");
    await waitForEditor(page);

    await expect(page.getByText(/Validation Errors/i)).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator(".monaco-editor .squiggly-error")).toHaveCount(0);

    const editorValue = await page.evaluate(() => {
      const models = (window as any).monaco.editor.getModels();
      return models[0]?.getValue() ?? "";
    });

    expect(editorValue).toContain("name:");
    expect(editorValue).toContain("work_experience:");
    expect(editorValue).not.toContain("sections:");
  });

  test("ignores legacy guest drafts saved in localStorage", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cvitae:guest-draft", JSON.stringify({
        variantContent: "name: Legacy\nsections:\n  - type: work_experience\n    entries: []",
        selectorContent: "__selection_type: include\nsections:\n  - selector: summary",
        language: "en",
        updatedAt: "2020-01-01T00:00:00.000Z",
      }));
    });

    await page.goto("/en");
    await waitForEditor(page);

    await expect(page.getByText(/Validation Errors/i)).toHaveCount(0, { timeout: 15000 });

    const editorValue = await page.evaluate(() => {
      const models = (window as any).monaco.editor.getModels();
      return models[0]?.getValue() ?? "";
    });

    expect(editorValue).toContain("work_experience:");
    expect(editorValue).not.toContain("sections:");
  });
});
