import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../common/PageError";
import {useApp} from "../common/AppContainer";
import {Footer} from "./Footer";
import React from "react";
import {hasAccess} from "../../helpers/conditions";

export interface ILayoutProps {
    children?: React.ReactNode;
}

export function Layout({children}: ILayoutProps) {
    const {error, onError, embed, account, isFullScreen} = useApp();
    const hideHeaderAndFooter = isFullScreen || hasAccess(account, access => access.kioskMode);

    function renderError() {
        return (<PageError error={error!}/>)
    }

    if (embed) {
        return (<div>
            {error ? renderError() : (<div className="container">
                {children}
            </div>)}
        </div>);
    }

    try {
        return (
            <div>
                {hideHeaderAndFooter ? null : (<Heading/>)}
                <NavMenu/>
                {error ? renderError() : (<div className="full-screen-print-mode container">
                    {children}
                </div>)}
                {hideHeaderAndFooter ? null : (<Footer/>)}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}