class TemplateApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Template/${id}`, {});
    }

    delete(id) {
        return this.http.delete(`/api/Template/${id}`, {});
    }

    getAll() {
        return this.http.get(`/api/Template/`, {});
    }

    update(template) {
        return this.http.put(`/api/Template/`, template);
    }

    getCompatibility(seasonId) {
        return this.http.get(`/api/Template/ForSeason/${seasonId}`, {});
    }

    propose(request) {
        return this.http.post(`/api/Template/Propose/`, request);
    }
}

export {TemplateApi};
