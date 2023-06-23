import {repeat} from "../../../../helpers/projection";

export function MatchLogTableHeading({ team, noOfThrows }) {
    return (<>
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
    </>);
}