import { test, expect } from "@playwright/test";

test.describe("PDF Rendering Pipeline", () => {
  test("submits PDF request and renders compiled PDF on frontend canvas", async ({ page }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore expected 404s like favicon
        if (!text.includes("404")) {
          consoleErrors.push(text);
        }
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`Page error: ${err.message}`);
    });

    // 1. Navigate to main UI
    await page.goto("/en");

    // 2. Click "Render PDF"
    const renderBtn = page.getByRole("button", { name: /Render PDF/i });
    await expect(renderBtn).toBeVisible();

    // Monitor network response for /api/pdf
    const pdfResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/pdf") && resp.status() === 200
    );

    await renderBtn.click();

    // 3. Verify backend returned 200 OK with application/pdf
    const pdfResponse = await pdfResponsePromise;
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");

    // 4. Verify react-pdf Document and Page elements render on the DOM
    try {
      const pdfDocument = page.locator(".react-pdf__Document");
      await expect(pdfDocument).toBeVisible({ timeout: 20000 });

      const pdfPage = page.locator(".react-pdf__Page").first();
      await expect(pdfPage).toBeVisible({ timeout: 20000 });
    } catch (e) {
      console.log("Console errors during test:", consoleErrors);
      throw e;
    }

    // 5. Ensure no unexpected console errors occurred
    expect(consoleErrors).toHaveLength(0);

    console.log("✅ PDF compilation and frontend rendering verified successfully!");
  });
});
