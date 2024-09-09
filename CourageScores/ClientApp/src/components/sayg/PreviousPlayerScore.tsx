import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";
import {IEditThrow} from "./PlayLeg";

export interface IPreviousPlayerScoreProps {
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    leg: LegDto;
    undoLastThrow(): Promise<any>;
    showRemainingScore?: boolean;
    setEditScore(throwToEdit: IEditThrow, score: number): Promise<any>;
    editScore?: IEditThrow;
    maxThrowsToShow: number;
    home: string;
    away: string;
}

export function PreviousPlayerScore({home, away, leg, homeScore, awayScore, singlePlayer, showRemainingScore, setEditScore, editScore, maxThrowsToShow}: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws : [];
    const maxThrows: number = Math.max(homeThrows.length, awayThrows.length);
    const showsThrowsFromIndex: number = maxThrows - maxThrowsToShow;

    function renderPlayer(currentPlayer: string, score: number, className: string) {
        const suffix: string = leg.currentThrow === currentPlayer
            ? 'text-primary fw-bold text-decoration-underline'
            : null;
        return (<div className={`flex-basis-0 flex-grow-1 flex-shrink-1 ${className} ${suffix}`}>
            {currentPlayer === 'home' ? home : away} {leg.startingScore - score}
        </div>);
    }

    function renderScore(player: string, score: number, runningScore: number, throwIndex: number) {
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
            <div className={`flex-basis-0 flex-grow-1 flex-shrink-0 text-center ${classNameSuffix}`}
                 onClick={() => editingThisScore ? setEditScore(null, 0) : setEditScore(throwToEdit, score)}>
                {score === undefined ? (<>-</>) : <span>{score}</span>}
            </div>
            {showRemainingScore
                ? (<div className="flex-basis-0 flex-grow-1 flex-shrink-0 text-secondary-50 margin-right extra-small text-center"
                        onClick={() => editingThisScore ? setEditScore(null, 0) : setEditScore(throwToEdit, score)}>
                    {Number.isNaN(runningScore) ? (<>-</>) : runningScore}
                    </div>)
                : null}
        </>);
    }

    let homeRunningScore = leg.startingScore;
    let awayRunningScore = leg.startingScore;
    return (<div className="d-flex flex-column overflow-auto max-height-250">
        <div className="d-flex flex-row justify-content-stretch fs-3">
            {renderPlayer('home', leg.home.score, 'text-end me-5')}
            {singlePlayer
                ? (<div className="flex-basis-0 flex-grow-1 flex-shrink-1 text-center">Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore}</div>)}

            {!singlePlayer ? renderPlayer('away', leg.away.score, 'ms-5') : null}
        </div>
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index] || {};
            const awayThrow: LegThrowDto = awayThrows[index] || {};
            homeRunningScore -= homeThrow.score;
            if (!singlePlayer) {
                awayRunningScore -= awayThrow.score;
            }
            if (index < showsThrowsFromIndex) {
                return null;
            }

            return (<div key={index} className="d-flex flex-row justify-content-evenly fs-4">
                {renderScore('home', homeThrow.score, homeRunningScore, index)}
                <div
                    className="flex-basis-0 flex-grow-1 flex-shrink-0 text-center text-secondary-50">{(index + 1) * 3}</div>
                {!singlePlayer ? renderScore('away', awayThrow.score, awayRunningScore, index) : null}
            </div>);
        })}
    </div>);
}