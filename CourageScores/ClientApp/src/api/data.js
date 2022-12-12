class DataApi {
    constructor(http) {
        this.http = http;
    }

    export(request) {
        return this.http.post(`/api/Data/Export`, request);
    }
}

export { DataApi };