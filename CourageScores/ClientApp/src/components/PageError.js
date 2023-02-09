import React, {useState} from "react";

export function PageError({ error, clearError }){
    const [showStack, setShowStack] = useState(false);

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