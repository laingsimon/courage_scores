class KnockoutApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Knockout/${id}`, {});
    }

    update(knockout) {
        return this.http.put(`/api/Knockout`, knockout);
    }

    delete(id) {
        return this.http.delete(`/api/Knockout/${id}`, {});
    }
}

export { KnockoutApi };