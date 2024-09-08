import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {repeat} from "../../helpers/projection";

export interface IPreviousPlayerScoreProps {
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
    leg: LegDto;
    undoLastThrow(): Promise<any>;
}

export function PreviousPlayerScore({leg, undoLastThrow, homeScore, awayScore, singlePlayer}: IPreviousPlayerScoreProps) {
    const homeThrows: LegThrowDto[] = leg.home ? leg.home.throws : [];
    const awayThrows: LegThrowDto[] = leg.away ? leg.away.throws : [];
    const maxThrows: number = Math.max(homeThrows.length, awayThrows.length);

    return (<div className="d-flex flex-column">
        <div className="d-flex flex-row justify-content-evenly">
            <div className={leg.currentThrow === 'home' ? 'text-danger' : null}>{leg.startingScore - leg.home.score}</div>
            {singlePlayer
                ? (<div>Leg {homeScore + 1}</div>)
                : (<div>{homeScore} - {awayScore}</div>)}
            {!singlePlayer ? (<div className={leg.currentThrow === 'away' ? 'text-danger' : null}>{leg.startingScore - leg.away.score}</div>) : null}
        </div>
        {repeat(maxThrows, (index: number) => {
            const homeThrow: LegThrowDto = homeThrows[index];
            const awayThrow: LegThrowDto = awayThrows[index];

            return (<div key={index} className="d-flex flex-row justify-content-evenly">
                <div>{homeThrow.score}</div>
                <div>{(index + 1) * 3}</div>
                {!singlePlayer ? (<div>{awayThrow.score}</div>) : null}
            </div>);
        })}
    </div>);
}