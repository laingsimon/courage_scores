import {DivisionPlayer} from "./DivisionPlayer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {sortBy} from "../../helpers/collections";
import {useApp} from "../common/AppContainer";
import {PrintDivisionHeading} from "../league/PrintDivisionHeading";
import {DivisionPlayerDto} from "../../interfaces/models/dtos/Division/DivisionPlayerDto";
import {useBranding} from "../common/BrandingContainer";

export interface IDivisionPlayersProps {
    hideVenue?: boolean;
    hideHeading?: boolean;
    players?: DivisionPlayerDto[];
}

export function DivisionPlayers({hideVenue, hideHeading, players}: IDivisionPlayersProps) {
    const {account} = useApp();
    const isAdmin: boolean = account && account.access && account.access.managePlayers;
    const {players: divisionDataPlayers, name} = useDivisionData();
    const playersToShow = players || divisionDataPlayers;
    const {setTitle} = useBranding();

    setTitle(`${name}: Players`);

    return (<div className="content-background p-3 overflow-x-auto">
        <PrintDivisionHeading/>
        <div className="clear-float">
            {hideHeading
                ? null
                : (<p className="d-print-none">Only players that have played a singles match will appear here</p>)}
            <table className="table">
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    {hideVenue ? null : (<th>Venue</th>)}
                    <th>Played</th>
                    <th>Won</th>
                    <th>Lost</th>
                    <th>Points</th>
                    <th>Win %</th>
                    <th>180s</th>
                    <th>hi-check</th>
                </tr>
                </thead>
                <tbody>
                {playersToShow
                    .filter(p => isAdmin || p.singles.matchesPlayed > 0)
                    .sort(sortBy('rank'))
                    .map(player => (<DivisionPlayer
                        key={player.id}
                        player={player}
                        hideVenue={hideVenue}/>))}
                </tbody>
            </table>
        </div>
    </div>);
}
