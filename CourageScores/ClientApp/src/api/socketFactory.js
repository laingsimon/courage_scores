function socketFactory(settings) {
    const relativeUrl = `/api/Live/`;
    const apiHost = settings.apiHost.replace('https://', 'wss://');
    const absoluteUrl = apiHost + relativeUrl;
    return new WebSocket(absoluteUrl);
}

export default socketFactory;
