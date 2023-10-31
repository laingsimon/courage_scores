class SaygApi {
    constructor(http) {
        this.http = http;
        this.socketLookup = {};
    }

    get(id) {
        return this.http.get(`/api/Sayg/${id}`);
    }

    upsert(data) {
        return this.http.post(`/api/Sayg`, data);
    }

    delete(id) {
        return this.http.delete(`/api/Sayg/${id}`);
    }

    async createSocket(id) {
        const relativeUrl = `/api/Sayg/${id}/live`;
        const apiHost = this.http.settings.apiHost.replace('https://', 'wss://');
        const absoluteUrl = apiHost + relativeUrl;

        if (!this.socketLookup[absoluteUrl] || this.socketLookup[absoluteUrl].readyState !== 1) {
            this.socketLookup[absoluteUrl] = new WebSocket(absoluteUrl);
        }
        const socket = this.socketLookup[absoluteUrl];
        return new Promise((resolve, reject) => {
            const handle = window.setInterval(function() {
                if (socket.readyState === 0) {
                    // connecting...
                    return;
                }

                window.clearInterval(handle);
                if (socket.readyState === 1) {
                    resolve(socket); // connected
                } else {
                    reject('Socket did not connect');
                }
            }, 100)
        });
    }
}

export {SaygApi};
