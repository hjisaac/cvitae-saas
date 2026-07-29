import { test, expect } from "@playwright/test";

test.describe("Sentry / GlitchTip Error Reporting", () => {
  test("calls Sentry.captureException and displays UI error toast on 500 API failure", async ({ page }) => {
    // 1. Intercept window.Sentry before page loads to spy on captureException
    await page.addInitScript(() => {
      (window as any).sentryCapturedErrors = [];
      const mockSentry = {
        captureException: (err: any) => {
          (window as any).sentryCapturedErrors.push(err);
          console.log("Mock Sentry captured exception:", err);
          return "mock-event-id";
        },
        init: () => {},
        getClient: () => ({})
      };

      let actualSentry = mockSentry;
      Object.defineProperty(window, "Sentry", {
        get: () => actualSentry,
        set: (val) => {
          actualSentry = {
            ...val,
            captureException: (err: any) => {
              (window as any).sentryCapturedErrors.push(err);
              console.log("Mock Sentry captured exception (via SDK override):", err);
              if (typeof val.captureException === "function") {
                try {
                  val.captureException(err);
                } catch (e) {
                  // Ignore SDK internal failures if not fully configured
                }
              }
              return "mock-event-id";
            }
          };
        },
        configurable: true
      });
    });

    // 2. Intercept /api/pdf and mock a 500 Internal Server Error
    await page.route("**/api/pdf", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    // 3. Navigate to main UI
    await page.goto("/en");

    // 4. Click "Render PDF" to trigger the mock failure
    const renderBtn = page.getByRole("button", { name: /Render PDF/i });
    await expect(renderBtn).toBeVisible();
    await renderBtn.click();

    // 5. Verify the UI error toast displays the correct friendly message
    const errorToast = page.getByText("System Alert");
    await expect(errorToast).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("The server encountered a problem compiling your PDF. Please try again later.")
    ).toBeVisible();

    // 6. Verify that Sentry.captureException was called
    const capturedLength = await page.evaluate(() => (window as any).sentryCapturedErrors.length);
    expect(capturedLength).toBeGreaterThan(0);

    console.log("✅ Verified Sentry captureException is called on API failure!");
  });
});
