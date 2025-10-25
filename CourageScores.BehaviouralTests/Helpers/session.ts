import {expect, Page} from "@playwright/test";

export interface User {
    name: string;
    givenName: string;
    emailAddress: string;
}

export const AdminUser: User = {
    name: 'Admin',
    givenName: 'Admin',
    emailAddress: 'admin@sandbox.com',
}

export async function ensureLoggedIn(page: Page, as: User = AdminUser): Promise<void> {
    const loginLogoutOption = page.locator('header nav ul li:last-child')
    const loginLogoutText = await loginLogoutOption.textContent();
    if (loginLogoutText.startsWith('Logout')) {
        // logged in, don't need to do anything
        if (loginLogoutText === `Logout (${as.givenName})`) {
            return;
        }

        // logged in as a different user, clicking logout so the expected user can be logged in
        await loginLogoutOption.locator('a').click();
    }

    const loginOption = loginLogoutOption.getByText('Login');
    await loginOption.click();
    await page.fill('input[name="name"]', as.name);
    await page.fill('input[name="givenName"]', as.givenName);
    await page.fill('input[name="emailAddress"]', as.emailAddress);
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    const logoutOption = loginLogoutOption.getByText(`Logout (${as.givenName})`);
    await expect(logoutOption).toBeVisible();
}
