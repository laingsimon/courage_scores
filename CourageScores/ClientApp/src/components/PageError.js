import React, {useEffect, useState} from "react";
import {useApp} from "../AppContainer";

export function PageError({ error }){
    const [ showStack, setShowStack ] = useState(false);
    const [ errorReported, setErrorReported ] = useState(false);
    const { clearError, reportClientSideException, invalidateCacheAndTryAgain } = useApp();

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        doReportClientSideException();
    },
    // eslint-disable-next-line
    [errorReported])

    async function doReportClientSideException() {
        if (errorReported) {
            return; // server side exception
        }

        setErrorReported(true);

        await reportClientSideException(error);
    }

    return (<div className="content-background p-3">
        <h3 className="text-danger">An error occurred</h3>
        <p>
            <span className="fw-bold">{error.message || error}</span>
            {error.stack ? (<span className="form-switch margin-left">
                <input className="form-check-input" type="checkbox" id="showStack" checked={showStack} onChange={event => setShowStack(event.target.checked)}/>
                <label className="margin-left form-check-label" htmlFor="showStack">Show stack</label>
            </span>) : null}
        </p>
        {showStack && error.stack ? (<pre>{error.stack}</pre>) : null}
        <button className="btn btn-warning margin-right" onClick={clearError}>Clear error</button>
        <button className="btn btn-danger margin-right" onClick={invalidateCacheAndTryAgain}>Refresh data</button>
    </div>);
}
