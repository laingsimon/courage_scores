class TournamentApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Tournament/${id}`, {});
    }

    update(tournament, lastUpdated) {
        if (tournament.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Tournament`, Object.assign({ lastUpdated }, tournament));
    }

    delete(id) {
        return this.http.delete(`/api/Tournament/${id}`, {});
    }

    patch(id, patch) {
        return this.http.patch(`/api/Tournament/${id}`, patch);
    }

    addSayg(id, matchId) {
        return this.http.post(`/api/Tournament/${id}`, { matchId });
    }
}

export { TournamentApi };