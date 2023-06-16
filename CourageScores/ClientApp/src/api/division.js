class DivisionApi {
    constructor(http) {
        this.http = http;
    }

    getAll() {
        return this.http.get(`/api/Division`, {});
    }

    get(id) {
        return this.http.get(`/api/Division/${id}`, {});
    }

    data(divisionId, seasonId) {
        if (seasonId) {
            return this.http.get(`/api/Division/${divisionId}/${seasonId}/Data`, {});
        }

        return this.http.get(`/api/Division/${divisionId}/Data`, {});
    }

    update(details, lastUpdated) {
        if (details.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Division`, Object.assign({ lastUpdated }, details));
    }

    delete(id) {
        return this.http.delete(`/api/Division/${id}`);
    }
}

export { DivisionApi };