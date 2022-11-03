class DivisionApi {
    constructor(http) {
        this.http = http;
    }

    getAll() {
        return this.http.get(`/api/Division`, {});
    }

    get(id) {
        return this.http.get(`/api/Division/${id}`, {});
    }

    data(id) {
        return this.http.get(`/api/Division/${id}/Data`, {});
    }
}

export { DivisionApi };