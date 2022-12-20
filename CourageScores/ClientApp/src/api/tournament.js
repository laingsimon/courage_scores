class TournamentApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Tournament/${id}`, {});
    }

    update(tournament) {
        return this.http.put(`/api/Tournament`, tournament);
    }

    delete(id) {
        return this.http.delete(`/api/Tournament/${id}`, {});
    }
}

export { TournamentApi };