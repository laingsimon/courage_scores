class Settings {
    _apiHost;
    _invalidCacheOnNextRequest;

    get apiHost() {
        if (!this._apiHost) {
            this._apiHost = document.location.hostname === 'localhost'
                ? 'https://localhost:7247'
                : document.location.origin + '/data';
        }

        return this._apiHost;
    }

    get invalidateCacheOnNextRequest() {
        if (this._invalidCacheOnNextRequest) {
            this._invalidCacheOnNextRequest = false;
            return true;
        }

        return false;
    }

    set invalidateCacheOnNextRequest(value) {
        this._invalidCacheOnNextRequest = value;
    }
}

export { Settings };