import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../common/PageError";
import {useApp} from "../common/AppContainer";
import {Footer} from "./Footer";
import React from "react";

export interface ILayoutProps {
    children?: React.ReactNode;
}

export function Layout({children}: ILayoutProps) {
    const {error, onError, embed, account} = useApp();
    const hideHeaderAndFooter = account && account.access && account.access.kioskMode;

    function renderError() {
        return (<PageError error={error}/>)
    }

    if (embed) {
        return (<div>
            {error ? renderError() : (<Container>
                {children}
            </Container>)}
        </div>);
    }

    try {
        return (
            <div>
                {hideHeaderAndFooter ? null : (<Heading/>)}
                <NavMenu/>
                {error ? renderError() : (<Container className="full-screen-print-mode">
                    {children}
                </Container>)}
                {hideHeaderAndFooter ? null : (<Footer/>)}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
