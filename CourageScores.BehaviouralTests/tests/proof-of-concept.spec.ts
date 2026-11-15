import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../Helpers/session.ts';
import { ensureSeasonExists, selectSeason } from '../Helpers/seasons.ts';
import { ensureDivisionExists } from '../Helpers/divisions.ts';
import { waitForLoadingToFinish } from '../Helpers/app.ts';

test.describe('proof of concept', () => {
    const anotherUser = {
        name: 'Simon',
        givenName: 'Simon',
        emailAddress: 'simon@sandbox.com',
    };
    const expectedLeagueTabs = [
        'Teams',
        'Fixtures',
        'Players',
        'Reports',
        'Health',
    ];

    test('can login', async ({ page }) => {
        await page.goto('/');
        await ensureLoggedIn(page, anotherUser);

        await expect(
            page.getByText(`Logout (${anotherUser.givenName})`),
        ).toBeVisible();
    });

    test('can add a season', async ({ page }) => {
        const rng = (Math.random() * 10000).toFixed(0);
        const divisionName = `Division ${rng}`;
        const seasonName = `Season ${rng}`;

        await page.goto('/');
        await ensureLoggedIn(page);
        await page.goto('/teams');

        await ensureDivisionExists(page, divisionName);
        await ensureSeasonExists(page, seasonName, [divisionName]);

        await selectSeason(page, seasonName);
        await waitForLoadingToFinish(page);
        const tabsLocator = page.locator('ul.nav-tabs li');
        await expect(tabsLocator).toHaveCount(expectedLeagueTabs.length);
        let index = 0;
        for (const tab of expectedLeagueTabs) {
            await expect(tabsLocator.nth(index++)).toHaveText(tab);
        }
    });
});
