import React from 'react';

export function Dialog({ children, onClose, title, slim, className }) {
    return (<div>
        <div className={`modal fade show text-black ${className || ''}`} role="dialog" style={{display: 'block'}}>
            <div className={`modal-dialog modal-dialog-centered${slim ? '' : ' modal-dialog-larger-max-width'}`}>
                <div className="modal-content">
                    <div className="modal-header justify-content-center">
                        <h5>{title}</h5>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                    {onClose ? (<div className="modal-footer">
                        <button className="btn btn-primary" onClick={async () => onClose ? await onClose() : null}>Close</button>
                    </div>) : null}
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show"></div>
    </div>)
}
