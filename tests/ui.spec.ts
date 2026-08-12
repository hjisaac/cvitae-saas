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

  test("frontend validation detects syntax errors and highlights them", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 20000 });

    // Set invalid YAML content
    await page.evaluate(() => {
      const models = (window as any).monaco.editor.getModels();
      if (models.length > 0) {
        models[0].setValue("invalid_yaml:\n  - incomplete: [\n  unbalanced: }");
      }
    });

    // Check if the validation errors panel appears
    const errorPanelHeader = page.getByText(/Validation Errors/i);
    await expect(errorPanelHeader).toBeVisible({ timeout: 15000 });
    console.log("✅ Live YAML syntax validation panel is verified!");
  });

  test("frontend validation flags unknown fields in contact items", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 20000 });

    await page.evaluate(() => {
      const models = (window as any).monaco.editor.getModels();
      if (models.length > 0) {
        const current = models[0].getValue();
        models[0].setValue(
          current.replace(
            'value: !t "Cape Town, South Africa"',
            'value: !t "Cape Town, South Africa"\n    ieie: i"i"',
          ),
        );
      }
    });

    const errorPanelHeader = page.getByText(/Validation Errors/i);
    await expect(errorPanelHeader).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Unknown field/i)).toBeVisible({ timeout: 10000 });
    console.log("✅ Unknown field validation is verified!");
  });

  test("frontend validation detects schema errors and highlights them", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 20000 });

    // Set invalid schema YAML content (contact must be array, but we pass string)
    await page.evaluate(() => {
      const models = (window as any).monaco.editor.getModels();
      if (models.length > 0) {
        models[0].setValue("name: 'Test'\ncontact: 'invalid_should_be_list'");
      }
    });

    // Check if the validation errors panel shows the error
    const errorPanelHeader = page.getByText(/Validation Errors/i);
    await expect(errorPanelHeader).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Input should be a valid list")).toBeVisible({ timeout: 10000 });
    console.log("✅ Live JSON schema validation panel is verified!");
  });

  test("switching to Form View renders form fields dynamically", async ({ page }) => {
    test.skip(true, "Form layout is out of scope for now");
    await page.goto("/en");
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 20000 });

    // Click "Form" toggle button (View Type switch)
    const formToggle = page.getByRole("button", { name: "Form" });
    await expect(formToggle).toBeVisible();
    await formToggle.click();

    // Check if dynamic form fields are rendered (such as inputs and fieldsets)
    const fieldset = page.locator(".rjsf-form-container fieldset").first();
    await expect(fieldset).toBeVisible({ timeout: 25000 });
    console.log("✅ Dynamic RJSF form is successfully rendered!");
  });
});
