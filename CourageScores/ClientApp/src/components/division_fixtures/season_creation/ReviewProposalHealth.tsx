import {any} from "../../../helpers/collections";
import {ViewHealthCheck} from "../../division_health/ViewHealthCheck";
import React from "react";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {IProposalResultDto} from "../../../interfaces/models/dtos/Season/Creation/IProposalResultDto";

export interface IReviewProposalHealthProps {
    response: IClientActionResultDto<IProposalResultDto>;
}

export function ReviewProposalHealth({ response }: IReviewProposalHealthProps) {
    function renderError(e: string, i: number) {
        return (<li className="text-danger" key={i}>{e}</li>);
    }

    function renderWarning(w: string, i: number) {
        return (<li key={i}>{w}</li>);
    }

    function renderMessage(m: string, i: number) {
        return (<li className="text-secondary" key={i}>{m}</li>);
    }

    return (<div>
        {response.success ? (<h4>✔ Fixtures have been proposed</h4>) : (
            <h4>⚠ There was an issue proposing fixtures</h4>)}
        <p>Press <kbd>Next</kbd> to review the fixtures in the divisions before saving</p>
        <div
            className={`overflow-auto max-height-250 alert mt-3 ${response.success ? 'alert-success' : 'alert-warning'}`}>
            {any(response.errors)
                ? (<ol>{response.errors.map(renderError)}</ol>)
                : null}
            {any(response.warnings)
                ? (<ol>{response.warnings.map(renderWarning)}</ol>)
                : null}
            {any(response.messages)
                ? (<ol>{response.messages.map(renderMessage)}</ol>)
                : null}
            {response.success ? (<ViewHealthCheck result={response.result.proposalHealth}/>) : null}
        </div>
    </div>);
}