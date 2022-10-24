class Settings {
    get apiHost() {
        if (!this._apiHost) {
            this._apiHost = document.location.hostname === 'localhost'
                ? 'https://localhost:7247'
                : document.location.origin + '/data';
        }

        return this._apiHost;
    }
}

export { Settings };