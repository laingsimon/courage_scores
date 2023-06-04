class SaygApi {
    constructor(http) {
        this.http = http;
    }

    get(id) {
        return this.http.get(`/api/Game/Sayg/${id}`);
    }

    upsert(data, lastUpdated) {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.post(`/api/Game/Sayg`, Object.assign({ lastUpdated }, data));
    }

    delete(id) {
        return this.http.delete(`/api/Game/Sayg/${id}`);
    }
}

export { SaygApi };
