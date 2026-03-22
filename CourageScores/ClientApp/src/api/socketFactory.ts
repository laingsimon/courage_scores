import { ISettings } from './settings';

/* istanbul ignore file */

function socketFactory(settings: ISettings): WebSocket {
    const relativeUrl = `/api/Live/`;
    const apiHost = settings.apiHost.replace('https://', 'wss://');
    const referrer = document.location.href;
    const referrerSansFragment = referrer.replace(/(#.+)?$/g, '');
    const absoluteUrl =
        apiHost + relativeUrl + '?referrer=' + referrerSansFragment;
    return new WebSocket(absoluteUrl);
}

export default socketFactory;
