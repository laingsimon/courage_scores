import {round2dp} from "../../../helpers/rendering";
import {ILegDto} from "../../../interfaces/dtos/Game/Sayg/ILegDto";
import {ILegThrowDto} from "../../../interfaces/dtos/Game/Sayg/ILegThrowDto";
import {ILegCompetitorScoreDto} from "../../../interfaces/dtos/Game/Sayg/ILegCompetitorScoreDto";

export interface IPreviousPlayerScoreProps {
    home: string;
    away: string;
    leg: ILegDto;
    undoLastThrow: () => Promise<any>;
}

export function PreviousPlayerScore({home, away, leg, undoLastThrow}: IPreviousPlayerScoreProps) {
    const opponent: 'home' | 'away' = opposite(leg.currentThrow);
    const accumulator: ILegCompetitorScoreDto = leg[opponent];
    const lastThrow: ILegThrowDto = accumulator.throws[accumulator.throws.length - 1];
    const playerLookup: { home: string, away: string } = {
        home: home,
        away: away
    }

    function opposite(player: string): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    async function changeScore() {
        if (!window.confirm('Are you sure you want to change this score?')) {
            return;
        }

        await undoLastThrow();
    }

    if (!leg[opponent].score) {
        return null;
    }

    return (<div className="text-secondary-50 text-center">
        <button className="float-end btn btn-outline-warning" onClick={changeScore}>
            Undo
        </button>
        <p className="my-0">
            <strong>{playerLookup[opponent]} </strong> requires <strong className="text-dark">
            {leg.startingScore - accumulator.score}
        </strong>
        </p>
        <p className="my-0">
            thrown <strong>{accumulator.noOfDarts}</strong> darts
            {accumulator.noOfDarts
                ? (<span>, average: <strong>{round2dp(accumulator.score / (accumulator.noOfDarts / 3))}</strong></span>)
                : null}
        </p>
        <p className="my-0" title="Click to change score">
            Last score: <strong className="text-dark">{lastThrow.score}</strong>
            {accumulator.bust ? (<strong> 💥 </strong>) : null}
        </p>
        <hr/>
    </div>);
}