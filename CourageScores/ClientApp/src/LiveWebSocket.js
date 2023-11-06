import {any} from "./helpers/collections";

export class LiveWebSocket {
    socket;
    subscriptions;
    setSubscriptions;
    setSocket;
    createSocket;

    constructor({socket,
                subscriptions,
                setSubscriptions,
                setSocket,
                createSocket}) {
        this.socket = socket;
        this.subscriptions = subscriptions;
        this.setSubscriptions = setSubscriptions;
        this.setSocket = setSocket;
        this.createSocket = createSocket;
        if (this.socket) {
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
        }
    }

    async awaitStateChange() {
        if (this.socket.readyState === 1) {
            return;
        }

        return new Promise((resolve, reject) => {
            const handle = window.setInterval(() => {
                try {
                    if (this.socket.readyState === 0) {
                        // connecting...
                        return;
                    }

                    window.clearInterval(handle);
                    if (this.socket.readyState === 1) {
                        resolve(this);
                    } else {
                        const errorMessage = any(Object.keys(this.subscriptions))
                            ? 'Socket was closed'
                            : 'Socket did not connect';
                        this.closeSocket();
                        reject(errorMessage);
                    }
                } catch (e) {
                    console.error(e);
                    window.clearInterval(handle);
                    reject(e.message || 'Error waiting for socket to be ready');
                }
            }, 100);
        });
    }

    closeSocket() {
        if (this.socket) {
            this.socket.close();
            this.setSocket(null);
            this.setSubscriptions({});
        }
    }

    async __send(data) {
        if (!this.socket) {
            this.socket = this.createSocket();
            this.setSocket(this.socket);
        }

        await this.awaitStateChange();
        this.socket.send(JSON.stringify(data));
    }

    async publish(id, data) {
        await this.__send({
            type: 'update',
            id: id,
            data: data,
        });
    }

    unsubscribe(id) {
        if (!this.socket) {
            return;
        }

        const newSubscriptions = Object.assign({}, this.subscriptions);
        delete newSubscriptions[id];
        this.setSubscriptions(newSubscriptions);

        return this.__send({
            type: 'unsubscribed',
            id: id,
        }).then(() => {
            if (Object.keys(this.subscriptions).length === 0) {
                // when there are no subscriptions left, close the socket
                this.closeSocket();
            }
        });
    }

    subscribe(id, dataHandler, errorHandler) {
        if (this.subscriptions[id]) {
            console.log('WARN: Subscription is being replaced');
        }

        const newSubscriptions = Object.assign({}, this.subscriptions);
        newSubscriptions[id] = {
            id,
            updateHandler: dataHandler || ((msg) => console.log(msg)),
            errorHandler: errorHandler || ((err) => console.error(err)),
        };
        this.setSubscriptions(newSubscriptions);

        // noinspection JSIgnoredPromiseFromCall
        this.__send({
            type: 'subscribed',
            id: id,
        });
    }

    publishToSubscribers(id, data) {
        this.forEachSubscription(id, sub => sub.updateHandler(data));
    }

    alertSubscribers(id, error) {
        this.forEachSubscription(id, sub => sub.errorHandler(error));
    }

    forEachSubscription(id, handler) {
        if (id) {
            const subscription = this.subscriptions[id];
            if (subscription) {
                handler(subscription);
            }
            return;
        }

        for (let id in this.subscriptions) {
            const subscription = this.subscriptions[id];
            handler(subscription);
        }
    }

    async handleMessage(messageEvent) {
        if (messageEvent.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(messageEvent)}`);
            return;
        }

        const jsonData = JSON.parse(messageEvent.data);
        switch (jsonData.type) {
            case 'Update': {
                this.publishToSubscribers(jsonData.id, jsonData.data);
                break;
            }
            case 'Marco': {
                // send back polo
                await this.__send({
                    type: 'polo',
                });
                break;
            }
            case 'Polo': {
                // nothing to do
                break;
            }
            case 'Error': {
                console.error(jsonData);
                if (jsonData.message) {
                    this.alertSubscribers(jsonData.id, jsonData.message);
                }
                break;
            }
            default: {
                console.log(`Unhandled live message: ${messageEvent.data}`);
                break;
            }
        }
    }

    async handleClose() {
        console.error('Socket closed');
        this.setSocket(null);
    }
}