import React from 'react';
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useLocation} from "react-router-dom";

export function NotPermitted() {
    const {settings} = useDependencies();
    const {account} = useApp();
    const location = useLocation();

    function getAccountUrl() {
        const redirectUrl = `${document.location.protocol}//${document.location.host}${location.pathname}`;
        return `${settings.apiHost}/api/Account/Login/?redirectUrl=${redirectUrl}`;
    }

    return (<div className="content-background p-3 text-danger">
        <h3>⛔</h3>
        You're not permitted to use this function<br />
        {account
            ? (<a className="btn btn-primary" href="/">Home</a>)
            : (<a className="btn btn-primary" href={`${getAccountUrl()}`}>Login</a>)}
    </div>)
}