import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";

export interface IPreviousPlayerScoreProps {
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    leg: LegDto;
    undoLastThrow(): Promise<any>;
    showRemainingScore?: boolean;
}

export function PreviousPlayerScore({leg, undoLastThrow, homeScore, awayScore, singlePlayer, showRemainingScore}: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws : [];
    const maxThrows: number = Math.max(homeThrows.length, awayThrows.length);

    function renderPlayer(currentPlayer: string, score: number) {
        const suffix: string = leg.currentThrow === currentPlayer
            ? 'text-primary fw-bold text-decoration-underline'
            : null;
        return (<div className={`flex-grow-1 flex-shrink-1 text-center ${suffix}`}>
            {leg.startingScore - score}
        </div>);
    }

    function renderScore(player: string, score: number, runningScore: number) {
        return (<div className="flex-grow-1 flex-shrink-1 text-center" title={`Click to edit ${player} score`}>
            {score === undefined ? '' : score}
            {showRemainingScore ? (<span className="float-end text-secondary-50 margin-right extra-small">{Number.isNaN(runningScore) ? '' : runningScore}</span>): null}
        </div>);
    }

    let homeRunningScore = leg.startingScore;
    let awayRunningScore = leg.startingScore;
    return (<div className="d-flex flex-column">
        <div className="d-flex flex-row justify-content-stretch fs-3">
            {renderPlayer('home', leg.home.score)}
            {singlePlayer
                ? (<div className="flex-grow-1 flex-shrink-1 text-center">Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore}</div>)}

            {!singlePlayer ? renderPlayer('away', leg.away.score) : null}
        </div>
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index];
            const awayThrow: LegThrowDto = awayThrows[index] || { score: undefined };

            return (<div key={index} className="d-flex flex-row justify-content-stretch fs-4">
                {renderScore('home', homeThrow.score, homeRunningScore -= homeThrow.score)}
                <div className="text-center text-secondary-50">{(index + 1) * 3}</div>
                {!singlePlayer ? renderScore('away', awayThrow.score, awayRunningScore -= awayThrow.score) : null}
            </div>);
        })}
    </div>);
}