import {stateChanged} from "../../helpers/events";
import React from "react";
import {useApp} from "../common/AppContainer";
import {NumberKeyboard} from "../common/NumberKeyboard";

export interface IPlayerInputProps {
    savingInput?: boolean;
    score: string;
    setScore(score: string): Promise<any>;
    handleScore(score: string): Promise<any>;
    remainingScore: number;
}

export function PlayerInput({ savingInput, score, handleScore, setScore, remainingScore }: IPlayerInputProps) {
    const {browser} = useApp();

    async function keyUp(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key !== 'Enter') {
            return;
        }

        /* istanbul ignore next */
        if (savingInput) {
            /* istanbul ignore next */
            return;
        }

        await handleScore(score);
        return false;
    }

    const intScore: number = Number.parseInt(score);

    return (<div className="text-center">
        <h4>
            <label>
                <span className="margin-right">
                    Score
                </span>
                <input data-score-input="true" autoFocus type="number" min="0" max="180"
                       className="no-spinner margin-right width-75 fs-1" value={score} onChange={stateChanged(setScore)}
                       onKeyUp={keyUp} readOnly={browser.mobile}/>
                {savingInput ? (<span
                    className="position-absolute spinner-border spinner-border-sm mt-3 top-50 opacity-50 margin-left text-secondary"
                    role="status"
                    aria-hidden="true"></span>) : null}
            </label>
        </h4>
        <div className="d-flex flex-row justify-content-center">
            <div>
                <NumberKeyboard value={score} maxValue={180} onChange={async (score: string) => setScore(score)} onEnter={handleScore} />
            </div>
        </div>
        {Number.isFinite(intScore) && remainingScore - intScore >= 0 ? (
            <p>Remaining: {remainingScore - intScore}</p>) : <p>&nbsp;</p>}
    </div>);
}
