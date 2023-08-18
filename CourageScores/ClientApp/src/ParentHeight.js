export class ParentHeight {
    handle;
    lastHeight;
    getHeight;
    getParent;
    extraHeight;

    constructor(extraHeight, getHeight, getParent) {
        this.extraHeight = extraHeight || 0;
        this.getHeight = getHeight || (() => document.body.scrollHeight);
        this.getParent = getParent || (() => window.parent);
    }

    setupInterval(frequency) {
        if (this.handle || !this.getParent()) {
            return;
        }

        this.handle = window.setInterval(this.publishContentHeight.bind(this), frequency || 250);
    }

    cancelInterval() {
        if (!this.handle) {
            return;
        }

        window.clearInterval(this.handle);
        this.handle = null;
    }

    publishContentHeight() {
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