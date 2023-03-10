import React, {useEffect, useState} from "react";
import {useDependencies} from "../IocContainer";
import {useApp} from "../AppContainer";

export function PageError({ error }){
    const [ showStack, setShowStack ] = useState(false);
    const [ errorReported, setErrorReported ] = useState(false);
    const { errorApi } = useDependencies();
    const { clearError } = useApp();

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        reportClientSideException();
    },
    // eslint-disable-next-line
    [errorReported])

    async function reportClientSideException() {
        if (errorReported) {
            return; // server side exception
        }

        setErrorReported(true);

        const errorDetail = {
            source: "UI",
            time: new Date().toISOString(),
            message: error.message,
            stack: error.stack ? error.stack.split('\n') : null,
            type: null,
            userName: null,
            userAgent: Navigator.userAgent,
            url: window.location.href,
        };

        await errorApi.add(errorDetail);
    }

    return (<div className="light-background p-3">
        <h3 className="text-danger">An error occurred</h3>
        <p>
            <span className="fw-bold">{error.message || error}</span>
            <span className="form-switch margin-left">
                    <input className="form-check-input" type="checkbox" id="showStack" checked={showStack} onChange={event => setShowStack(event.target.checked)}/>
                    <label className="margin-left form-check-label" htmlFor="showStack">Show stack</label>
                </span>
        </p>
        {showStack && error.stack ? (<pre>{error.stack}</pre>) : null}
        <button className="btn btn-warning" onClick={clearError}>Clear error</button>
    </div>);
}
