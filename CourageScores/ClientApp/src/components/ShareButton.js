import {useLocation} from "react-router-dom";

export function ShareButton({ title, text }) {
    const location = useLocation();

    async function share() {
        const shareData = {
            text: text || 'Courage League',
            title: title || 'Courage League',
            url: location.pathname + location.search
        };

        await navigator.share(shareData);
    }

    return (<button onClick={share} className="btn btn-sm btn-outline-primary d-print-none">🔗</button>);
}