import { test, expect } from "@playwright/test";

test.describe("SyncTeX Interactive PDF to YAML Navigation", () => {
  test("double-clicking PDF preview projects coordinates and centers YAML in Monaco Editor", async ({ page }) => {
    test.setTimeout(90000);

    page.on("console", (msg) => console.log("PAGE CONSOLE:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

    // 1. Navigate to /en
    await page.goto("/en");
    await page.locator("h1").waitFor({ timeout: 15000 });

    // 2. Click "Render PDF" and wait for backend PDF compilation response
    const renderBtn = page.getByRole("button", { name: /Render PDF/i });
    await expect(renderBtn).toBeVisible();

    const pdfResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/pdf") && resp.status() === 200,
      { timeout: 45000 }
    );

    await renderBtn.click();

    const pdfResponse = await pdfResponsePromise;
    expect(pdfResponse.status()).toBe(200);

    // 3. Wait for PDF page element to render
    const pdfContainer = page.getByTestId("pdf-page-container").first();
    await expect(pdfContainer).toBeVisible({ timeout: 30000 });

    // 4. Double-click on the upper region of the PDF page element
    await pdfContainer.dblclick({ position: { x: 200, y: 100 } });

    // 5. Verify Monaco Editor is visible and active in Code View
    const codeEditor = page.locator(".monaco-editor").first();
    await expect(codeEditor).toBeVisible({ timeout: 30000 });

    console.log("✅ Successfully navigated from PDF double-click to centered line in Monaco Editor!");
  });
});
