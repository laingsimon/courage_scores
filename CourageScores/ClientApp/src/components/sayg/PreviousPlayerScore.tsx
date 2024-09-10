import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";
import {useEffect} from "react";
import {IEditingThrow} from "./IEditingThrow";
import {useEditableSayg} from "./EditableSaygContainer";

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

export function PreviousPlayerScore({home, away, leg, homeScore, awayScore, singlePlayer, currentScore}: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws : [];
    const {editScore, setEditScore} = useEditableSayg();
    const maxThrows: number = getMaxThrows(homeThrows, awayThrows);

    useEffect(() => {
        window.setTimeout(scrollToLastScore, 10);
    },
    // eslint-disable-next-line
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
        const suffix: string = leg.currentThrow === currentPlayer
            ? 'text-primary fw-bold bg-info text-white'
            : null;
        return (<div className={`flex-basis-0 flex-grow-1 flex-shrink-1 ${className} ${suffix}`} datatype={currentPlayer === leg.currentThrow ? 'current-player' : ''}>
            {currentPlayer === 'home' ? home : away}
            <span className="fs-1 ms-3">{leg.startingScore - score}</span>
        </div>);
    }

    function renderScore(player: 'home' | 'away', throwDto: LegThrowDto, runningScore: IRunningScore, throwIndex: number) {
        const throwToEdit: IEditingThrow = {
            player,
            throwIndex,
        };
        const editingThisScore: boolean = editScore && editScore.player === player && throwIndex === editScore.throwIndex;
        const isCurrentPlayer = player === leg.currentThrow;
        const thisScore: number = editingThisScore
            ? (currentScore && !Number.isNaN(currentScore) ? currentScore : throwDto.score)
            : (throwDto ? throwDto.score : (isCurrentPlayer ? currentScore : null));
        let newRunningScore: number = -1;

        switch (player) {
            case 'home':
                runningScore.home -= thisScore;
                newRunningScore = runningScore.home;
                break;
            case 'away':
                runningScore.away -= thisScore;
                newRunningScore = runningScore.away;
                break;
        }

        let classNameSuffix: string = '';
        if (editScore) {
            if (editingThisScore) {
                // editing this score
                classNameSuffix = ' bg-warning';
            } else {
                // editing another score
                classNameSuffix = ' opacity-25';
            }
        } else if (!throwDto) {
            // new score
            classNameSuffix = ' opacity-50 fst-italic';
        }
        const bustSuffix: string = newRunningScore <= 1
            ? ' text-decoration-line-through'
            : '';

        const editTheScore = throwDto
            ? (() => editingThisScore
                ? setEditScore(null)
                : setEditScore(throwToEdit))
            : null;

        return (<>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${classNameSuffix}${bustSuffix}`} onClick={editTheScore}>
                <span>{thisScore}</span>
            </div>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${classNameSuffix}`} onClick={editTheScore}>
                {newRunningScore > 1 && (throwDto || isCurrentPlayer) ? newRunningScore : null}
            </div>
        </>);
    }

    const runningScore: IRunningScore = {
        home: leg.startingScore,
        away: leg.startingScore,
    };
    return (<div className="d-flex flex-column">
        <div className="d-flex flex-row justify-content-stretch fs-3">
            {renderPlayer('home', leg.home.score, 'text-center me-5')}
            {singlePlayer
                ? (<div className="flex-basis-0 flex-grow-1 flex-shrink-1 text-center">Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore}</div>)}

            {!singlePlayer ? renderPlayer('away', leg.away.score, 'text-center ms-5') : null}
        </div>
        <div className="d-flex flex-column overflow-auto height-100 max-height-100" datatype="previous-scores">
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index];
            const awayThrow: LegThrowDto = awayThrows[index];

            const numberOfDarts = (
                <div className="flex-basis-0 flex-shrink-1 text-center text-secondary-50 small min-width-50">
                    {(index + 1) * 3}
                </div>);

            return (<div key={index} className="d-flex flex-row justify-content-evenly fs-4">
                {singlePlayer ? numberOfDarts : null}
                {renderScore('home', homeThrow, runningScore, index)}
                {singlePlayer ? null : numberOfDarts}
                {!singlePlayer ? renderScore('away', awayThrow, runningScore, index) : null}
            </div>);
        })}
        </div>
    </div>);
}
