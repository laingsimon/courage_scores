class TeamApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Team/${id}`, {});
    }

    update(team) {
        return this.http.put(`/api/Team`, team);
    }
}

export { TeamApi };