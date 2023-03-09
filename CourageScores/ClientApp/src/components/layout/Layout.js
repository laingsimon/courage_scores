import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../PageError";
import {useApp} from "../../AppContainer";

export function Layout({children, excludeSurround }) {
    const { error, onError } = useApp();

    function renderError() {
        return (<PageError error={error} />)
    }

    if (excludeSurround) {
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
            </div>
        );
    } catch (e) {
        onError(e);
    }
}
