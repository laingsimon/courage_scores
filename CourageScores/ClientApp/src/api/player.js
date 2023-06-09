class PlayerApi {
    constructor(http) {
        this.http = http;
    }

    create(seasonId, teamId, player) {
        return this.http.post(`/api/Player/${seasonId}/${teamId}`, player);
    }

    delete(seasonId, teamId, playerId) {
        return this.http.delete(`/api/Player/${seasonId}/${teamId}/${playerId}`, {});
    }

    update(seasonId, teamId, playerId, player, lastUpdated) {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.patch(`/api/Player/${seasonId}/${teamId}/${playerId}`, Object.assign({ lastUpdated }, player));
    }
}

export { PlayerApi };