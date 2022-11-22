import React from 'react';

export function Dialog({ children, onClose, title }) {
    return (<div>
        <div className="modal fade show" role="dialog" style={{display: 'block'}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header justify-content-center">
                        <h5>{title}</h5>
                    </div>
                    <div className="modal-body">
                        {children}
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
