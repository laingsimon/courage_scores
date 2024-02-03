import {ISettings} from "./settings";

/* istanbul ignore file */

function socketFactory(settings: ISettings): WebSocket {
    const relativeUrl = `/api/Live/`;
    const apiHost = settings.apiHost.replace('https://', 'wss://');
    const absoluteUrl = apiHost + relativeUrl + '?referrer=' + document.location.href;
    return new WebSocket(absoluteUrl);
}

export default socketFactory;
