class PlayerApi {
    constructor(http) {
        this.http = http;
    }

    create(teamId, player) {
        return this.http.post(`/api/Player/${teamId}`, player);
    }

    delete(teamId, playerId) {
        return this.http.delete(`/api/Player/${teamId}/${playerId}`, {});
    }

    update(teamId, playerId, player) {
        return this.http.patch(`/api/Player/${teamId}/${playerId}`, player);
    }
}

export { PlayerApi };