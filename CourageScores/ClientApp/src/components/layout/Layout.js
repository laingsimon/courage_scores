import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../PageError";

export function Layout({divisions, appLoading, account, children, error, clearError, excludeSurround}) {
    function renderError() {
        return (<PageError error={error} clearError={clearError} />)
    }

    if (excludeSurround) {
        return (<div>
            {error ? renderError() : (<Container>
                {children}
            </Container>)}
        </div>);
    }

    return (
        <div>
            <Heading />
            <NavMenu divisions={divisions} appLoading={appLoading} account={account} clearError={clearError} />
            {error ? renderError() : (<Container className="full-screen-print-mode">
                {children}
            </Container>)}
        </div>
    );
}
