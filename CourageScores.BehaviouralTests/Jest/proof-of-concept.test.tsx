import { ChildProcess } from 'node:child_process';
import {
    killProcess,
    startProcess,
    waitForExit
} from "../Helpers/process-functions";
import {apiFetch, apiIsAccessible, loginToSandboxAsAdmin, startSandbox} from "./Helpers/api-functions";
import {retry} from "../Helpers/utility-functions";

describe('proof of concept', () => {
    let sandboxProc: ChildProcess | undefined = undefined;
    const logOutput = true;

    beforeAll(async () => {
        sandboxProc = await startSandbox(logOutput);
        await retry(async () => await apiIsAccessible(true), 5, 1_000, () => !sandboxProc);
    }, 10_000);

    afterAll(async () => {
        const proc = sandboxProc;
        sandboxProc = undefined;
        await killProcess(proc);
    });

    it('can make a http request', async () => {
        const response = await fetch(
            'https://courageleague.azurewebsites.net/data/api/Status',
        );
        const json = await response.json();
        expect(json.success).toEqual(true);
    });

    it('can launch a dotnet to get version', async () => {
        const proc = await startProcess(
            'dotnet',
            ['--version']
        );
        const exitCode = await waitForExit(proc);

        expect(exitCode).toEqual(0);
    });

    it('can launch a sandbox app and connect to api', async () => {
        const response = await apiFetch('/api/Status');
        const json = await response.json();
        expect(json.success).toEqual(true);
    });

    it('can login to the app', async () => {
        await loginToSandboxAsAdmin();
    });

    it('can add a season via the ui', async () => {
        /*
        * This requires mouting a react component from another app, which isn't available as a dependency
        * Jest doesn't like this when it is compiling the test
        *
        * Options:
        * 1. Try and add CourageScores/ClientApp as a dependency to the package.json
        * 2. Chalk this (running ui-tests-with-sandbox-api tests via jest) up as an experiment that ultimately cannot work - use Playwright instead
        * 3. Write these Jest-tests in the CourageScores/ClientApp directory
        * */

        /*
import {render} from "@testing-library/react";
import { MemoryRouter } from 'react-router';
import {App} from '../../CourageScores/ClientApp/src/App';

        // ...snip...

        await loginToSandboxAsAdmin();
        const currentPathAsInitialEntry: string = '/';

        render(<MemoryRouter initialEntries={[currentPathAsInitialEntry]}>
            <App />
        </MemoryRouter>);

        expect('not implemented').toEqual('implemented');*/
    });
});
