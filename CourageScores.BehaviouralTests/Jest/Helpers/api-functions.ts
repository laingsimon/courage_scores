import fetch from 'isomorphic-fetch';
import * as https from "node:https";
import {captureProcessOutput, startProcess} from "../../Helpers/process-functions";
import {ChildProcess} from "node:child_process";
import {MemoryStream} from "../../Helpers/memory-stream";

const apiBase = 'https://localhost:7247';

const allowSelfSignedCert = new https.Agent({
    rejectUnauthorized: false,
});

export async function apiFetch(relativeUrl: string, opts?: RequestInit): Promise<any> {
    return await fetch(
        `${apiBase}${relativeUrl}`,
        {
            ...opts,
            agent: allowSelfSignedCert
        });
}

export async function apiIsAccessible(throwIfUnavailable?: boolean): Promise<boolean> {
    try {
        await apiFetch('/api/Status');
        return true;
    } catch (e) {
        if (throwIfUnavailable) {
            throw e;
        }
        return false;
    }
}

export async function loginToSandboxAsAdmin(redirectUrl?: string) {
    await loginToSandbox('Admin', 'Admin', 'admin@sandbox.com', redirectUrl);
}

export async function loginToSandbox(name: string, givenName: string, emailAddress: string, redirectUrl?: string) {
    const loggedInResponse = await apiFetch(
        '/api/sandbox/sign-in',
        {
            method: 'POST',
            body: new URLSearchParams({
                name,
                givenName,
                emailAddress,
                redirectUrl,
            }),
            redirect: redirectUrl ? 'follow' : 'manual',
        });

    if (loggedInResponse.status >= 400) {
        const text = await loggedInResponse.text();
        const statusText = loggedInResponse.statusText;
        throw new Error(`Unable to login: ${loggedInResponse.status}- ${statusText}\n${text}`);
    }
}

export async function startSandbox(logOutput?: boolean, launchProfile: string = 'ApiOnly'): Promise<ChildProcess | undefined> {
    if (await apiIsAccessible()) {
        return;
    }

    const buildConfiguration = process.env.DOTNET_CLI_BUILD_CONFIGURATION || 'Debug';
    let proc = await startProcess(
        'dotnet',
        ['run', '--configuration', buildConfiguration, '--no-build', '--launch-profile', launchProfile, '--', 'CourageScores.Sandbox.dll'],
        '../../CourageScores.Sandbox',
    );

    if (logOutput) {
        const stdout = new MemoryStream();
        const stderr = new MemoryStream();
        stdout.onLineReceived = line => console.log(line);
        stderr.onLineReceived = err => console.log(err);

        proc = captureProcessOutput(proc, stdout, stderr);
    }

    return proc;
}
