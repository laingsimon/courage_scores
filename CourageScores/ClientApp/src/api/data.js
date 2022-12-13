import {Settings} from "./settings";

class DataApi {
    constructor(http) {
        this.http = http;
    }

    export(request) {
        return this.http.post(`/api/Data/Export`, request);
    }

    async import(request, file) {
        const data = new FormData();
        data.append('Zip', file);
        const keys = Object.keys(request);
        keys.forEach(key => data.append(key, request[key]));

        const settings = new Settings();
        const absoluteUrl = settings.apiHost + `/api/Data/Import`;

        const response = await fetch(absoluteUrl, {
            method: 'POST',
            mode: 'cors',
            body: data,
            headers: { },
            credentials: 'include'
        });

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }
}

export { DataApi };