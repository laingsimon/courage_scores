import {expect, Page} from "@playwright/test";

export async function waitForLoadingToFinish(page: Page) {
    await expect(page.locator('div.loading-background')).not.toBeVisible();
}
