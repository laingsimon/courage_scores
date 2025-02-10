export interface IParentHeight {
    setupInterval(frequency?: number): void;
    cancelInterval(): void;
    publishContentHeight(): void;
}

export interface IWindow {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    postMessage(msg: any, targetOrigin: string, transfer?: any): void;
}

export class ParentHeight implements IParentHeight {
    handle?: number;
    lastHeight?: number;
    getHeight : () => number;
    getParent : () => IWindow;
    extraHeight: number;

    constructor(extraHeight : number, getHeight?: () => number, getParent?: () => IWindow) {
        this.handle = undefined;
        this.lastHeight = undefined;
        this.extraHeight = extraHeight;
        this.getHeight = getHeight || (() => document.body.scrollHeight);
        this.getParent = getParent || (() => window.parent);
    }

    setupInterval(frequency?: number): void {
        if (this.handle || !this.getParent()) {
            return;
        }

        this.handle = window.setInterval(this.publishContentHeight.bind(this), frequency || 250);
    }

    cancelInterval(): void {
        if (!this.handle) {
            return;
        }

        window.clearInterval(this.handle);
        this.handle = undefined;
    }

    publishContentHeight(): void {
        const height = this.getHeight();
        const msg = {
            height: height + this.extraHeight,
        };

        if (!this.lastHeight || this.lastHeight !== height) {
            this.lastHeight = height;
            this.getParent().postMessage(msg, '*');
        }
    }
}