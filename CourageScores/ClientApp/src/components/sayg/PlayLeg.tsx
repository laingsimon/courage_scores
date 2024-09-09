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
    onLegComplete(accumulatorName: string, leg: LegDto): Promise<any>;
    on180(accumulatorName: string): Promise<any>;
    onHiCheck(accumulatorName: string, score: number): Promise<any>;
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
}

export interface IEditThrow {
    player: 'home' | 'away';
    throwIndex: number;
}

export function PlayLeg({leg, home, away, onChange, onLegComplete, on180, onHiCheck, homeScore, awayScore, singlePlayer}: IPlayLegProps) {
    const [savingInput, setSavingInput] = useState<boolean>(false);
    const [showCheckout, setShowCheckout] = useState<'home' | 'away'>(null);
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
                setShowCheckout(editScore.player);
            }
            return;
        }

        if (Number.isFinite(score) && score >= 0 && score <= 180) {
            await addThrow(score);

            if (score === remainingScore) {
                setShowCheckout(leg.currentThrow as 'home' | 'away');
            }
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

    async function addThrow(score: number) {
        try {
            setSavingInput(true);
            const accumulatorName = leg.currentThrow as 'home' | 'away';
            const newLeg: LegDto = Object.assign({}, leg);
            const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
            const remainingScore: number = leg.startingScore - (accumulator.score + score);
            const bust: boolean = remainingScore <= 1;

            accumulator.throws.push({
                score,
                noOfDarts: 3,
                bust,
            });

            accumulator.noOfDarts += 3;

            if (!bust) {
                accumulator.score += score;

                if (score === 180) {
                    // Assume these don't count if the score is bust, as it was by accident, not design
                    if (on180) {
                        await on180(accumulatorName);
                    }
                }
            }

            newLeg.currentThrow = singlePlayer
                ? newLeg.currentThrow
                : opposite(accumulatorName);
            await onChange(newLeg);

            setScore('');
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSavingInput(false);
        }
    }

    async function setLastThrowNoOfDarts(noOfDarts: number) {
        const accumulatorName: 'home' | 'away' = showCheckout;
        const newLeg: LegDto = Object.assign({}, leg);
        const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
        const lastThrow: LegThrowDto = accumulator.throws[accumulator.throws.length - 1];
        const lastScore: number = lastThrow.score;

        if (lastScore >= 100) {
            // hi-check
            if (onHiCheck) {
                await onHiCheck(accumulatorName, lastScore);
            }
        }

        lastThrow.noOfDarts = noOfDarts;
        lastThrow.bust = false;
        newLeg.winner = accumulatorName;
        // await onChange(newLeg); // NOTE: Intentionally omitted to reduce a save here, which is also triggered by onLegComplete()
        await onLegComplete(accumulatorName, newLeg);
        setShowCheckout(null);
    }

    async function cancelCheckout() {
        const accumulatorName: 'home' | 'away' = showCheckout;
        const newLeg: LegDto = Object.assign({}, leg);
        const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
        accumulator.throws.pop(); // remove the last throw
        accumulator.score = accumulator.throws.reduce((total: 0, thr: LegThrowDto) => total + (thr.bust ? 0 : thr.score), 0);
        newLeg.currentThrow = accumulatorName;

        await onChange(newLeg);
        setShowCheckout(null);
    }

    async function beginEditScore(request: IEditThrow, _: number) {
        setEditScore(request);
        setScore('');
    }

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
        {showCheckout ? (<Dialog onClose={cancelCheckout} title="Checkout">
            <div className="my-3" datatype="gameshot-buttons-score">
                <h6>How many darts to checkout?</h6>
                <div className="d-flex flex-row justify-content-stretch">
                    <button
                        disabled={savingInput}
                        className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                        onClick={async () => await setLastThrowNoOfDarts(1)}>
                        {CHECKOUT_1_DART}
                    </button>
                    <button
                        disabled={savingInput}
                        className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                        onClick={async () => await setLastThrowNoOfDarts(2)}>
                        {CHECKOUT_2_DART}
                    </button>
                    <button
                        disabled={savingInput}
                        className="btn btn-success margin-right fs-3 my-2 flex-grow-1"
                        onClick={async () => await setLastThrowNoOfDarts(3)}>
                        {CHECKOUT_3_DART}
                    </button>
                </div>
            </div>
        </Dialog>) : null}
    </div>);
}
