const { test, expect } = require("@playwright/test");

test("psychology-only task runs a single Psychology cue and finishes cleanly", async ({
  page,
}) => {
  await page.goto("/psychology-only.html?durationMs=1200&fadeMs=200&endHoldMs=50&countdownSec=1");

  await expect(page.getByRole("heading", { name: "Semantic Fluency Task" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();
  await expect(page.getByText(/for demonstration only/i)).toBeVisible();
  const demoInput = page.locator("#sf-demo-input");
  await demoInput.click();
  await expect(demoInput).toBeFocused();
  await demoInput.fill("bus");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("#sf-demo-count")).toHaveText("1");
  await expect(page.locator("#sf-demo-flash-zone")).toContainText("bus");

  await demoInput.click();
  await expect(demoInput).toBeFocused();
  await demoInput.fill("train");
  await demoInput.press("Enter");
  await expect(page.locator("#sf-demo-count")).toHaveText("2");
  await expect(page.locator("#sf-demo-flash-zone")).toContainText(/bus|train/);

  await page.getByRole("button", { name: "Begin Experiment" }).click();
  await expect(page.locator(".sf-countdown-number")).toHaveText("1");
  await expect(page.locator(".sf-cue")).toHaveText("Psychology");

  const input = page.locator("#sf-input");
  await input.fill("memory");
  await input.press("Enter");
  await expect(page.locator("#sf-count")).toHaveText("1");

  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible({ timeout: 4000 });
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page.getByRole("heading", { name: "Task complete" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
