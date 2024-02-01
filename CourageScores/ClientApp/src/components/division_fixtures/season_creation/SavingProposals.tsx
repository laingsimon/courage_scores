import {any} from "../../../helpers/collections";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";

export interface ISavingProposalsProps {
    saveMessage: string;
    noOfFixturesToSave: number;
    saveResults: IClientActionResultDto<GameDto>[];
    saving: boolean;
}

export function SavingProposals({ saveMessage, noOfFixturesToSave, saveResults, saving }: ISavingProposalsProps) {
    function renderError(e: string, i: number) {
        return (<li className="text-danger" key={i}>{e}</li>);
    }

    function renderWarning(w: string, i: number) {
        return (<li key={i}>{w}</li>);
    }

    function renderMessage(m: string, i: number) {
        return (<li className="text-secondary" key={i}>{m}</li>);
    }

    function getPercentageComplete(): string {
        const total: number = saveResults.length + noOfFixturesToSave;
        const complete: number = saveResults.length;
        const percentage: number = complete / total;

        return (percentage * 100).toFixed(2);
    }

    return (<div>
        {saving && noOfFixturesToSave > 0 ? (
            <LoadingSpinnerSmall/>) : null}
        {saveMessage}
        <div>{saveResults.length} fixtures of {saveResults.length + noOfFixturesToSave} saved</div>
        <div className="progress">
            <div className="progress-bar progress-bar-striped" style={{width: getPercentageComplete() + '%'}}
                 role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}></div>
        </div>
        {any(saveResults, (r: IClientActionResultDto<GameDto>) => !r.success) ? (<div className="overflow-auto max-height-250">
            {saveResults.filter((r: IClientActionResultDto<GameDto>) => !r.success).map((r: IClientActionResultDto<GameDto>, index: number) => (<div key={index}>
                {any(r.errors)
                    ? (<ol>{r.errors.map(renderError)}</ol>)
                    : null}
                {any(r.warnings)
                    ? (<ol>{r.warnings.map(renderWarning)}</ol>)
                    : null}
                {any(r.messages)
                    ? (<ol>{r.messages.map(renderMessage)}</ol>)
                    : null}
            </div>))}
        </div>) : null}
    </div>);
}