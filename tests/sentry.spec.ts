import { test, expect } from "@playwright/test";

test.describe("Sentry / GlitchTip Error Reporting", () => {
  test("Axios interceptor captures error and displays UI error toast on 500 API failure", async ({ page }) => {
    const capturedConsoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[Error Captured]")) {
        capturedConsoleErrors.push(msg.text());
      }
    });

    // 1. Intercept /api/pdf specifically and mock a 500 Internal Server Error
    await page.route(/\/api\/pdf$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    // 2. Navigate to main UI
    await page.goto("/en");
    await page.locator("h1").waitFor();

    // 3. Click "Render PDF" to trigger the mock failure
    const renderBtn = page.getByRole("button", { name: /Render PDF/i });
    await expect(renderBtn).toBeVisible({ timeout: 20000 });
    await renderBtn.click();

    // 4. Verify the UI error toast displays the correct friendly message
    const errorToast = page.getByText("System Alert");
    await expect(errorToast).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("The server encountered a problem compiling your PDF. Please try again later.")
    ).toBeVisible();

    // 5. Verify that captureError was triggered by Axios interceptor
    expect(capturedConsoleErrors.length).toBeGreaterThan(0);

    console.log("✅ Verified Axios interceptor error capture on API failure!");
  });
});
