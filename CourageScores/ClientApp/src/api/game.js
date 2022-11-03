class GameApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Game/${id}`, {});
    }
}

export { GameApi };