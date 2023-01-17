class NoteApi {
    constructor(http) {
        this.http = http;
    }

    get(seasonId) {
        return this.http.get(`/api/Note/${seasonId}`, {});
    }

    upsert(id, note) {
        if (id) {
            return this.http.put(`/api/Note/${id}`, note);
        } else {
            return this.http.post(`/api/Note`, note);
        }
    }

    delete(id) {
        return this.http.delete(`/api/Note/${id}`, {});
    }
}

export { NoteApi };