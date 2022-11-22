import React from 'react';

export function ErrorDisplay({ errors, messages, warnings, result, success, onClose, title }) {
    let index = 0;

    function renderValidationErrors(errors) {
        return (<ol className="text-danger">
            {Object.keys(errors).map(key => {
                return (<li key={key}>{key} {errors[key].map(e => (<p>{e}</p>))}</li>)
            })}
        </ol>)
    }

    return (<div>
        <div className="modal fade show" role="dialog" style={{display: 'block'}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header justify-content-center">
                        <h5>{title || 'There was an error'}</h5>
                    </div>
                    <div className="modal-body">
                        {errors && errors.length ? errors.map(e => (<p key={index++} className="text-danger">{e}</p>)) : null}
                        {errors && !errors.length ? (renderValidationErrors(errors)): null}
                        {warnings ? warnings.map(w => (<p key={index++} className="text-warning">{w}</p>)) : null}
                        {messages ? messages.map(m => (<p key={index++} className="text-primary">{m}</p>)) : null}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={() => onClose ? onClose() : null}>Close</button>
                    </div>
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show"></div>
    </div>)
}