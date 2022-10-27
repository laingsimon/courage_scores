class DivisionApi {
    constructor(http) {
        this.http = http;
    }

    getAll() {
        return this.http.get(`/api/Division`, {});
    }
}

export { DivisionApi };