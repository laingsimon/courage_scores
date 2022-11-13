class SeasonApi {
    constructor(http) {
        this.http = http;
    }

    update(season) {
        return this.http.put(`/api/Season`, season);
    }
}

export { SeasonApi };