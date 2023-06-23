import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";

export function SuperLeaguePrintout({ tournamentData }) {
    return (<div>
        <h1>SUPER LEAGUE</h1>
        <MasterDraw tournamentData={tournamentData} />
        <MatchLog tournamentData={tournamentData} />
        <Summary tournamentData={tournamentData} />
        <MatchReport tournamentData={tournamentData} />
    </div>);
}