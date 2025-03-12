import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";
import {useEffect} from "react";
import {IEditingThrow} from "./IEditingThrow";
import {useEditableSayg} from "./EditableSaygContainer";
import {useTournament} from "../tournaments/TournamentContainer";
import {useApp} from "../common/AppContainer";

export interface IPreviousPlayerScoreProps {
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    leg: LegDto;
    home: string;
    away: string;
    currentScore?: number;
}

interface IRunningScore {
    home: number;
    away: number;
}

export function PreviousPlayerScore({home, away, leg, homeScore, awayScore, singlePlayer, currentScore }: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws || [] : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws || [] : [];
    const {editScore, setEditScore} = useEditableSayg();
    const maxThrows: number = getMaxThrows(homeThrows, awayThrows);
    const {preventScroll} = useTournament();
    const {account, isFullScreen} = useApp();
    const largeScores = preventScroll || (account && account.access && account.access.kioskMode) || isFullScreen;

    useEffect(() => {
        window.setTimeout(scrollToLastScore, 10);
    },
    [maxThrows]);

    function getMaxThrows(homeThrows: LegThrowDto[], awayThrows: LegThrowDto[]) {
        const maxThrows: number = Math.max(homeThrows.length, awayThrows.length);
        if (maxThrows === homeThrows.length && (maxThrows === awayThrows.length || singlePlayer) && currentScore && !editScore) {
            return maxThrows + 1;
        }

        return maxThrows;
    }

    function scrollToLastScore() {
        const scrollableScores = document.querySelector('div[datatype="previous-scores"]');
        if (!scrollableScores) {
            return;
        }
        const previousScoreRows: HTMLDivElement[] = Array.from(scrollableScores.querySelectorAll('div'));
        const lastScore = previousScoreRows.pop();
        /* istanbul ignore next */
        if (lastScore && lastScore.scrollIntoView) {
            /* istanbul ignore next */
            lastScore.scrollIntoView();
        }
    }

    function renderPlayer(currentPlayer: string, score: number, className: string) {
        const suffix: string | null = leg.currentThrow === currentPlayer
            ? 'alert alert-info'
            : 'alert';
        return (<div className={`flex-basis-0 flex-grow-1 flex-shrink-1 ${className} ${suffix}`} datatype={currentPlayer === leg.currentThrow ? 'current-player' : ''}>
            <div className="overflow-hidden no-wrap d-block fs-4">{firstNameOnly(currentPlayer === 'home' ? home : away)}</div>
            <div className={`overflow-hidden no-wrap fw-bold ${largeScores ? 'super-size' : 'fs-4'}`}>{(leg.startingScore || 0) - score}</div>
        </div>);
    }

    function firstNameOnly(name: string): string {
        const names: string[] = name?.split(' ') || [];
        return names.length >= 1 ? names[0] : '';
    }

    function renderScoreBeingEdited(score: number | undefined, remaining: number, bust: boolean) {
        const bustSuffix: string = bust
            ? ' text-decoration-line-through'
            : '';

        return (<>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center bg-warning${bustSuffix}`} onClick={() => setEditScore()}>
                <span>{score}</span>
            </div>
            <div className="flex-basis-0 flex-grow-1 flex-shrink-0 text-center bg-warning" onClick={() => setEditScore()}>
                {remaining > 1 || remaining === 0 ? remaining : null}
            </div>
        </>);
    }

    function renderNewScore(score: number | undefined, remaining: number, bust: boolean) {
        const bustSuffix: string = bust
            ? ' text-decoration-line-through'
            : '';

        return (<>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center opacity-50 fst-italic${bustSuffix}`}>
                <span>{score}</span>
            </div>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center opacity-50 fst-italic`}>
                {remaining > 1 && (score || score === 0) ? remaining : null}
            </div>
        </>);
    }

    function renderExistingScore(score: number | undefined, remaining: number, bust: boolean, throwToEdit: IEditingThrow) {
        const bustStyle: string = bust
            ? ' text-decoration-line-through'
            : '';
        const otherScoreEditingStyle: string = editScore
            ? ' opacity-25'
            : '';
        const hiScoreStyle: string = (score || 0) >= 100
            ? ' text-danger'
            : '';
        const oneEightyStyle: string = score === 180
            ? ' fw-bold'
            : '';

        return (<>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${otherScoreEditingStyle}${bustStyle}${hiScoreStyle}${oneEightyStyle}`} onClick={() => setEditScore(throwToEdit)}>
                <span>{score}</span>
            </div>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${otherScoreEditingStyle}`} onClick={() => setEditScore(throwToEdit)}>
                {remaining}
            </div>
        </>);
    }

    function getThisScore(throwDto: LegThrowDto, player: 'home' | 'away', editingThisScore: boolean): number | undefined {
        if (editingThisScore) {
            return (currentScore && !Number.isNaN(currentScore)) || currentScore === 0
                ? currentScore
                : throwDto.score;
        }

        if (editScore) {
            return throwDto ? throwDto.score : undefined;
        }

        return throwDto
            ? throwDto.score
            : (player === leg.currentThrow ? currentScore : undefined);
    }

    function renderScore(player: 'home' | 'away', throwDto: LegThrowDto, runningScore: IRunningScore, throwIndex: number) {
        const editingThisScore: boolean = (editScore && editScore.player === player && throwIndex === editScore.throwIndex) || false;
        const thisScore: number | undefined = getThisScore(throwDto, player, editingThisScore);
        const wouldBeBust: boolean = runningScore[player] - (thisScore || 0) < 0 || runningScore[player] - (thisScore || 0) === 1;

        if (!wouldBeBust && thisScore) {
            runningScore[player] -= thisScore;
        }

        if (editingThisScore) {
            return renderScoreBeingEdited(thisScore, runningScore[player], wouldBeBust);
        }

        const throwToEdit: IEditingThrow = {
            player,
            throwIndex,
        };

        return throwDto
            ? renderExistingScore(thisScore, runningScore[player], wouldBeBust, throwToEdit)
            : renderNewScore(thisScore, runningScore[player], wouldBeBust);
    }

    const runningScore: IRunningScore = {
        home: leg.startingScore || 0,
        away: leg.startingScore || 0,
    };
    return (<div className="d-flex flex-column">
        <div className="text-center super-size" datatype="match-score">
            {singlePlayer
                ? (<div>Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore || '0'}</div>)}
        </div>
        <div className={`d-flex flex-row justify-content-stretch`}>
            {renderPlayer('home', leg.home.score || 0, 'text-center me-5')}
            {!singlePlayer ? renderPlayer('away', leg.away.score || 0, 'text-center ms-5') : null}
        </div>
        <div className="d-flex flex-column overflow-auto height-200 max-height-200 medium-size text-secondary" datatype="previous-scores">
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index];
            const awayThrow: LegThrowDto = awayThrows[index];

            const numberOfDarts = (
                <div className="flex-basis-0 flex-shrink-1 text-center text-secondary-50 small min-width-50">
                    {(index + 1) * 3}
                </div>);

            return (<div key={index} className="d-flex flex-row justify-content-evenly">
                {singlePlayer ? numberOfDarts : null}
                {renderScore('home', homeThrow, runningScore, index)}
                {singlePlayer ? null : numberOfDarts}
                {!singlePlayer ? renderScore('away', awayThrow, runningScore, index) : null}
            </div>);
        })}
        </div>
    </div>);
}