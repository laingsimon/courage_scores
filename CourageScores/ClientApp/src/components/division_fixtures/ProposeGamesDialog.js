import {Dialog} from "../common/Dialog";
import React from "react";
import {any, isEmpty, valueChanged} from "../../Utilities";

export function ProposeGamesDialog({ proposalSettings, onUpdateProposalSettings, proposalResponse, disabled, onPropose, onClose }) {
    let index = 0;

    function renderValidationErrors(errors) {
        return (<ol className="text-danger">
            {Object.keys(errors).map(key => {
                return (<li key={key}>{key} {errors[key].map(e => (<p key={index++}>{e}</p>))}</li>)
            })}
        </ol>)
    }

    async function updateNewExclusion(event) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        newProposalSettings.newExclusion[event.target.name] = event.target.value;

        if (onUpdateProposalSettings) {
            await onUpdateProposalSettings(newProposalSettings);
        }
    }

    async function addDateExclusion() {
        if (!proposalSettings.newExclusion.date) {
            window.alert('Enter a date first');
            return;
        }

        const newProposalSettings = Object.assign({}, proposalSettings);
        const newExclusion = newProposalSettings.newExclusion;
        newProposalSettings.newExclusion = { date: '' };
        newProposalSettings.excludedDates[newExclusion.date] = 'unspecified';

        if (onUpdateProposalSettings) {
            await onUpdateProposalSettings(newProposalSettings);
        }
    }

    async function removeDateExclusion(date) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        delete newProposalSettings.excludedDates[date];
        if (onUpdateProposalSettings) {
            await onUpdateProposalSettings(newProposalSettings);
        }
    }

    return (<div className="text-black"><Dialog title="Propose games...">
        <div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Number of legs</span>
                </div>
                <select disabled={disabled} value={proposalSettings.numberOfLegs} onChange={valueChanged(proposalSettings, onUpdateProposalSettings)} name="numberOfLegs">
                    <option value="1">Single leg</option>
                    <option value="2">Two legs</option>
                </select>
            </div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Day of week</span>
                </div>
                <select disabled={disabled} value={proposalSettings.weekDay} onChange={valueChanged(proposalSettings, onUpdateProposalSettings)} name="weekDay">
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                </select>
            </div>
            <div className="px-4">
                <h6>Excluded dates</h6>
                {Object.keys(proposalSettings.excludedDates).map(date => (<div key={date}>
                    <span className="margin-right">{new Date(date).toDateString()}</span>
                    <button disabled={disabled} className="btn btn-sm btn-danger" onClick={() => removeDateExclusion(date)}>🗑</button>
                </div>))}
                <div className="input-group my-2">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Date</span>
                    </div>
                    <input disabled={disabled} type="date" value={proposalSettings.newExclusion.date} name="date" onChange={updateNewExclusion} className="margin-right" />
                    <button disabled={disabled} className="btn btn-sm btn-primary" onClick={addDateExclusion}>+</button>
                </div>
            </div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Show</span>
                </div>
                <select disabled={disabled} name="logLevel" value={proposalSettings.logLevel} onChange={valueChanged(proposalSettings, onUpdateProposalSettings)}>
                    <option value="Information">Everything</option>
                    <option value="Warning">Warnings and Errors</option>
                    <option value="Error">Errors only</option>
                </select>
            </div>
        </div>
        {proposalResponse ? (<div className="overflow-auto max-scroll-height"><ul>
            {proposalResponse.errors && any(proposalResponse.errors) ? proposalResponse.errors.map(e => (<li key={index++} className="text-danger">{e}</li>)) : null}
            {proposalResponse.errors && isEmpty(proposalResponse.errors) ? (renderValidationErrors(proposalResponse.errors)): null}
            {proposalResponse.warnings ? proposalResponse.warnings.map(w => (<li key={index++} className="text-warning">{w}</li>)) : null}
            {proposalResponse.messages ? proposalResponse.messages.map(m => (<li key={index++} className="text-primary">{m}</li>)) : null}
        </ul></div>) : null}
        <div className="text-end">
            <button className="btn btn-success margin-right" onClick={onPropose}>
                {disabled ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎲'}
                Propose Games...
            </button>
            <button disabled={disabled} className="btn btn-primary margin-right" onClick={async () => { if (!disabled) { await onClose() } }}>Close</button>
        </div>
    </Dialog></div>)
}