export class ParentHeight {
    handle;
    lastHeight;
    getHeight;
    getParent;

    constructor(getHeight, getParent) {
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
        const msg = {
            height: this.getHeight(),
        };

        if (!this.lastHeight || this.lastHeight !== msg.height) {
            this.lastHeight = msg.height;
            this.getParent().postMessage(msg,'*');
        }
    }
}