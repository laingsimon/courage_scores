import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";

export function Layout({divisions, appLoading, account, children, error, clearError, excludeSurround}) {
    function renderError() {
        return (<div className="light-background p-3">
            <h3>An error occurred</h3>
            <pre>{JSON.stringify(error.message)}</pre>
            <button className="btn btn-warning" onClick={() => clearError ? clearError() : null}>Clear error</button>
        </div>)
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
            {error ? renderError() : (<Container>
                {children}
            </Container>)}
        </div>
    );
}
