import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";

export function SuperLeaguePrintout({ tournamentData }) {
    // TODO: drive these from data
    const homeTeam = "courage league";
    const awayTeam = "marcs men";

    return (<div>
        <MasterDraw tournamentData={tournamentData} homeTeam={homeTeam} awayTeam={awayTeam} />
        <MatchLog tournamentData={tournamentData} homeTeam={homeTeam} awayTeam={awayTeam} />
        <Summary tournamentData={tournamentData} homeTeam={homeTeam} awayTeam={awayTeam} />
        <MatchReport tournamentData={tournamentData} homeTeam={homeTeam} awayTeam={awayTeam} />
    </div>);
}