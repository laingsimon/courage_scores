class GameApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Game/${id}`, {});
    }

    updateScores(id, scores, lastUpdated) {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Scores/${id}`, Object.assign({ lastUpdated }, scores));
    }

    update(game, lastUpdated) {
        if (game.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Game`, Object.assign({ lastUpdated }, game));
    }

    delete(id) {
        return this.http.delete(`/api/Game/${id}`, {});
    }
}

export { GameApi };