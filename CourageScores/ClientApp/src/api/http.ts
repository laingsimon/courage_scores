class Http {
    constructor(settings) {
        this.settings = settings;
    }

    get(relativeUrl) {
        return this.send('GET', relativeUrl, null);
    }

    post(relativeUrl, content) {
        return this.send('POST', relativeUrl, content);
    }

    patch(relativeUrl, content) {
        return this.send('PATCH', relativeUrl, content);
    }

    delete(relativeUrl, content) {
        return this.send('DELETE', relativeUrl, content ? content : null);
    }

    put(relativeUrl, content) {
        return this.send('PUT', relativeUrl, content);
    }

    getPostHeaders() {
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (this.settings.invalidateCacheOnNextRequest) {
            defaultHeaders['Cache-Control'] = 'no-cache';
        }

        return defaultHeaders;
    }

    getGetHeaders() {
        const defaultHeaders = {};

        if (this.settings.invalidateCacheOnNextRequest) {
            defaultHeaders['Cache-Control'] = 'no-cache';
        }

        return defaultHeaders;
    }

    async send(httpMethod, relativeUrl, content) {
        if (relativeUrl.indexOf('/') !== 0) {
            relativeUrl = '/' + relativeUrl;
        }

        const absoluteUrl = this.settings.apiHost + relativeUrl;

        if (content) {
            const response = await fetch(absoluteUrl, {
                method: httpMethod,
                mode: 'cors',
                body: JSON.stringify(content),
                headers: this.getPostHeaders(),
                credentials: 'include'
            });

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        }

        const response = await fetch(absoluteUrl, {
            method: httpMethod,
            mode: 'cors',
            credentials: 'include',
            headers: this.getGetHeaders(),
        });

        if (response.status === 204) {
            return null;
        }

        if (response.status === 500) {
            throw new Error(await response.text());
        }

        return await response.json();
    }
}

export {Http};
