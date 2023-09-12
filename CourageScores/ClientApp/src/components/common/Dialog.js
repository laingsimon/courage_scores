import React from 'react';

export function Dialog({children, onClose, title, slim, className, contentWidth}) {
    return (<div className="text-start">
        <div className={`modal fade show text-black ${className || ''}`} role="dialog" style={{display: 'block'}}>
            <div className={`modal-dialog modal-dialog-centered${slim ? '' : ' modal-dialog-larger-max-width'}${contentWidth ? ' modal-sm' : ''}`}>
                <div className={`modal-content`}>
                    {title ? (<div className="modal-header justify-content-center">
                        <h5>{title}</h5>
                    </div>) : null}
                    <div className="modal-body">
                        {children}
                    </div>
                    {onClose ? (<div className="modal-footer">
                        <div className="left-aligned">
                            <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>) : null}
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show"></div>
    </div>)
}
