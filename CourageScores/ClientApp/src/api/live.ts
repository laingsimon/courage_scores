class LiveApi {
    constructor(http) {
        this.http = http;
    }

    getAll() {
        return this.http.get(`/api/Live/Sockets`, {});
    }

    close(id) {
        return this.http.delete(`/api/Live/Socket/${id}`, {});
    }
}

export {LiveApi};
