import type { Page } from "@playwright/test";
import type { VariantDetail, VariantSummary } from "../../src/lib/api";

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const MOCK_VARIANT_SUMMARIES: VariantSummary[] = [
  {
    id: "variant-general",
    name: "general",
    template_id: null,
    language: "en",
    updated_at: TIMESTAMP,
  },
  {
    id: "variant-academic",
    name: "academic",
    template_id: null,
    language: "en",
    updated_at: TIMESTAMP,
  },
  {
    id: "variant-ml",
    name: "ml_engineer",
    template_id: null,
    language: "en",
    updated_at: TIMESTAMP,
  },
];

export const MOCK_VARIANT_DETAILS: Record<string, VariantDetail> = {
  "variant-general": {
    ...MOCK_VARIANT_SUMMARIES[0],
    content: "name: General Variant\ntitle: Software Engineer\ncontact: []\nwork_experience: []\npersonal_projects: []\neducation: []\npublications: []\nskills:\n  programming_languages: []\n  frameworks_and_libraries: []\n  infrastructure_and_tools: []\nlanguages:\n  english: Native\nreferees: []",
    created_at: TIMESTAMP,
    selector: {
      id: "selector-general",
      variant_id: "variant-general",
      content: "__selection_type: include\nsections:\n  - selector: summary",
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  },
  "variant-academic": {
    ...MOCK_VARIANT_SUMMARIES[1],
    content: "name: Academic Variant\ntitle: Academic Researcher\ncontact: []\nwork_experience: []\npersonal_projects: []\neducation: []\npublications: []\nskills:\n  programming_languages: []\n  frameworks_and_libraries: []\n  infrastructure_and_tools: []\nlanguages:\n  english: Native\nreferees: []",
    created_at: TIMESTAMP,
    selector: {
      id: "selector-academic",
      variant_id: "variant-academic",
      content: "__selection_type: include\nsections:\n  - selector: education",
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  },
  "variant-ml": {
    ...MOCK_VARIANT_SUMMARIES[2],
    content: "name: ML Engineer Variant\ntitle: Machine Learning Engineer\ncontact: []\nwork_experience: []\npersonal_projects: []\neducation: []\npublications: []\nskills:\n  programming_languages: []\n  frameworks_and_libraries: []\n  infrastructure_and_tools: []\nlanguages:\n  english: Native\nreferees: []",
    created_at: TIMESTAMP,
    selector: {
      id: "selector-ml",
      variant_id: "variant-ml",
      content: "__selection_type: include\nsections:\n  - selector: technologies",
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  },
};

export async function clearGuestDraft(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("cvitae:guest-draft");
    window.localStorage.removeItem("cvitae:guest-draft:v2");
    window.localStorage.removeItem("cvitae:guest-draft:v3");
    window.localStorage.removeItem("cvitae:guest-draft:v4");
  });
}

export async function mockVariantsApi(page: Page) {
  await page.route("**/api/variants", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VARIANT_SUMMARIES),
    });
  });

  await page.route("**/api/variants/*", async (route) => {
    const url = new URL(route.request().url());
    const variantId = url.pathname.split("/").pop() ?? "";
    const detail = MOCK_VARIANT_DETAILS[variantId];

    if (!detail) {
      await route.fulfill({ status: 404, body: JSON.stringify({ detail: "Variant not found" }) });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(detail),
    });
  });
}

export async function waitForEditor(page: Page) {
  await page.locator(".monaco-editor").waitFor({ state: "visible", timeout: 30000 });
}

export async function readEditorValue(page: Page): Promise<string> {
  return page.evaluate(() => {
    const models = (window as any).monaco.editor.getModels();
    return models[0]?.getValue() ?? "";
  });
}
