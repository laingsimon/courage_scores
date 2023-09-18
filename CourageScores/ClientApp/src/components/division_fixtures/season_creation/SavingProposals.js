import {any} from "../../../helpers/collections";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import React from "react";

export function SavingProposals({ saveMessage, noOfFixturesToSave, saveResults, response, saving }) {
    function renderError(e, i) {
        return (<li className="text-danger" key={i}>{e}</li>);
    }

    function renderWarning(w, i) {
        return (<li key={i}>{w}</li>);
    }

    function renderMessage(m, i) {
        return (<li className="text-secondary" key={i}>{m}</li>);
    }

    function getPercentageComplete() {
        const total = saveResults.length + noOfFixturesToSave;
        const complete = saveResults.length;
        const percentage = complete / total;

        return percentage * 100;
    }

    return (<div>
        {saving && noOfFixturesToSave > 0 ? (
            <LoadingSpinnerSmall/>) : null}
        {saveMessage}
        <div>{saveResults.length} fixtures of {saveResults.length + noOfFixturesToSave} saved</div>
        <div className="progress">
            <div className="progress-bar progress-bar-striped" style={{width: getPercentageComplete() + '%'}}
                 role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        {any(saveResults, r => !r.success) ? (<div className="overflow-auto max-height-250">
            {saveResults.map((r, index) => (<div key={index}>
                {any(response.errors)
                    ? (<ol>{response.errors.map(renderError)}</ol>)
                    : null}
                {any(response.warnings) ? (
                    <ol>{response.warnings.map(renderWarning)}</ol>) : null}
                {any(response.messages)
                    ? (<ol>{response.messages.map(renderMessage)}</ol>)
                    : null}
            </div>))}
        </div>) : null}
    </div>);
}