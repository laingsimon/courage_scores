class SeasonApi {
    constructor(http) {
        this.http = http;
    }

    update(season) {
        return this.http.put(`/api/Season`, season);
    }

    delete(id) {
        return this.http.delete(`/api/Season/${id}`);
    }

    getAll() {
        return this.http.get(`/api/Season`, {});
    }

    propose(request) {
        return this.http.post(`/api/Season/ProposeGames`, request);
    }
}

export { SeasonApi };