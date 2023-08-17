class SaygApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Game/Sayg/${id}`);
    }

    upsert(data) {
        return this.http.post(`/api/Game/Sayg`, data);
    }

    delete(id) {
        return this.http.delete(`/api/Game/Sayg/${id}`);
    }
}

export {SaygApi};
