import {repeat} from "../../../../helpers/projection";
import {MatchLogRow} from "./MatchLogRow";

export function MatchLogTable({ team, player, noOfThrows, saygData, accumulatorName  }) {
    return (<table className="table">
        <thead>
        <tr>
            <th colSpan={9}>{team}</th>
            <th colSpan={3 + noOfThrows}>Dart average</th>
        </tr>
        <tr>
            <th>Player</th>
            <th title="Leg">L</th>
            <th title="Actual darts">AD</th>
            <th title="Game shot">GS</th>
            <th title="Score left">SL</th>
            <th>100+</th>
            <th>140+</th>
            <th>180</th>
            <th title="Tons">T</th>
            <th>Player</th>
            <th>Team</th>
            <th title="Game dart">GD</th>
            {repeat(noOfThrows, i => <th key={i}>{i + 1}</th>)}
        </tr>
        </thead>
        <tbody>
        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
            key={legIndex}
            team={team}
            accumulatorName={accumulatorName}
            leg={saygData.legs[legIndex]}
            noOfThrows={noOfThrows}
            player={player}
            legNo={Number.parseInt(legIndex) + 1}/>)}
        </tbody>
    </table>);
}