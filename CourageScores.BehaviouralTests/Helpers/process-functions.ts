import {spawn} from "child_process";
import {ChildProcess, StdioPipe, StdioPipeNamed} from "node:child_process";
import {getPathToCmd} from "./dotnet-functions";
import * as fs from "node:fs";
import {MemoryStream} from "./memory-stream";

export async function waitForExit(proc: ChildProcess) {
    const processExit = new Promise((resolve) => {
        proc.on('close', (exitCode) => resolve(exitCode));
    });

    await processExit;

    return proc.exitCode;
}

export async function startProcess(cmd: string, args: string[], cwd?: string, stdio?: StdioPipeNamed | StdioPipe[]) {
    if (cwd && !fs.existsSync(cwd)) {
        throw new Error('Specified working directory does not exist: ' + cwd);
    }

    const pathToCmd = await getPathToCmd(cmd);
    return spawn(pathToCmd, args, {
        cwd: cwd,
        stdio: stdio ?? 'pipe',
    });
}

export async function killProcess(proc?: ChildProcess) {
    if (!proc) {
        return;
    }

    const processExit = new Promise((resolve) => {
        proc.on('close', (exitCode) => resolve(exitCode));
    });

    process.kill(proc.pid);

    await processExit;
}

export function captureProcessOutput(proc: ChildProcess, stdout?: MemoryStream, stderr?: MemoryStream) {
    stdout = stdout ?? new MemoryStream();
    stderr = stderr ?? new MemoryStream();

    proc.stdout.pipe(stdout);
    proc.stderr.pipe(stderr);

    return proc;
}
