class SaygApi {
    constructor(http) {
        this.http = http;
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
}

export {SaygApi};
