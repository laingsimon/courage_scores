class TeamApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Team/${id}`, {});
    }
}

export { TeamApi };