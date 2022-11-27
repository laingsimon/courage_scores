import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";

export function Layout({divisions, appLoading, account, children, error, clearError}) {
    function renderError() {
        return (<div className="light-background p-3">
            <h3>An error occurred</h3>
            <pre>{JSON.stringify(error.message)}</pre>
            <button className="btn btn-warning" onClick={() => clearError ? clearError() : null}>Clear error</button>
        </div>)
    }

    return (
        <div>
            <Heading />
            <NavMenu divisions={divisions} appLoading={appLoading} account={account} />
            {error ? renderError() : (<Container>
                {children}
            </Container>)}
        </div>
    );
}
