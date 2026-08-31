import { test, expect } from "@playwright/test";
import { clearGuestDraft, readEditorValue, waitForEditor } from "./helpers/variants-api";
import {
  appendEditorContent,
  expectNoValidationErrors,
  expectValidationErrorCount,
  expectValidationMessages,
  expectValidationPanelVisible,
  openSelectorEditor,
  openVariantEditor,
  reorderSelectorSections,
  reorderWorkExperienceItems,
  setEditorContent,
  VARIANT_FIELDS_APPENDED_TO_SELECTOR,
} from "./helpers/editor-validation";

test.describe("YAML validation in the browser", () => {
  test.beforeEach(async ({ page }) => {
    await clearGuestDraft(page);
    await page.goto("/en");
    await waitForEditor(page);
  });

  test("default variant and selector load without validation errors", async ({ page }) => {
    await expectNoValidationErrors(page);

    await openSelectorEditor(page);
    await expectNoValidationErrors(page);

    const selectorYaml = await readEditorValue(page);
    expect(selectorYaml).toContain('selector: "work_experience"');
    expect(selectorYaml).toContain("__selection_type: include");
  });

  test("flags variant fields accidentally pasted into the selector file", async ({ page }) => {
    await openSelectorEditor(page);
    await appendEditorContent(page, VARIANT_FIELDS_APPENDED_TO_SELECTOR);

    await expectValidationErrorCount(page, 7);
    await expectValidationMessages(page, ["Unknown field"]);
    await expect(page.getByTestId("validation-error-item").filter({ hasText: "Line 33" })).toBeVisible();
  });

  test("flags legacy per-section selection mode and type keys", async ({ page }) => {
    await openSelectorEditor(page);

    await setEditorContent(page, `__selection_type: include
sections:
  - type: summary
    __selection_type: include
  - selector: work_experience
    items:
      - instadeep
`);

    await expectValidationPanelVisible(page);
    await expectValidationMessages(page, [
      "__selection_type must be defined once at the file root, not on each section",
      "Sections must use selector, not type",
    ]);
  });

  test("flags a missing section selector with field required and unknown field", async ({ page }) => {
    await openSelectorEditor(page);

    const yaml = await readEditorValue(page);
    await setEditorContent(page, yaml.replace(
      '  - selector: "languages"',
      '  - typee: "languages"',
    ));

    await expectValidationPanelVisible(page);
    await expectValidationMessages(page, ["Field required", "Unknown field"]);
  });

  test("reordering selector sections keeps the file valid", async ({ page }) => {
    await openSelectorEditor(page);

    const original = await readEditorValue(page);
    const reordered = reorderSelectorSections(original);
    expect(reordered).not.toEqual(original);

    await setEditorContent(page, reordered);
    await expectNoValidationErrors(page);
  });

  test("reordering variant work experience items keeps the file valid", async ({ page }) => {
    await openVariantEditor(page);

    const original = await readEditorValue(page);
    const reordered = reorderWorkExperienceItems(original);
    expect(reordered).not.toEqual(original);

    await setEditorContent(page, reordered);
    await expectNoValidationErrors(page);
  });

  test("clears validation errors after fixing invalid selector content", async ({ page }) => {
    await openSelectorEditor(page);

    const validYaml = await readEditorValue(page);
    await appendEditorContent(page, VARIANT_FIELDS_APPENDED_TO_SELECTOR);
    await expectValidationPanelVisible(page);

    await setEditorContent(page, validYaml);
    await expectNoValidationErrors(page);
  });

  test("validation state is scoped to the active file when switching views", async ({ page }) => {
    await openSelectorEditor(page);
    await appendEditorContent(page, VARIANT_FIELDS_APPENDED_TO_SELECTOR);
    await expectValidationPanelVisible(page);

    await openVariantEditor(page);
    await expectNoValidationErrors(page);

    await openSelectorEditor(page);
    await expectValidationPanelVisible(page);
  });

  test("clicking a validation row focuses the matching editor line", async ({ page }) => {
    await openSelectorEditor(page);
    await appendEditorContent(page, "contact: []");

    await expectValidationPanelVisible(page);
    await page.getByTestId("validation-error-item").filter({ hasText: "Unknown field" }).first().click();

    const cursorLine = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()?.[0];
      return editor?.getPosition()?.lineNumber ?? 0;
    });

    expect(cursorLine).toBeGreaterThan(0);
  });
});
