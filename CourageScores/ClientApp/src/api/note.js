class NoteApi {
    constructor(http) {
        this.http = http;
    }

    get(seasonId) {
        return this.http.get(`/api/Note/${seasonId}`, {});
    }

    create(note) {
        return this.http.post(`/api/Note`, note);
    }

    upsert(id, note, lastUpdated) {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Note/${id}`, Object.assign({ lastUpdated }, note));
    }

    delete(id) {
        return this.http.delete(`/api/Note/${id}`, {});
    }
}

export { NoteApi };