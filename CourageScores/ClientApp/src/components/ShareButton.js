import {useLocation} from "react-router-dom";

export function ShareButton({ title, text, getHash }) {
    const location = useLocation();

    async function share() {
        const hash = getHash ? await getHash() : location.hash;
        if (hash === null && getHash) {
            return;
        }

        const shareData = {
            text: text || 'Courage League',
            title: title || 'Courage League',
            url: location.pathname + location.search + hash
        };

        await navigator.share(shareData);
    }

    return (<button onClick={share} className="btn btn-sm btn-outline-primary d-print-none">🔗</button>);
}