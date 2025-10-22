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
});
