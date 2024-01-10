class ReportApi {
    constructor(http) {
        this.http = http;
    }

    getReport(request) {
        return this.http.post(`/api/Report`, request);
    }
}

export {ReportApi};
