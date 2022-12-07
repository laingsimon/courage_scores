class TeamApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Team/${id}`, {});
    }

    getAll() {
        return this.http.get(`/api/Team`, {});
    }

    update(team) {
        return this.http.put(`/api/Team`, team);
    }

    delete(id, seasonId) {
        return this.http.delete(`/api/Team/${id}/${seasonId}`, {});
    }

    getForDivisionAndSeason(divisionId, seasonId) {
        return this.http.get(`/api/Team/${divisionId}/${seasonId}`, {});
    }
}

export { TeamApi };