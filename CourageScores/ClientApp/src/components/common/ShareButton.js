import {useLocation} from "react-router-dom";
import React, {useState} from "react";
import {useBranding} from "../../BrandingContainer";

export function ShareButton({ title, text, getHash, buttonText }) {
    const location = useLocation();
    const { name } = useBranding();
    const [ gettingShareLink, setGettingShareLink ] = useState(false);

    async function share() {
        try {
            setGettingShareLink(true);
            const hash = getHash ? await getHash() : location.hash;
            if (hash === null && getHash) {
                return;
            }

            const shareData = {
                text: text || name,
                title: title || name,
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