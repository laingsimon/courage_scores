export interface ISettings {
    get apiHost(): string;
    get invalidateCacheOnNextRequest(): boolean;
    set invalidateCacheOnNextRequest(value: boolean);
}

export class Settings implements ISettings {
    _invalidCacheOnNextRequest?: boolean;
    _apiHost?: string;

    get apiHost(): string {
        if (!this._apiHost) {
            this._apiHost = document.location.hostname === 'localhost'
                ? 'https://localhost:7247'
                : document.location.origin + '/data';
        }

        return this._apiHost;
    }

    get invalidateCacheOnNextRequest(): boolean {
        if (this._invalidCacheOnNextRequest) {
            this._invalidCacheOnNextRequest = false;
            return true;
        }

        return false;
    }

    set invalidateCacheOnNextRequest(value: boolean) {
        this._invalidCacheOnNextRequest = value;
    }
}
