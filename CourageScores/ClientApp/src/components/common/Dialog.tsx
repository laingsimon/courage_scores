import React from 'react';
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IDialogProps {
    children: React.ReactNode;
    onClose?(): UntypedPromise;
    title?: string;
    slim?: boolean;
    className?: string;
    contentWidth?: boolean;
    fullScreen?: boolean;
}

export function Dialog({children, onClose, title, slim, className, contentWidth, fullScreen}: IDialogProps) {
    return (<div className="text-start">
        <div className={`modal fade show text-black ${className || ''}`} role="dialog" style={{display: 'block'}}>
            <div className={`modal-dialog${fullScreen ? ' position-static' : ' modal-dialog-centered'}${slim || fullScreen ? '' : 'modal-dialog-larger-max-width'}${contentWidth ? ' modal-sm' : ''}`}>
                <div className={`modal-content${fullScreen ? ' position-absolute top-0 bottom-0 left-0 right-0 border-0' : ''}`}>
                    {title ? (<div className="modal-header justify-content-center">
                        <h5>{title}</h5>
                    </div>) : null}
                    <div className={`modal-body${fullScreen ? ' p-0' : ''}`}>
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
