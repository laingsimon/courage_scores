import React, {useState} from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";

export function Layout({divisions, appLoading, account, children, error, clearError, excludeSurround}) {
    const [showStack, setShowStack] = useState(false);

    function renderError() {
        return (<div className="light-background p-3">
            <h3 className="text-danger">An error occurred</h3>
            <p>
                <span className="fw-bold">{error.message}</span>
                <span className="form-switch margin-left">
                    <input className="form-check-input" type="checkbox" id="showStack" checked={showStack} onChange={event => setShowStack(event.target.checked)}/>
                    <label className="margin-left form-check-label" htmlFor="showStack">Show stack</label>
                </span>
            </p>
            {showStack ? (<pre>{error.stack}</pre>) : null}
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
