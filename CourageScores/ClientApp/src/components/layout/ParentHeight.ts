export interface IParentHeight {
    setupInterval(frequency?: number): void;
    cancelInterval(): void;
    publishContentHeight(): void;
}

export interface IWindow {
    postMessage(msg: any, targetOrigin: string, transfer?: any): void;
}

export class ParentHeight implements IParentHeight {
    handle?: number;
    lastHeight?: number;
    getHeight : () => number;
    getParent : () => IWindow;
    extraHeight: number;

    constructor(extraHeight : number, getHeight?: () => number, getParent?: () => IWindow) {
        this.handle = null;
        this.lastHeight = null;
        this.extraHeight = extraHeight || 0;
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
        this.handle = null;
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