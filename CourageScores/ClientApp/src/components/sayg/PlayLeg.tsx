import {PlayerInput} from "./PlayerInput";
import {PreviousPlayerScore} from "./PreviousPlayerScore";
import {IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";

export interface IPlayLegProps {
    leg?: LegDto;
    home: string;
    away: string;
    onChange(newLeg: LegDto): Promise<any>;
    onLegComplete(accumulatorName: string): Promise<any>;
    on180?(accumulatorName: string): Promise<any>;
    onHiCheck?(accumulatorName: string, score: number): Promise<any>;
    homeScore: number;
    awayScore?: number;
    singlePlayer?: boolean;
}

export function PlayLeg({leg, home, away, onChange, onLegComplete, on180, onHiCheck, homeScore, awayScore, singlePlayer}: IPlayLegProps) {
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

    if (!leg) {
        return (<div>No leg!</div>);
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
            home={home}
            away={away}
            undoLastThrow={undoLastThrow}/>) : null}
        {leg.playerSequence && leg.currentThrow ? (<PlayerInput
            leg={leg}
            home={home}
            away={away}
            homeScore={homeScore}
            awayScore={awayScore}
            onLegComplete={onLegComplete}
            on180={on180}
            onHiCheck={onHiCheck}
            onChange={onChange}
            singlePlayer={singlePlayer}/>) : null}
    </div>);
}
