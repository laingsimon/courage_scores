import {Dialog} from "../common/Dialog";
import React from "react";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IEditThrowProps {
    score?: number;
    noOfDarts?: number;
    home: string;
    away?: string;
    competitor: 'home' | 'away';
    index: number;
    bust?: boolean;
    onClose(): UntypedPromise;
    onChange(event: React.ChangeEvent<HTMLInputElement>): UntypedPromise;
    onSave(): UntypedPromise;
}

export function EditThrow({ score, noOfDarts, home, away, competitor, index, bust, onClose, onChange, onSave }: IEditThrowProps) {
    const competitorName: { away: string; home: string } = {
        home,
        away,
    };

    return (<Dialog title={`Edit throw ${index + 1} for ${competitorName[competitor]}`} contentWidth={true} slim={true}>
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