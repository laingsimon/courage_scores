import {spawn} from "child_process";
import {captureProcessOutput, waitForExit} from "./process-functions";
import * as os from "node:os";
import {MemoryStream} from "./memory-stream";

const dotnetLocatorProcess = os.type() === 'Windows_NT' ? 'where' : 'which';

export async function getPathToCmd(cmd: string) {
    if (cmd.indexOf('/') >= 0 || cmd.indexOf('\\') > 0) {
        return cmd;
    }

    const proc = spawn(dotnetLocatorProcess, [cmd], {
        stdio: 'pipe',
    });
    const stdout = new MemoryStream();
    await waitForExit(captureProcessOutput(proc, stdout));
    return stdout.output.trim().split('\n')[0].trim();
}
