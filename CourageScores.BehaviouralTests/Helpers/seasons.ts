import { expect, Page } from '@playwright/test';
import { formatDate, today, tomorrow } from './dates';

export async function ensureSeasonExists(
    page: Page,
    name: string,
    forDivisions: string[],
) {
    const seasonDropdown = page.locator('[datatype="season-selector"]');
    await expect(seasonDropdown).toBeVisible();
    const openCloseButton = seasonDropdown.locator('button.dropdown-toggle');
    await openCloseButton.click();

    const seasons = await seasonDropdown
        .getByRole('menu')
        .locator('.dropdown-item')
        .all();
    const seasonNames = await Promise.all(
        seasons.map(async (season) =>
            getSeasonNameFromItem(await season.textContent()),
        ),
    );
    if (seasonNames.includes(name)) {
        // season exists, close the dropdown and continue
        await openCloseButton.click();
        return;
    }

    const newSeasonButton = seasonDropdown.getByText('➕ New season');
    await newSeasonButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="startDate"]', formatDate(today()));
    await page.fill('input[name="endDate"]', formatDate(tomorrow()));

    const divisionList = dialog.locator('ul');
    for (const divisionName of forDivisions) {
        await divisionList.getByText(divisionName).click();
    }

    await page.getByRole('button', { name: 'Create season' }).click();
    await expect(dialog).not.toBeVisible(); // season should have been created

    // confirm there wasn't an error
    await expect(page.getByText('An error occurred')).not.toBeVisible();
}

export async function selectSeason(page: Page, name: string) {
    const seasonDropdown = page.locator('[datatype="season-selector"]');
    await expect(seasonDropdown).toBeVisible();
    const openCloseButton = seasonDropdown.locator('button.dropdown-toggle');
    await openCloseButton.click();

    await seasonDropdown.getByText(name, { exact: false }).click();
}

function getSeasonNameFromItem(text: string | null): string {
    if (!text) {
        throw new Error('No name found for season');
    }

    const indexOfDate = text.lastIndexOf('(');
    return text.substring(0, indexOfDate - 1);
}
