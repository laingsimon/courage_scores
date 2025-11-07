import { expect, Page } from '@playwright/test';

export async function ensureDivisionExists(page: Page, name: string) {
    const divisionDropdown = page.locator('[datatype="division-selector"]');
    await expect(divisionDropdown).toBeVisible();
    const openCloseButton = divisionDropdown.locator('button.dropdown-toggle');
    await openCloseButton.click();

    const divisions = await divisionDropdown
        .getByRole('menu')
        .locator('.dropdown-item')
        .all();
    const divisionNames = await Promise.all(
        divisions.map(async (division) => await division.textContent()),
    );
    if (divisionNames.includes(name)) {
        // division exists, close the dropdown and continue
        await openCloseButton.click();
        return;
    }

    const newDivisionButton = divisionDropdown.getByText('➕ New division');
    await newDivisionButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.fill('input[name="name"]', name);
    await page.getByRole('button', { name: 'Create division' }).click();
    await expect(dialog).not.toBeVisible(); // division should have been created

    // confirm there wasn't an error
    await expect(page.getByText('An error occurred')).not.toBeVisible();
}
