import {PlayerInput} from "./PlayerInput";
import {PreviousPlayerScore} from "./PreviousPlayerScore";
import {IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {useState} from "react";
import {useApp} from "../common/AppContainer";
import {Dialog} from "../common/Dialog";
import {CHECKOUT_1_DART, CHECKOUT_2_DART, CHECKOUT_3_DART} from "../../helpers/constants";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";

export interface IPlayLegProps {
    leg?: LegDto;
    home: string;
    away: string;
    onChange(newLeg: LegDto): Promise<any>;
    onLegComplete(accumulatorName: string): Promise<any>;
    on180(accumulatorName: string): Promise<any>;
    onHiCheck(accumulatorName: string, score: number): Promise<any>;
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
}

export interface IEditThrow {
    player: string;
    throwIndex: number;
}

export function PlayLeg({leg, home, away, onChange, onLegComplete, on180, onHiCheck, homeScore, awayScore, singlePlayer}: IPlayLegProps) {
    const [savingInput, setSavingInput] = useState<boolean>(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [score, setScore] = useState('');
    const [editScore, setEditScore] = useState<IEditThrow>(null);
    const {onError} = useApp();
    const accumulator: LegCompetitorScoreDto = leg.currentThrow ? leg[leg.currentThrow] : null;
    const remainingScore: number = accumulator ? leg.startingScore - accumulator.score : -1;

    function playerOptions(): IBootstrapDropdownItem[] {
        return [
            {value: 'home', text: home},
            {value: 'away', text: away},
        ];
    }

    async function firstPlayerChanged(firstPlayerName: string) {
        const newLeg: LegDto = Object.assign({}, leg);

        const players: IBootstrapDropdownItem[] = playerOptions();
        const firstPlayer: IBootstrapDropdownItem = players.filter(p => p.value === firstPlayerName)[0];
        const secondPlayer: IBootstrapDropdownItem = players.filter(p => p.value !== firstPlayerName)[0];

        newLeg.playerSequence = [firstPlayer, secondPlayer];
        newLeg.currentThrow = firstPlayer.value;
        await onChange(newLeg);
    }

    async function undoLastThrow() {
        const oppositePlayer: string = leg.currentThrow === 'home' ? 'away' : 'home';
        const newLeg: LegDto = Object.assign({}, leg);

        const removedThrow = newLeg[oppositePlayer].throws.pop();
        newLeg.currentThrow = oppositePlayer;
        newLeg[oppositePlayer].score -= removedThrow.score;
        newLeg[oppositePlayer].noOfDarts -= removedThrow.noOfDarts;

        await onChange(newLeg);
    }

    function opposite(player: 'home' | 'away'): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    async function handleScore(value: string) {
        const score: number = Number.parseInt(value);

        if (editScore) {
            const newPlayerScores: LegCompetitorScoreDto = await changeScore(score);
            const newRemainingScore: number = leg.startingScore - newPlayerScores.score;
            setEditScore(null);

            if (newRemainingScore === 0) {
                setShowCheckout(true);
            }
            return;
        }

        if (score === remainingScore) {
            setShowCheckout(true);
        }
        else if (Number.isFinite(score) && score >= 0 && score <= 180) {
            await addThrow(score, 3);
        }
    }

    async function changeScore(score: number): Promise<LegCompetitorScoreDto> {
        const newLeg: LegDto = Object.assign({}, leg);
        const playerThrows: LegCompetitorScoreDto = newLeg[editScore.player];
        const thr: LegThrowDto = playerThrows.throws[editScore.throwIndex];
        thr.score = score;
        playerThrows.score = playerThrows.throws.reduce((total, t) => total + t.score, 0);

        await onChange(newLeg);
        setScore('');
        return playerThrows;
    }

    async function addThrow(score: number, noOfDarts: number) {
        try {
            setSavingInput(true);
            setShowCheckout(false);
            const accumulatorName = leg.currentThrow as 'home' | 'away';
            const newLeg: LegDto = Object.assign({}, leg);
            const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
            const remainingScore: number = leg.startingScore - (accumulator.score + score);
            const bust: boolean = remainingScore < 0 || remainingScore === 1 || (remainingScore === 0 && score % 2 !== 0 && noOfDarts === 1);

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

    async function beginEditScore(request: IEditThrow, score: number) {
        setEditScore(request);
        setScore(score.toString());
    }

    if (!leg) {
        return (<div>No leg!</div>);
    }

    const intScore: number = Number.parseInt(score);
    const checkout: boolean = intScore === remainingScore;
    const hasRemainingDouble: boolean = remainingScore - intScore >= 2;

    return (<div>
        {leg.playerSequence && leg.currentThrow ? null : (<div className="text-center">
            {leg.isLastLeg && homeScore === awayScore && homeScore > 0 ? (<p>Who won the bull?</p>) : (
                <p>Who plays first?</p>)}
            {playerOptions().map((op: IBootstrapDropdownItem) => (<button key={op.value} className="btn btn-primary margin-right"
                                                                          onClick={() => firstPlayerChanged(op.value)}>🎯<br/>{op.text}</button>))}
        </div>)}
        {leg.playerSequence && leg.currentThrow ? (<PreviousPlayerScore
            leg={leg}
            homeScore={homeScore}
            awayScore={awayScore}
            singlePlayer={singlePlayer}
            undoLastThrow={undoLastThrow}
            showRemainingScore={true}
            setEditScore={beginEditScore}
            editScore={editScore}
            home={home}
            away={away}
        />) : null}
        {leg.playerSequence && leg.currentThrow ? (<PlayerInput
            score={score}
            setScore={async (v: string) => setScore(v)}
            handleScore={handleScore}
            savingInput={savingInput}
            remainingScore={remainingScore}
        />) : null}
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
    </div>);
}
