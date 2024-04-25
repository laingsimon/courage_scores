import {round2dp} from "../../helpers/rendering";
import {stateChanged} from "../../helpers/events";
import React, {useState} from "react";
import {useApp} from "../common/AppContainer";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {NumberKeyboard} from "../common/NumberKeyboard";
import {CHECKOUT_1_DART, CHECKOUT_2_DART, CHECKOUT_3_DART} from "../../helpers/constants";
import {Dialog} from "../common/Dialog";

export interface IPlayerInputProps {
    home: string;
    away?: string;
    homeScore: number;
    awayScore?: number;
    on180(accumulatorName: string): Promise<any>;
    onHiCheck(accumulatorName: string, score: number): Promise<any>;
    onChange(leg: LegDto): Promise<any>;
    onLegComplete(accumulatorName: string): Promise<any>;
    leg: LegDto;
    singlePlayer?: boolean;
}

export function PlayerInput({ home, away, homeScore, awayScore, on180, onHiCheck, onChange, onLegComplete, leg, singlePlayer }: IPlayerInputProps) {
    const {browser} = useApp();
    const [score, setScore] = useState('');
    const {onError} = useApp();
    const accumulator: LegCompetitorScoreDto = leg.currentThrow ? leg[leg.currentThrow] : null;
    const remainingScore: number = accumulator ? leg.startingScore - accumulator.score : -1;
    const [savingInput, setSavingInput] = useState<boolean>(false);
    const playerLookup: { home: string, away: string } = {
        home: home,
        away: away
    }
    const [showCheckout, setShowCheckout] = useState(false);

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

    function opposite(player: 'home' | 'away'): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    async function addThrow(score: number, noOfDarts: number) {
        try {
            setSavingInput(true);
            setShowCheckout(false);
            const accumulatorName = leg.currentThrow as 'home' | 'away';
            const newLeg: LegDto = Object.assign({}, leg);
            const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
            const remainingScore: number = leg.startingScore - (accumulator.score + score);
            const bust: boolean = remainingScore === 1 || (remainingScore === 0 && score % 2 !== 0 && noOfDarts === 1);

            accumulator.throws.push({
                score,
                noOfDarts,
                bust,
            });

            accumulator.noOfDarts += noOfDarts;

            if (!bust) {
                accumulator.score += score;

                if (score === 180) {
                    // Assume these don't count if the score is bust, as it was by accident, not design
                    if (on180) {
                        await on180(accumulatorName);
                    }
                }

                if (accumulator.score === leg.startingScore) {
                    // checked out
                    newLeg.winner = accumulatorName;

                    if (score >= 100) {
                        // hi-check
                        if (onHiCheck) {
                            await onHiCheck(accumulatorName, score);
                        }
                    }
                }
            }

            newLeg.currentThrow = singlePlayer
                ? newLeg.currentThrow
                : opposite(accumulatorName);
            await onChange(newLeg);

            if (newLeg.winner) {
                await onLegComplete(accumulatorName);
            }

            setScore('');
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSavingInput(false);
        }
    }

    function isSingleDartScore(value: number): boolean {
        return (value % 2 === 0 && value / 2 <= 20)
            || value === 50;
    }

    function isTwoDartScore(value: number): boolean {
        return value <= 120;
    }

    function isThreeDartScore(value: number): boolean {
        return value <= 180;
    }

    async function handleScore(value: string) {
        const score: number = Number.parseInt(value);
        if (score === remainingScore) {
            setShowCheckout(true);
        }
        else if (Number.isFinite(score) && score >= 0 && score <= 180) {
            await addThrow(score, 3);
        }
    }

    const intScore: number = Number.parseInt(score);
    const checkout: boolean = intScore === remainingScore;
    const hasRemainingDouble: boolean = remainingScore - intScore >= 2;

    return (<div className="text-center">
        <h2>
            <strong>{playerLookup[leg.currentThrow]} </strong> requires <strong
            className="text-primary">{leg.startingScore - accumulator.score}</strong>
        </h2>
        {singlePlayer ? (<h5>Leg {homeScore + 1}</h5>) : (<h5>{homeScore} - {awayScore}</h5>)}
        {accumulator.noOfDarts ? (<p>
            thrown
            <strong> {accumulator.noOfDarts} </strong>
            darts, average: <strong>{round2dp(accumulator.score / (accumulator.noOfDarts / 3))}</strong>
        </p>) : <p>&nbsp;</p>}
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
            {showCheckout ? (<Dialog onClose={async () => setShowCheckout(false)} title="Checkout">
                <div className="my-3" datatype="gameshot-buttons-score">
                    <h6>How many darts to checkout?</h6>
                    <div className="d-flex flex-row justify-content-stretch">
                        <button
                            disabled={savingInput || !checkout || !isSingleDartScore(intScore)}
                            className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                            onClick={async () => await addThrow(intScore, 1)}>
                            {CHECKOUT_1_DART}
                        </button>
                        <button
                            disabled={savingInput || !checkout || !isTwoDartScore(intScore)}
                            className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                            onClick={async () => await addThrow(intScore, 2)}>
                            {CHECKOUT_2_DART}
                        </button>
                        <button
                            disabled={savingInput || !isThreeDartScore(intScore) || (!hasRemainingDouble && !checkout)}
                            className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                            onClick={async () => await addThrow(intScore, 3)}>
                            {CHECKOUT_3_DART}
                        </button>
                    </div>
                </div>
            </Dialog>) : null}
        </div>
        {Number.isFinite(intScore) && remainingScore - intScore >= 0 ? (
            <p>Remaining: {remainingScore - intScore}</p>) : <p>&nbsp;</p>}
    </div>);
}
