import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: 'https://localhost:44426',
        ignoreHTTPSErrors: true,

        trace: process.env.CI ? 'retain-on-failure' : 'on',
        video: process.env.CI ? 'retain-on-failure' : 'on',
    },
    timeout: 20_000,
    expect: {
        timeout: 5_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        /*{
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },*/

        /* Test against mobile viewports. */
        /*{
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },*/
    ],

    webServer: {
        command:
            'dotnet run --configuration Debug ' +
            (process.env.CI ? '' : '--no-build') +
            ' --launch-profile FullAppNoBrowser -- CourageScores.Sandbox.dll',
        env: {
            GoogleAuth_ClientId: 'anything',
            GoogleAuth_Secret: 'anything',
        },
        cwd: '../CourageScores.Sandbox',
        url: 'https://localhost:7247',
        ignoreHTTPSErrors: true,
        reuseExistingServer: true,
        timeout: 30_000,
        // stdout: 'pipe',
        // stderr: 'pipe',
    },
});
