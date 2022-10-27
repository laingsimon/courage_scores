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

    teams(id) {
        return this.http.get(`/api/Division/${id}/Teams`, {});
    }

    fixtures(id) {
        return this.http.get(`/api/Division/${id}/Fixtures`, {});
    }

    players(id) {
        return this.http.get(`/api/Division/${id}/Players`, {});
    }
}

export { DivisionApi };