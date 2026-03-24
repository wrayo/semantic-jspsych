const { test, expect } = require("@playwright/test");

const advanceUntilSubjectSpecificTransition = async (page) => {
  const subjectHeading = page.getByRole("heading", { name: "Subject-Specific Categories" });
  const beginButton = page.getByRole("button", { name: "Begin" });

  for (let i = 0; i < 30; i += 1) {
    if (await subjectHeading.isVisible()) {
      return;
    }

    if (await beginButton.isVisible()) {
      await beginButton.click();
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Timed out before reaching the subject-specific transition screen.");
};

const advanceUntilFinished = async (page) => {
  const finishedHeading = page.getByRole("heading", { name: "Finished" });
  const beginButton = page.getByRole("button", { name: "Begin" });

  for (let i = 0; i < 80; i += 1) {
    if (await finishedHeading.isVisible()) {
      return;
    }

    if (await beginButton.isVisible()) {
      await beginButton.click();
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Timed out before reaching the final finished screen.");
};

test("semantic fluency task loads, records a response, and respects psychology ordering", async ({
  page,
}) => {
  await page.goto("/index.html?durationMs=1200&fadeMs=200&endHoldMs=50&countdownSec=1");

  await expect(page.getByRole("heading", { name: "Semantic Fluency Task" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.locator(".sf-countdown-number")).toHaveText("1");

  const firstGeneralCue = page.locator(".sf-cue");
  await expect(firstGeneralCue).toHaveText(/Animals|Fruits/);
  await expect(page.locator("#sf-timer")).toBeVisible();

  const input = page.locator("#sf-input");
  await input.fill("dog");
  await input.press("Enter");
  await expect(page.locator("#sf-count")).toHaveText("1");
  await expect(page.locator(".sf-chip")).toContainText("dog");
  await expect(page.locator(".sf-chip")).toHaveCount(0, { timeout: 3000 });

  await advanceUntilSubjectSpecificTransition(page);
  await expect(page.getByRole("heading", { name: "Subject-Specific Categories" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();
  await page.getByRole("button", { name: "Begin" }).click();

  const firstSubjectCue = page.locator(".sf-cue");
  await expect(firstSubjectCue).toHaveText("Psychology");
  await advanceUntilFinished(page);
  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page.getByRole("heading", { name: "Task complete" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(11);
});
