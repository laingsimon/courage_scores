type Listener = Function;

export class MemoryStream {
    public output: string = '';
    public writable = true;
    public listeners: () => Listener[] = () => [];
    public rawListeners: () => Listener[] = () => [];
    public eventNames: () => (string | symbol)[] = () => [];
    public listenerCount = () => 0;
    public onEnd?: Function;
    public onLineReceived?: (line: string) => void;

    public write(data: string): boolean {
        const buffer = data as any as Buffer;
        let thisContent: string = buffer.toString();
        this.output += thisContent;
        if (this.onLineReceived) {
            this.onLineReceived(thisContent);
        }
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
