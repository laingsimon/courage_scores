import {round2dp} from "../../helpers/rendering";
import {stateChanged} from "../../helpers/events";
import React, {useState} from "react";
import {useApp} from "../common/AppContainer";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";

export interface IPlayerInputProps {
    home: string;
    away?: string;
    homeScore: number;
    awayScore?: number;
    on180?: (accumulatorName: string) => Promise<any>;
    onHiCheck: (accumulatorName: string, score: number) => Promise<any>;
    onChange: (leg: LegDto) => Promise<any>;
    onLegComplete: (accumulatorName: string) => Promise<any>;
    leg: LegDto;
    singlePlayer?: boolean;
}

export function PlayerInput({ home, away, homeScore, awayScore, on180, onHiCheck, onChange, onLegComplete, leg, singlePlayer }: IPlayerInputProps) {
    const [score, setScore] = useState('');
    const {onError} = useApp();
    const [focusEventHandle, setFocusEventHandle] = useState<number>(null);
    const accumulator: LegCompetitorScoreDto = leg.currentThrow ? leg[leg.currentThrow] : null;
    const remainingScore: number = accumulator ? leg.startingScore - accumulator.score : -1;
    const [savingInput, setSavingInput] = useState<boolean>(false);
    const playerLookup: { home: string, away: string } = {
        home: home,
        away: away
    }

    async function keyUp(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            if (savingInput) {
                return;
            }

            const singleDartScore: boolean = checkout && isSingleDartScore(intScore, true);
            const twoDartScore: boolean = checkout && isTwoDartScore(intScore);
            const threeDartScore: boolean = isThreeDartScore(intScore) && (hasRemainingDouble || checkout);
            let possibleOptions: number = (singleDartScore ? 1 : 0) + (twoDartScore ? 1 : 0) + (threeDartScore ? 1 : 0);
            if (possibleOptions > 1) {
                // require user to click if there are 2 or more possible options
                return false;
            }

            if (singleDartScore) {
                await addThrow(score, 1, true);
            } else if (twoDartScore) {
                await addThrow(score, 2, true);
            } else if (threeDartScore) {
                await addThrow(score, 3, true);
            }
            return false;
        }
    }

    function opposite(player: 'home' | 'away'): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    function createFocusEvent() {
        const handle = window.setTimeout(() => {
            const input = document.querySelector('input[data-score-input="true"]') as HTMLInputElement;
            if (input) {
                input.focus();
            }
            setFocusEventHandle(null);
        }, 300);
        setFocusEventHandle(handle);
    }

    async function addThrow(scoreInput: string, noOfDarts: number, setFocusEvent: boolean, bust?: boolean) {
        try {
            if (focusEventHandle) {
                window.clearTimeout(focusEventHandle);
                setFocusEventHandle(null);
            }

            const score = Number.parseInt(scoreInput);
            if (!Number.isFinite(score)) {
                return;
            }

            setSavingInput(true);
            const accumulatorName = leg.currentThrow as 'home' | 'away';
            const newLeg: LegDto = Object.assign({}, leg);
            const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
            accumulator.throws.push({
                score,
                noOfDarts,
                bust
            });

            accumulator.noOfDarts += noOfDarts;
            accumulator.bust = bust;

            const remainingScore: number = leg.startingScore - (accumulator.score + score);
            if ((remainingScore !== 0 && remainingScore <= 1) || (remainingScore === 0 && score % 2 !== 0 && noOfDarts === 1)) {
                accumulator.bust = true;
                // bust
            } else {
                if (!accumulator.bust) {
                    accumulator.score += score;
                }

                if (score === 180 && !accumulator.bust) {
                    // Assume these don't count if the score is bust, as it was by accident, not design
                    if (on180) {
                        await on180(accumulatorName);
                    }
                }

                if (accumulator.score === leg.startingScore && !accumulator.bust) {
                    // checked out
                    newLeg.winner = accumulatorName;

                    if (score >= 100) {
                        // hicheck
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

            if (setFocusEvent) {
                createFocusEvent();
            }
        }
    }

    function isSingleDartScore(value: number, doubleOnly?: boolean): boolean {
        if (value <= 0 || !Number.isFinite(value)) {
            return false;
        }

        if (doubleOnly) {
            return (value % 2 === 0 && value / 2 <= 20)
                || value === 50;
        }

        return value <= 20
            || (value % 2 === 0 && value / 2 <= 20)
            || (value % 3 === 0 && value / 3 <= 20)
            || value === 25
            || value === 50;
    }

    function isTwoDartScore(value: number): boolean {
        if (value <= 0 || !Number.isFinite(value)) {
            return false;
        }

        return value <= 120;
    }

    function isThreeDartScore(value: number): boolean {
        if (value < 0 || !Number.isFinite(value)) {
            return false;
        }

        return value <= 180;
    }

    const intScore: number = Number.parseInt(score);
    const checkout: boolean = intScore === remainingScore;
    const hasRemainingDouble: boolean = remainingScore - intScore >= 2;
    const canBeBust: boolean = score && remainingScore <= 180 && intScore >= 0;

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
        </p>) : null}
        <h4>
            <label>
                <span className="margin-right">
                    Score
                </span>
                <input data-score-input="true" autoFocus type="number" min="0" max="180"
                       className="no-spinner margin-right width-75 fs-1" value={score} onChange={stateChanged(setScore)}
                       onKeyUp={keyUp}/>
                {savingInput ? (<span
                    className="position-absolute spinner-border spinner-border-sm mt-3 top-50 opacity-50 margin-left text-secondary"
                    role="status"
                    aria-hidden="true"></span>) : null}
            </label>
        </h4>
        <p className="my-3">
            {!savingInput && checkout && isSingleDartScore(intScore, true)
                ? (<button className="btn btn-primary margin-right fs-3 border-1"
                           onClick={() => addThrow(score, 1, true, false)}>📌</button>)
                : null}
            {!savingInput && checkout && isTwoDartScore(intScore)
                ? (<button className="btn btn-primary margin-right fs-3"
                           onClick={() => addThrow(score, 2, true, false)}>📌📌</button>)
                : null}
            {!savingInput && isThreeDartScore(intScore) && (hasRemainingDouble || checkout)
                ? (<button className="btn btn-primary margin-right fs-3"
                           onClick={() => addThrow(score, 3, true, false)}>📌📌📌</button>)
                : null}
        </p>
        <p className="my-3">
            {!savingInput && isSingleDartScore(intScore) && !hasRemainingDouble && canBeBust
                ? (<button className="btn btn-warning margin-right fs-3"
                           onClick={() => addThrow(score, 1, true, true)}>💥</button>)
                : null}
            {!savingInput && isTwoDartScore(intScore) && !hasRemainingDouble && canBeBust
                ? (<button className="btn btn-warning margin-right fs-3"
                           onClick={() => addThrow(score, 2, true, true)}>💥💥</button>)
                : null}
            {!savingInput && isThreeDartScore(intScore) && !hasRemainingDouble && canBeBust
                ? (<button className="btn btn-warning margin-right fs-3"
                           onClick={() => addThrow(score, 3, true, true)}>💥💥💥</button>)
                : null}
        </p>
    </div>);
}
