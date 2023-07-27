class SeasonApi {
    constructor(http) {
        this.http = http;
    }

    update(season, lastUpdated) {
        if (season.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Season`, Object.assign({ lastUpdated }, season));
    }

    delete(id) {
        return this.http.delete(`/api/Season/${id}`);
    }

    getAll() {
        return this.http.get(`/api/Season`, {});
    }

    getHealth(id) {
        return this.http.get(`/api/Season/${id}/health`, {});
    }
}

export { SeasonApi };