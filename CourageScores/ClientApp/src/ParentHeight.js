export class ParentHeight {
    handle;
    lastHeight;
    getHeight;

    constructor(getHeight) {
        this.getHeight = getHeight || (() => document.body.scrollHeight);
    }

    setupInterval(frequency) {
        if (this.handle || !window.parent) {
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
            window.parent.postMessage(msg,'*');
        }
    }
}