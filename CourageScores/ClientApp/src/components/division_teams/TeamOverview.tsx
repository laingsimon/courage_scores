import {DivisionPlayers} from "../division_players/DivisionPlayers";
import {ShareButton} from "../common/ShareButton";
import {any} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useDivisionData} from "../league/DivisionDataContainer";
import {useApp} from "../common/AppContainer";
import {useBranding} from "../common/BrandingContainer";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {Link} from "react-router-dom";

export interface ITeamOverviewProps {
    teamId: string;
}

export function TeamOverview({teamId}: ITeamOverviewProps) {
    const {name} = useBranding();
    const {
        fixtures: divisionDataFixtures,
        players: divisionDataPlayers,
        season,
        name: divisionName
    } = useDivisionData();
    const {teams} = useApp();
    const team = teams.filter(t => t.id === teamId)[0];
    const fixtures = divisionDataFixtures.map(fixtureDate => {
        return {
            date: fixtureDate.date,
            fixtures: fixtureDate.fixtures.filter(f => f.awayTeam && (f.awayTeam.id === teamId || f.homeTeam.id === teamId))
        };
    }).filter(fixtureDate => any(fixtureDate.fixtures));
    const players = divisionDataPlayers.filter(p => p.teamId === teamId);

    function renderScore(score: number | null, postponed: boolean) {
        if (postponed) {
            return 'P';
        }

        if (score === null) {
            return '-';
        }

        return score;
    }

    function renderFixtureAndDate(fixtureDate: DivisionFixtureDateDto) {
        const fixture = fixtureDate.fixtures[0];

        return (<tr key={fixture.id}>
            <td>
                <div className="position-absolute">
                    <Link to={`/score/${fixture.id}`}>{renderDate(fixtureDate.date)}</Link>
                </div>
            </td>
            <td className="text-end">
                <div className="mt-4">
                    {fixture.homeTeam.id === teamId
                        ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                        : (<Link to={`/division/${divisionName}/team:${fixture.homeTeam.name}/${season.name}`}
                                           className="margin-right text-nowrap">{fixture.homeTeam.name}</Link>)}
                </div>
            </td>
            <td className="align-middle">{renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td className="align-middle">vs</td>
            <td className="align-middle">{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                <div className="mt-4">
                    {fixture.awayTeam.id === teamId
                        ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                        : (<Link to={`/division/${divisionName}/team:${fixture.awayTeam.name}/${season.name}`}
                                           className="margin-right text-nowrap">{fixture.awayTeam.name}</Link>)}
                </div>
            </td>
        </tr>);
    }

    if (!team) {
        return <div className="content-background p-3">
            <h5 className="text-danger">⚠ Team could not be found</h5>
            <Link className="btn btn-primary"
                            to={`/division/${divisionName}/teams/${season.name}`}>Teams</Link>
        </div>
    }

    return (<div className="content-background p-3">
        <h3>{team.name} <ShareButton text={`${name}: ${team.name}`}/></h3>
        <p>Address: {team.address}</p>

        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                <tr>
                    <th>Date</th>
                    <th className="text-end">Home</th>
                    <th className="narrow-column"></th>
                    <th className="narrow-column">vs</th>
                    <th className="narrow-column"></th>
                    <th>Away</th>
                </tr>
                </thead>
                <tbody>
                {fixtures.map(renderFixtureAndDate)}
                </tbody>
            </table>
        </div>
        <div className="overflow-x-auto">
            <DivisionPlayers players={players} hideVenue={true}/>
        </div>
    </div>)
}
