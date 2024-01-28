import {ISettings} from "./settings";

export interface IHttp {
    get(relativeUrl: string): any;
    post(relativeUrl: string, content: any): any;
    patch(relativeUrl: string, content: any): any;
    delete(relativeUrl: string, content?: any): any;
    put(relativeUrl: string, content: any): any;
}

class Http implements IHttp {
    private settings: ISettings;
    constructor(settings: ISettings) {
        this.settings = settings;
    }

    get(relativeUrl: string) {
        return this.send('GET', relativeUrl, null);
    }

    post(relativeUrl: string, content: any) {
        return this.send('POST', relativeUrl, content);
    }

    patch(relativeUrl: string, content: any) {
        return this.send('PATCH', relativeUrl, content);
    }

    delete(relativeUrl: string, content?: any) {
        return this.send('DELETE', relativeUrl, content ? content : null);
    }

    put(relativeUrl: string, content: any) {
        return this.send('PUT', relativeUrl, content);
    }

    getPostHeaders() {
        const defaultHeaders: any = {
            'Content-Type': 'application/json'
        };

        if (this.settings.invalidateCacheOnNextRequest) {
            defaultHeaders['Cache-Control'] = 'no-cache';
        }

        return defaultHeaders;
    }

    getGetHeaders() {
        const defaultHeaders: any = {};

        if (this.settings.invalidateCacheOnNextRequest) {
            defaultHeaders['Cache-Control'] = 'no-cache';
        }

        return defaultHeaders;
    }

    async send(httpMethod: string, relativeUrl: string, content?: any) {
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
