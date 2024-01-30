import React from 'react';
import {DivisionPlayers} from "./DivisionPlayers";
import {ShareButton} from "../common/ShareButton";
import {any} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useDivisionData} from "../DivisionDataContainer";
import {useBranding} from "../../BrandingContainer";
import {EmbedAwareLink} from "../common/EmbedAwareLink";
import {IDivisionPlayerDto} from "../../interfaces/models/dtos/Division/IDivisionPlayerDto";
import {IDivisionTeamDto} from "../../interfaces/models/dtos/Division/IDivisionTeamDto";
import {IDivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/IDivisionFixtureDateDto";
import {IDivisionFixtureDto} from "../../interfaces/models/dtos/Division/IDivisionFixtureDto";
import {IDivisionTournamentFixtureDetailsDto} from "../../interfaces/models/dtos/Division/IDivisionTournamentFixtureDetailsDto";

export interface IPlayerOverviewProps {
    playerId: string;
}

export function PlayerOverview({playerId}: IPlayerOverviewProps) {
    const {name} = useBranding();
    const {players, teams, fixtures: divisionDataFixtures, season, name: divisionName} = useDivisionData();
    const player: IDivisionPlayerDto = players.filter(p => p.id === playerId)[0] || {id: null, name: 'Unknown', fixtures: {}, teamId: null, team: 'Unknown'};
    const team: IDivisionTeamDto = teams.filter(t => t.id === player.teamId)[0] || {id: null, name: 'Unknown', address: ''};
    const fixtures = divisionDataFixtures.map(fixtureDate => {
        const fixtureId: string = player.fixtures[fixtureDate.date];
        const tournamentFixtures: IDivisionTournamentFixtureDetailsDto[] = fixtureDate.tournamentFixtures
            .filter((tournament: IDivisionTournamentFixtureDetailsDto) => !tournament.proposed)
            .filter((tournament: IDivisionTournamentFixtureDetailsDto) => {
                return any(tournament.players, (id: string) => id === playerId);
            });

        return {
            date: fixtureDate.date,
            fixtures: fixtureId ? fixtureDate.fixtures.filter(f => f.id === fixtureId) : [],
            tournamentFixtures: tournamentFixtures
        };
    }).filter(d => any(d.fixtures) || any(d.tournamentFixtures));

    function renderScore(score: number, postponed: boolean) {
        if (postponed) {
            return 'P';
        }

        if (score === null) {
            return '-';
        }

        return score;
    }

    function renderFixtureAndDate(fixtureDate: IDivisionFixtureDateDto) {
        const fixture: IDivisionFixtureDto = fixtureDate.fixtures[0];
        const tournamentFixture: IDivisionTournamentFixtureDetailsDto = fixtureDate.tournamentFixtures[0];

        return fixture
            ? renderLeagueFixture(fixture, fixtureDate.date)
            : renderTournamentFixture(tournamentFixture, fixtureDate.date);
    }

    function renderLeagueFixture(fixture: IDivisionFixtureDto, date: string) {
        return (<tr key={fixture.id}>
            <td>
                <div className="position-absolute">
                    <EmbedAwareLink to={`/score/${fixture.id}`}>{renderDate(date)}</EmbedAwareLink>
                </div>
            </td>
            <td className="text-end">
                <div className="mt-4">
                    {fixture.homeTeam.id === team.id
                        ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                        : (<EmbedAwareLink to={`/division/${divisionName}/team:${fixture.homeTeam.name}/${season.name}`}
                                           className="margin-right">{fixture.homeTeam.name}</EmbedAwareLink>)}
                </div>
            </td>
            <td className="align-middle">{renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td className="align-middle">vs</td>
            <td className="align-middle">{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                <div className="mt-4">
                    {fixture.awayTeam.id === team.id
                        ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                        : (<EmbedAwareLink to={`/division/${divisionName}/team:${fixture.awayTeam.name}/${season.name}`}
                                           className="margin-right">{fixture.awayTeam.name}</EmbedAwareLink>)}
                </div>
            </td>
        </tr>);
    }

    function renderTournamentFixture(tournament: IDivisionTournamentFixtureDetailsDto, date: string) {
        return (<tr key={tournament.id}>
            <td>
                <div className="position-absolute">
                    <EmbedAwareLink to={`/tournament/${tournament.id}`}>{renderDate(date)}</EmbedAwareLink>
                </div>
            </td>
            <td className="text-end" colSpan={3}>
                <div className="mt-4">
                    <EmbedAwareLink to={`/tournament/${tournament.id}`} className="text-nowrap">
                        {tournament.type} at <strong>{tournament.address}</strong>
                    </EmbedAwareLink>
                </div>
            </td>
            <td colSpan={2}>
                {tournament.winningSide ? (<div className="mt-4">
                    {tournament.winningSide
                        ? (<span className="margin-left">Winner: <strong
                            className="text-primary">{tournament.winningSide.name}</strong></span>)
                        : null}
                </div>) : null}
            </td>
        </tr>);
    }

    if (!player.id) {
        return (<div className="content-background p-3">
            <h5 className="text-danger">⚠ Player could not be found</h5>
        </div>)
    }

    return (<div className="content-background p-3">
        <h3>
            {player.name}
            <span className="h6 margin-left">
                <EmbedAwareLink to={`/division/${divisionName}/team:${team.name}/${season.name}`}
                                className="margin-right">{team.name}</EmbedAwareLink>
            </span>
            <span className="margin-left">
                <ShareButton text={`${name}: ${player.name}`}/>
            </span>
        </h3>

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
            <DivisionPlayers hideHeading={true} hideVenue={true} players={[player]} />
        </div>
    </div>)
}
