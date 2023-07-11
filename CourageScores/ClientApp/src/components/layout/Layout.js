import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../common/PageError";
import {useApp} from "../../AppContainer";
import {Footer} from "./Footer";

export function Layout({ children }) {
    const { error, onError, embed } = useApp();

    function renderError() {
        return (<PageError error={error} />)
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
                <Heading/>
                <NavMenu />
                {error ? renderError() : (<Container className="full-screen-print-mode">
                    {children}
                </Container>)}
                <Footer />
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
