class GameApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Game/${id}`, {});
    }

    updateScores(id, scores) {
        return this.http.put(`/api/Scores/${id}`, scores);
    }
}

export { GameApi };