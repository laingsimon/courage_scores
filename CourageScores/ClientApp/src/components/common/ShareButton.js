import {useLocation} from "react-router-dom";
import React, {useState} from "react";

export function ShareButton({ title, text, getHash, buttonText }) {
    const location = useLocation();
    const [ gettingShareLink, setGettingShareLink ] = useState(false);

    async function share() {
        try {
            setGettingShareLink(true);
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
        } finally {
            setGettingShareLink(false);
        }
    }

    return (<button onClick={share} className="btn btn-sm btn-outline-primary d-print-none">
        {!buttonText && gettingShareLink ? null : (buttonText || '🔗')}
        {gettingShareLink
            ? (<span className="spinner-border spinner-border-sm margin-left" role="status" aria-hidden="true"></span>)
            : null}
    </button>);
}