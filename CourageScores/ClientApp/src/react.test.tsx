import fetch from 'isomorphic-fetch';
import { spawn } from 'child_process';

type Listener = Function;

describe('testing', () => {
    async function startProcess(cmd: string, args: string[], cwd?: string) {
        const proc = spawn(cmd, args, {
            cwd: cwd,
            env: {},
            stdio: 'pipe',
        });
        const stdout = new MemoryStream();
        const stderr = new MemoryStream();
        const processExit = new Promise((resolve) => {
            proc.on('close', (exitCode) => resolve(exitCode));
        });

        proc.stdout.pipe(stdout);
        proc.stderr.pipe(stderr);
        await processExit;

        return {
            exitCode: proc.exitCode,
            stdout: stdout.output,
            stderr: stderr.output,
        };
    }

    it('can make a http request', async () => {
        const response = await fetch(
            'https://courageleague.azurewebsites.net/data/api/Status',
        );
        const json = await response.json();
        expect(json.success).toEqual(true);
    });

    it('can launch a dotnet process and print its output', async () => {
        const sandboxDir = '../../CourageScores.Sandbox/bin/Debug/net9.0';
        const proc = await startProcess(
            'dotnet',
            ['CourageScores.Sandbox.dll'],
            sandboxDir,
        );

        console.log(proc.stdout);
    });

    class MemoryStream {
        public output: string = '';
        public writable = true;
        public listeners: () => Listener[] = () => [];
        public rawListeners: () => Listener[] = () => [];
        public eventNames: () => (string | symbol)[] = () => [];
        public listenerCount = () => 0;
        public onEnd?: Function;

        public write(data: string): boolean {
            const buffer = data as any as Buffer;
            let thisContent: string = buffer.toString();
            this.output += thisContent;
            return true;
        }

        public emit(): boolean {
            return true; // TODO: Not sure what to return here...
        }

        public end(): MemoryStream {
            if (this.onEnd) {
                this.onEnd();
            }
            return this;
        }

        public addListener(): MemoryStream {
            return this;
        }

        public on(): MemoryStream {
            return this;
        }

        public once(): MemoryStream {
            return this;
        }

        public removeListener(): MemoryStream {
            return this;
        }

        public off(): MemoryStream {
            return this;
        }

        public removeAllListeners(): MemoryStream {
            return this;
        }

        public setMaxListeners(): MemoryStream {
            return this;
        }

        public getMaxListeners(): number {
            return 0;
        }

        public prependListener(): MemoryStream {
            return this;
        }

        public prependOnceListener(): MemoryStream {
            return this;
        }
    }
});
