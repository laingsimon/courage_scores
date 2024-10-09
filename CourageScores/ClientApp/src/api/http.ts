import {ISettings} from "./settings";
import {UntypedPromise} from "../interfaces/UntypedPromise";

export interface IHeaders {
    [name: string]: string;
}

export interface IHttp {
    get(relativeUrl: string, headers: IHeaders): UntypedPromise;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    post(relativeUrl: string, headers: IHeaders, content: any): UntypedPromise;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    patch(relativeUrl: string, headers: IHeaders, content: any): UntypedPromise;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete(relativeUrl: string, headers: IHeaders, content?: any): UntypedPromise;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    put(relativeUrl: string, headers: IHeaders, content: any): UntypedPromise;
}

/* istanbul ignore file */

class Http implements IHttp {
    private settings: ISettings;
    constructor(settings: ISettings) {
        this.settings = settings;
    }

    get(relativeUrl: string, headers: IHeaders) {
        return this.send('GET', headers, relativeUrl, null);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    post(relativeUrl: string, headers: IHeaders, content: any) {
        return this.send('POST', headers, relativeUrl, content);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    patch(relativeUrl: string, headers: IHeaders, content: any) {
        return this.send('PATCH', headers, relativeUrl, content);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete(relativeUrl: string, headers: IHeaders, content?: any) {
        return this.send('DELETE', headers, relativeUrl, content ? content : null);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    put(relativeUrl: string, headers: IHeaders, content: any) {
        return this.send('PUT', headers, relativeUrl, content);
    }

    getPostHeaders(headers: IHeaders): IHeaders {
        const defaultHeaders: IHeaders = {
            'Content-Type': 'application/json',
            'X-UI-Url': document.location.href,
        };
        const requestHeaders: IHeaders = Object.assign(defaultHeaders, headers);

        if (this.settings.invalidateCacheOnNextRequest) {
            requestHeaders['Cache-Control'] = 'no-cache';
        }

        return requestHeaders;
    }

    getGetHeaders(headers: IHeaders): IHeaders {
        const defaultHeaders: IHeaders = Object.assign({
            'X-UI-Url': document.location.href,
        }, headers);

        if (this.settings.invalidateCacheOnNextRequest) {
            defaultHeaders['Cache-Control'] = 'no-cache';
        }

        return defaultHeaders;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    async send(httpMethod: string, headers: IHeaders, relativeUrl: string, content?: any) {
        if (relativeUrl.indexOf('/') !== 0) {
            relativeUrl = '/' + relativeUrl;
        }

        const absoluteUrl = this.settings.apiHost + relativeUrl;

        if (content) {
            const response = await fetch(absoluteUrl, {
                method: httpMethod,
                mode: 'cors',
                body: JSON.stringify(content),
                headers: this.getPostHeaders(headers),
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
            headers: this.getGetHeaders(headers),
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
