import { expect, type Page } from "@playwright/test";
import { readEditorValue, waitForEditor } from "./variants-api";

export async function setEditorContent(page: Page, content: string) {
  await page.evaluate((value) => {
    const models = (window as any).monaco.editor.getModels();
    models[0]?.setValue(value);
  }, content);
}

export async function appendEditorContent(page: Page, suffix: string) {
  const current = await readEditorValue(page);
  await setEditorContent(page, `${current.replace(/\s*$/, "")}\n${suffix}`);
}

export async function openSelectorEditor(page: Page) {
  await waitForEditor(page);
  const toggle = page.getByTestId("file-type-toggle");
  if ((await toggle.textContent())?.includes("Show Sections")) {
    await toggle.click();
  }
  await expect(toggle).toContainText("Show Content");
  await expect.poll(() => readEditorValue(page)).toContain("__selection_type:");
}

export async function openVariantEditor(page: Page) {
  await waitForEditor(page);
  const toggle = page.getByTestId("file-type-toggle");
  if ((await toggle.textContent())?.includes("Show Content")) {
    await toggle.click();
  }
  await expect(toggle).toContainText("Show Sections");
  await expect.poll(() => readEditorValue(page)).toContain("work_experience:");
}

export async function expectNoValidationErrors(page: Page) {
  await expect(page.getByTestId("validation-panel")).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator(".monaco-editor .squiggly-error")).toHaveCount(0, { timeout: 15000 });
}

export async function expectValidationPanelVisible(page: Page) {
  await expect(page.getByTestId("validation-panel")).toBeVisible({ timeout: 15000 });
}

export async function expectValidationErrorCount(page: Page, count: number) {
  await expectValidationPanelVisible(page);
  await expect(page.getByTestId("validation-error-count")).toHaveText(String(count), { timeout: 15000 });
}

export async function expectValidationMessages(page: Page, messages: string[]) {
  await expectValidationPanelVisible(page);
  for (const message of messages) {
    await expect(page.getByTestId("validation-error-item").filter({ hasText: message }).first()).toBeVisible({
      timeout: 15000,
    });
  }
}

export function reorderSelectorSections(yaml: string): string {
  const educationBlock = `  - selector: "education"
    items:
      - "aims_masters"
      - "imsp_masters"`;
  const publicationsBlock = `  - selector: "publications"
    items:
      - "aims_thesis"
      - "imsp_thesis"`;

  return yaml
    .replace(educationBlock, "__EDUCATION_PLACEHOLDER__")
    .replace(publicationsBlock, educationBlock)
    .replace("__EDUCATION_PLACEHOLDER__", publicationsBlock);
}

export function reorderWorkExperienceItems(yaml: string): string {
  const instadeepBlock = `  - selector: instadeep
    organization: "InstaDeep"`;
  const fasfoxBlock = `  - selector: fasfox_backend
    organization: "Fasfox"`;

  if (!yaml.includes(instadeepBlock) || !yaml.includes(fasfoxBlock)) {
    throw new Error("Expected default variant work experience entries for reorder test");
  }

  const workExperienceMatch = yaml.match(/work_experience:\n([\s\S]*?)(?=\n[a-z_]+:|$)/);
  if (!workExperienceMatch) {
    throw new Error("Could not locate work_experience block");
  }

  const block = workExperienceMatch[1];
  const reordered = block
    .replace(instadeepBlock, "__INSTADEEP__")
    .replace(fasfoxBlock, instadeepBlock)
    .replace("__INSTADEEP__", fasfoxBlock);

  return yaml.replace(block, reordered);
}

export const VARIANT_FIELDS_APPENDED_TO_SELECTOR = `contact: []
work_experience: []
personal_projects: []
education: []
skills: {}
languages: {}
referees: []`;
