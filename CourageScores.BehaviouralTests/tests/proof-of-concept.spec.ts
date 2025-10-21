import {test, expect} from '@playwright/test';
import {ensureLoggedIn} from "../Helpers/session";
import {ensureSeasonExists, selectSeason} from "../Helpers/seasons";
import {ensureDivisionExists} from "../Helpers/divisions";
import {waitForLoadingToFinish} from "../Helpers/app";

test.describe('proof of concept', () => {
    test('can login', async ({page}) => {
        await page.goto('/');
        await ensureLoggedIn(page);
        await ensureLoggedIn(page, { name: 'Simon', givenName: 'Simon', emailAddress: 'simon@sandbox.com' }); // another user

        await expect(page.getByText('Logout (Simon)')).toBeVisible();
    });

    test('can add a season', async ({page}) => {
        await page.goto('/');
        await ensureLoggedIn(page);
        await page.goto('/teams');

        await ensureDivisionExists(page, 'Division One');
        await ensureSeasonExists(page, 'Summer Season', ['Division One']);

        await selectSeason(page, 'Summer Season');
        await waitForLoadingToFinish(page);
        await expect(page.locator('ul.nav-tabs')).toBeVisible();
        const divisionTabs = page.locator('ul.nav-tabs li');
        expect(await divisionTabs.allTextContents()).toEqual(['Teams', 'Fixtures', 'Players', 'Reports', 'Health']);
    });
});
