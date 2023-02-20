import React, {useState} from "react";
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {ErrorApi} from "../../api/error";

export function PageError({ error, clearError }){
    const [ showStack, setShowStack ] = useState(false);
    const [ errorReported, setErrorReported ] = useState(false);
    const api = new ErrorApi(new Http(new Settings()));

    async function reportClientSideException() {
        if (Exception || errorReported) {
            return; // server side exception
        }

        setErrorReported(true);

        const error = {
            source: "UI",
            time: new Date().toUTCString(),
            message: error.message,
            stack: error.stack ? error.stack.split() : null,
            type: null,
            userName: null,
            userAgent: Navigator.userAgent
        };

        await api.save(error);
    }

    reportClientSideException();

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
    </div>);
}
