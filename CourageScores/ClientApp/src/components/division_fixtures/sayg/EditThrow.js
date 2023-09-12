import {Dialog} from "../../common/Dialog";
import React from "react";

export function EditThrow({ score, noOfDarts, competitor, index, bust, onClose, onChange, onSave }) {
    return (<Dialog title={`Edit throw ${index + 1} for ${competitor}`}>
        <div>
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Score</span>
                </div>
                <input className="form-control" type="number" min="0" max="180" value={score || ''} name="score" onChange={onChange}/>
            </div>
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">No of Darts</span>
                </div>
                <input className="form-control" type="number" min="1" max="3" value={noOfDarts || ''} name="noOfDarts" onChange={onChange}/>
            </div>
            <div className="form-check form-switch margin-right my-1">
                <input type="checkbox" className="form-check-input" checked={bust || false} name="bust"
                       id="bust"
                       onChange={onChange}/>
                <label className="form-check-label" htmlFor="bust">Bust?</label>
            </div>
        </div>
        <div className="modal-footer px-0 pb-0 mt-3">
            <div className="left-aligned mx-0">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
            <button className="btn btn-primary" onClick={onSave}>
                Save changes
            </button>
        </div>
    </Dialog>)
}