class ErrorApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Error/${id}`, {});
    }

    getRecent(since) {
        return this.http.get(`/api/Error/Since/${since}`, {});
    }

    add(error) {
        return this.http.put(`/api/Error`, error);
    }
}

export { ErrorApi };
