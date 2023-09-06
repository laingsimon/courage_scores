import React from 'react';
import {useDependencies} from "../../IocContainer";

/* istanbul ignore next */
export function NotPermitted() {
    const {settings} = useDependencies();

    function getAccountUrl(action) {
        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${document.location.href}`;
    }

    return (<div className="content-background p-3 text-danger">
        <h3>⛔</h3>
        You're not permitted to use this function
        <a className="btn btn-primary" href={`${getAccountUrl('Login')}`}>Login</a>
    </div>)
}