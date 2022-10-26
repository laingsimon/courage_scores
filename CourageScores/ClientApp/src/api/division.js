class Division {
    constructor(http) {
        this.http = http;
    }

    getAll() {
        return this.http.get(`/api/Division`, {});
    }
}

export { Division };