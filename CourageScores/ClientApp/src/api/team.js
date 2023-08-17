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

    update(team, lastUpdated) {
        if (team.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Team`, Object.assign({lastUpdated}, team));
    }

    delete(id, seasonId) {
        return this.http.delete(`/api/Team/${id}/${seasonId}`, {});
    }

    add(id, seasonId, copyPlayersFromSeasonId) {
        return this.http.put(`/api/Team/${id}/${seasonId}`, {
            id: id,
            seasonId: seasonId,
            copyPlayersFromSeasonId: copyPlayersFromSeasonId
        });
    }

    getForDivisionAndSeason(divisionId, seasonId) {
        return this.http.get(`/api/Team/${divisionId}/${seasonId}`, {});
    }
}

export {TeamApi};