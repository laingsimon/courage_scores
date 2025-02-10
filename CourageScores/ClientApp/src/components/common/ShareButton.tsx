import {useLocation} from "react-router";
import {useState} from "react";
import {useBranding} from "./BrandingContainer";
import {LoadingSpinnerSmall} from "./LoadingSpinnerSmall";

export interface IShareButtonProps {
    title?: string;
    text?: string;
    getHash?(): Promise<string | undefined>;
    buttonText?: string;
}

export function ShareButton({title, text, getHash, buttonText}: IShareButtonProps) {
    const location = useLocation();
    const {name} = useBranding();
    const [gettingShareLink, setGettingShareLink] = useState<boolean>(false);

    async function share() {
        try {
            setGettingShareLink(true);
            const hash: string | undefined = getHash ? await getHash() : location.hash;
            if (hash === undefined && getHash) {
                return;
            }

            const shareData: ShareData = {
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
            ? (<LoadingSpinnerSmall/>)
            : null}
    </button>);
}