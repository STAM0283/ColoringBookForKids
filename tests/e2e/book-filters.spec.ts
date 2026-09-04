import { test, expect } from "@playwright/test";

for (const locale of ["fr", "en"] as const) {
  test(`book activity-type filter and reset (${locale})`, async ({ page }) => {
    page.on("pageerror", error => console.error("Browser error:", error.message));
    page.on("console", message => { if (message.type() === "error") console.error("Browser console:", message.text()); });
    const path = locale === "fr" ? "/livres" : "/en/books";
    const typeLabel = locale === "fr" ? "Type d’activité" : "Activity type";
    await page.goto(`${path}?type=nonexistent-test-type&q=nonexistent-test-book&sort=oldest`);
    await expect(page.locator('input[name="type"]')).toHaveValue("nonexistent-test-type");
    await expect(page.getByRole("button", { name: new RegExp(typeLabel) })).toBeVisible();
    await page.getByRole("button", { name: locale === "fr" ? "Appliquer" : "Apply", exact: true }).click();
    await expect(page).toHaveURL(/type=nonexistent-test-type/);
    await expect(page).toHaveURL(/sort=oldest/);
    await page.getByRole("link", { name: locale === "fr" ? "Réinitialiser" : "Reset", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('input[name="type"]')).toHaveValue("");
    await expect(page.locator('input[name="q"]')).toHaveValue("");
    await page.getByRole("button", { name: new RegExp(typeLabel) }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.getByRole("option", { name: locale === "fr" ? "Tous les types" : "All types", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
