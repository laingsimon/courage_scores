import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";
import {IEditThrow} from "./PlayLeg";
import {useEffect} from "react";

export interface IPreviousPlayerScoreProps {
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    leg: LegDto;
    showRemainingScore?: boolean;
    setEditScore(throwToEdit: IEditThrow, score: number): Promise<any>;
    editScore?: IEditThrow;
    home: string;
    away: string;
}

export function PreviousPlayerScore({home, away, leg, homeScore, awayScore, singlePlayer, showRemainingScore, setEditScore, editScore}: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws : [];
    const maxThrows: number = Math.max(homeThrows.length, awayThrows.length);

    useEffect(() => {
        window.setTimeout(scrollToLastScore, 10);
    },
    // eslint-disable-next-line
    [maxThrows]);

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
            ? 'text-primary fw-bold text-decoration-underline bg-info'
            : null;
        return (<div className={`flex-basis-0 flex-grow-1 flex-shrink-1 ${className} ${suffix}`}>
            {currentPlayer === 'home' ? home : away}
            <span className="fs-1 ms-3">{leg.startingScore - score}</span>
        </div>);
    }

    function renderScore(player: 'home' | 'away', score: number, runningScore: number, throwIndex: number) {
        const throwToEdit: IEditThrow = {
            player,
            throwIndex,
        };
        const editingThisScore: boolean = editScore && editScore.player === player && throwIndex === editScore.throwIndex;
        let classNameSuffix: string = '';
        if (editScore) {
            if (editingThisScore) {
                classNameSuffix = ' bg-warning';
            } else {
                classNameSuffix = ' opacity-25';
            }
        }

        return (<>
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${classNameSuffix}`}
                 onClick={() => editingThisScore ? setEditScore(null, 0) : setEditScore(throwToEdit, score)}>
                {score === undefined ? null : <span>{score}</span>}
            </div>
            {showRemainingScore
                ? (<div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center${classNameSuffix}`}
                        onClick={() => editingThisScore ? setEditScore(null, 0) : setEditScore(throwToEdit, score)}>
                    {Number.isNaN(runningScore) || runningScore <= 1 ? null : runningScore}
                    </div>)
                : null}
        </>);
    }

    let homeRunningScore = leg.startingScore;
    let awayRunningScore = leg.startingScore;
    return (<div className="d-flex flex-column">
        <div className="d-flex flex-row justify-content-stretch fs-3">
            {renderPlayer('home', leg.home.score, 'text-end me-5')}
            {singlePlayer
                ? (<div className="flex-basis-0 flex-grow-1 flex-shrink-1 text-center">Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore}</div>)}

            {!singlePlayer ? renderPlayer('away', leg.away.score, 'ms-5') : null}
        </div>
        <div className="d-flex flex-column overflow-auto height-100 max-height-100" datatype="previous-scores">
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index] || {};
            const awayThrow: LegThrowDto = awayThrows[index] || {};
            homeRunningScore -= homeThrow.score;
            awayRunningScore -= awayThrow.score;

            const numberOfDarts = (
                <div className="flex-basis-0 flex-shrink-1 text-center text-secondary-50 small">
                    {(index + 1) * 3}
                </div>);

            return (<div key={index} className="d-flex flex-row justify-content-evenly fs-4">
                {singlePlayer ? numberOfDarts : null}
                {renderScore('home', homeThrow.score, homeRunningScore, index)}
                {singlePlayer ? null : numberOfDarts}
                {!singlePlayer ? renderScore('away', awayThrow.score, awayRunningScore, index) : null}
            </div>);
        })}
        </div>
    </div>);
}