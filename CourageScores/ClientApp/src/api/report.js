class ReportApi {
    constructor(http) {
        this.http = http;
    }

    get(divisionId, seasonId) {
        return this.http.get(`/api/Report/${divisionId}/${seasonId}`, {});
    }
}

export { ReportApi };