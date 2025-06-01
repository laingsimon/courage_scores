import {sum} from "../../helpers/collections";
import {PreviousPlayerScore} from "./PreviousPlayerScore";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {useEffect, useState} from "react";
import {useApp} from "../common/AppContainer";
import {Dialog} from "../common/Dialog";
import {CHECKOUT_1_DART, CHECKOUT_2_DART, CHECKOUT_3_DART} from "../../helpers/constants";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {isEmpty} from "../../helpers/collections";
import {useEditableSayg} from "./EditableSaygContainer";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {getScoreFromThrows} from "../../helpers/sayg";
import {isLegWinner} from "../../helpers/superleague";
import {usePreferences} from "../common/PreferencesContainer";
import {NumberKeyboard} from "../common/NumberKeyboard";
import {LegPlayerSequenceDto} from "../../interfaces/models/dtos/Game/Sayg/LegPlayerSequenceDto";

export interface IPlayLegProps {
    leg?: LegDto;
    home: string;
    away: string;
    onChange(newLeg: LegDto): UntypedPromise;
    onChangePrevious(newLeg: LegDto): UntypedPromise;
    onLegComplete(accumulatorName: string, leg: LegDto): UntypedPromise;
    on180?(accumulatorName: string): UntypedPromise;
    onHiCheck?(accumulatorName: string, score: number): UntypedPromise;
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    previousLeg?: LegDto;
    showFullNames?: boolean;
}

export function PlayLeg({leg, home, away, onChange, onLegComplete, on180, onHiCheck, homeScore, awayScore, singlePlayer, previousLeg, onChangePrevious, showFullNames}: IPlayLegProps) {
    const [savingInput, setSavingInput] = useState<boolean>(false);
    const [showCheckout, setShowCheckout] = useState<'home' | 'away' | null>(null);
    const [score, setScore] = useState<string>('');
    const {getPreference, upsertPreference} = usePreferences();
    const preferredStyle: string = getPreference<string>('sayg-style') || 'sayg-white';
    const [saygStyle, setSaygStyle] = useState<string>(preferredStyle);
    const {onError} = useApp();
    const {editScore, setEditScore} = useEditableSayg();
    const accumulator: LegCompetitorScoreDto = leg!.currentThrow ? leg![leg!.currentThrow] : null;
    const remainingScore: number = accumulator ? (leg!.startingScore || 0) - (accumulator.score || 0) : -1;
    const canEditPreviousCheckout: boolean = (!score && previousLeg && isEmpty(leg!.home.throws) && (singlePlayer || isEmpty(leg!.away.throws))) || false;
    const showWhoPlaysNextPrompt = !leg!.playerSequence || !leg!.currentThrow;
    const saygStyleOptions: IBootstrapDropdownItem[] = [
        { value: 'sayg-white', text: '🦺️ Black on white', collapsedText: '🦺️' },
        { value: 'sayg-black', text: '🦺️ White on black', collapsedText: '🦺️' },
    ];

    useEffect(() => {
        setScore('');
    }, [editScore]);

    async function changeSaygStyle(newStyle: string) {
        upsertPreference('sayg-style', newStyle);
        setSaygStyle(newStyle);
    }

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

        newLeg.playerSequence = [toLegPlayerSequence(firstPlayer), toLegPlayerSequence(secondPlayer)];
        newLeg.currentThrow = firstPlayer.value as string;
        await onChange(newLeg);
    }

    function toLegPlayerSequence(option: IBootstrapDropdownItem): LegPlayerSequenceDto {
        return {
            text: option.text as string,
            value: option.value as string,
        };
    }

    function opposite(player: 'home' | 'away'): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    async function handleScore(value: string) {
        const score: number = Number.parseInt(value);

        if (editScore) {
            const newPlayerScores: LegCompetitorScoreDto = await changeScore(score);
            const newRemainingScore: number = (leg!.startingScore || 0) - (newPlayerScores.score || 0);
            await setEditScore();

            if (newRemainingScore === 0) {
                setShowCheckout(editScore.player);
            }
            return;
        }

        if (Number.isFinite(score) && score >= 0 && score <= 180) {
            await addThrow(score);

            if (score === remainingScore) {
                setShowCheckout(leg!.currentThrow as 'home' | 'away');
            }
        }
    }

    async function changeScore(score: number): Promise<LegCompetitorScoreDto> {
        const newLeg: LegDto = Object.assign({}, leg);
        const playerThrows: LegCompetitorScoreDto = newLeg[editScore!.player];
        const thr: LegThrowDto = playerThrows.throws![editScore!.throwIndex];
        thr.score = score;
        playerThrows.score = getScoreFromThrows(newLeg.startingScore || 0, playerThrows.throws);

        await onChange(newLeg);
        setScore('');
        return playerThrows;
    }

    async function addThrow(score: number) {
        try {
            setSavingInput(true);
            const accumulatorName = leg!.currentThrow as 'home' | 'away';
            const newLeg: LegDto = Object.assign({}, leg);
            const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
            const remainingScore: number = (leg!.startingScore || 0) - ((accumulator.score || 0) + score);
            const bust: boolean = remainingScore <= 1;

            accumulator.throws!.push({
                score,
                noOfDarts: 3,
            });

            accumulator.noOfDarts! += 3;

            if (!bust) {
                accumulator.score! += score;

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
            setScore('');
            await onChange(newLeg);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSavingInput(false);
        }
    }

    async function setLastThrowNoOfDarts(noOfDarts: number) {
        const legToEdit = canEditPreviousCheckout ? previousLeg : leg;
        const accumulatorName: 'home' | 'away' = showCheckout!;
        const newLeg: LegDto = Object.assign({}, legToEdit);
        const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
        const lastThrow: LegThrowDto = accumulator.throws![accumulator.throws!.length - 1];
        const lastScore: number = lastThrow.score || 0;

        if (lastScore >= 100 && !canEditPreviousCheckout) {
            // hi-check
            if (onHiCheck) {
                await onHiCheck(accumulatorName, lastScore);
            }
        }

        lastThrow.noOfDarts = noOfDarts;
        accumulator.noOfDarts = sum(accumulator.throws, (thr: LegThrowDto) => thr.noOfDarts || 0);
        accumulator.score = getScoreFromThrows(leg?.startingScore || 0, accumulator.throws);
        if (canEditPreviousCheckout) {
            await onChangePrevious(newLeg);
        } else {
            await onLegComplete(accumulatorName, newLeg);
        }
        setShowCheckout(null);
    }

    async function cancelCheckout() {
        const accumulatorName: 'home' | 'away' = showCheckout!;
        const newLeg: LegDto = Object.assign({}, leg);
        const accumulator: LegCompetitorScoreDto = newLeg[accumulatorName];
        accumulator.throws!.pop(); // remove the last throw
        accumulator.score = getScoreFromThrows(newLeg.startingScore || 0, accumulator.throws);
        newLeg.currentThrow = accumulatorName;

        await onChange(newLeg);
        setShowCheckout(null);
    }

    function renderEditCheckoutDarts() {
        const previousLegWonByHome = isLegWinner(previousLeg!, 'home');
        const previousLegWonByAway = isLegWinner(previousLeg!, 'away');
        const previousWinner = previousLegWonByHome
            ? 'home'
            : (previousLegWonByAway ? 'away' : null);
        const winner: LegCompetitorScoreDto = previousLeg![previousWinner!];
        if (!winner || !winner.throws || isEmpty(winner.throws)) {
            return null;
        }
        const lastThrow: LegThrowDto = winner.throws[winner.throws.length - 1];

        return (<div datatype="change-checkout">
            <div className="alert alert-info text-center bottom-0 left-0 right-0">
                <div>
                    <b>{previousWinner === 'home' ? home : 'away'}</b> checked out <b>{lastThrow.score}</b> with <b>{lastThrow.noOfDarts}</b> dart/s.
                </div>
                <div className="text-center">
                    <button className="btn btn-primary" onClick={() => setShowCheckout(previousWinner)}>Change</button>
                </div>
            </div>
        </div>)
    }

    return (<div className={`position-relative ${saygStyle} d-flex flex-fill flex-column`}>
        <div className="position-absolute left-0 right-0 mt-2 ms-2">
            <BootstrapDropdown slim={true} options={saygStyleOptions} value={saygStyle} onChange={changeSaygStyle} className={`${saygStyle}-selector`} />
        </div>
        {showWhoPlaysNextPrompt ? (<div className="text-center" datatype="bull-up">
            {leg!.isLastLeg && homeScore === awayScore && homeScore > 0 ? (<p>Who won the bull?</p>) : (
                <p>Who plays first?</p>)}
            {playerOptions().map((op: IBootstrapDropdownItem) => (<button key={op.value} className="btn btn-primary margin-right"
                                                                          onClick={() => firstPlayerChanged(op.value as string)}>🎯<br/>{op.text}</button>))}
        </div>) : null}
        {!showWhoPlaysNextPrompt ? (<PreviousPlayerScore
            leg={leg!}
            homeScore={homeScore}
            awayScore={awayScore}
            singlePlayer={singlePlayer}
            home={home}
            away={away}
            currentScore={score ? Number.parseInt(score) : undefined}
            showFullNames={showFullNames}
        />) : null}
        {canEditPreviousCheckout && !showWhoPlaysNextPrompt ? renderEditCheckoutDarts() : null}
        {!showWhoPlaysNextPrompt ? (<div className={editScore ? ' bg-warning' : ''}>
            <NumberKeyboard
                value={score}
                maxValue={180}
                onChange={async (score: string) => setScore(score)}
                onEnter={handleScore}/>
        </div>) : null}
        {showCheckout ? (<Dialog onClose={cancelCheckout} title="Checkout">
            <div className="my-3 d-flex flex-column flex-grow-1" datatype="gameshot-buttons-score">
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