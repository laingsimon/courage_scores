export class LiveWebSocket {
    constructor(socket) {
        this.socket = socket;
        this.updateHandler = (msg) => console.log(msg);
        this.errorHandler = (err) => console.error(err);
        socket.onmessage = this.handleMessage.bind(this);
    }

    send(data) {
        this.socket.send(data);
    }

    close() {
        this.socket.close();
    }

    handleMessage(messageEvent) {
        if (messageEvent.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(messageEvent)}`);
            return;
        }

        const jsonData = JSON.parse(messageEvent.data);
        switch (jsonData.type) {
            case 'Update': {
                this.updateHandler(jsonData.data);
                break;
            }
            case 'Marco': {
                // send back polo
                this.socket.send({
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
                    this.errorHandler(jsonData.message);
                }
                break;
            }
            default: {
                console.log(`Unhandled live message: ${messageEvent.data}`);
                break;
            }
        }
    }
}