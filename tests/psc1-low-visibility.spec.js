const { test, expect } = require("@playwright/test");

test("low-visibility PSC 1 page exposes noindex and records entry timing", async ({ page }) => {
  await page.goto("/study/psc1-bd7h2q/?durationMs=1200&fadeMs=200&endHoldMs=50&countdownSec=1&demoDurationMs=800");

  const robotsMeta = page.locator('meta[name="robots"]');
  await expect(robotsMeta).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { name: "PSC 1 Brain Dump" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\bPsychology\b/);

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("body")).not.toContainText(/\bPsychology\b/);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("body")).not.toContainText(/\bPsychology\b/);
  await page.getByRole("button", { name: "Start Brain Dump" }).click();

  const input = page.locator("#sf-input");
  await input.fill("memory");
  await input.press("Enter");

  await expect(page.getByRole("heading", { name: "Brain Dump Complete" })).toBeVisible({ timeout: 4000 });
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Brain Dump Saved" })).toBeVisible();

  const stored = await page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((entry) => entry.indexOf("psc1-brain-dump:") === 0);
    return key ? JSON.parse(window.localStorage.getItem(key)) : null;
  });

  expect(stored).not.toBeNull();

  const trial = stored.data.find((entry) => entry.task === "semantic-fluency-list");
  expect(trial.response_count).toBe(1);
  expect(typeof trial.responses[0].rt_ms).toBe("number");
  expect(typeof trial.responses[0].inter_response_ms).toBe("number");
});
