class TournamentApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Tournament/${id}`, {});
    }

    update(tournament, lastUpdated) {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Tournament`, Object.assign({ lastUpdated }, tournament));
    }

    delete(id) {
        return this.http.delete(`/api/Tournament/${id}`, {});
    }
}

export { TournamentApi };