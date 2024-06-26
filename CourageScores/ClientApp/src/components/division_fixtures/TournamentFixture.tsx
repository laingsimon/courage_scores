import {useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {any, count, sortBy} from "../../helpers/collections";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {createTemporaryId} from "../../helpers/projection";
import {usePreferences} from "../common/PreferencesContainer";
import {ToggleFavouriteTeam} from "../common/ToggleFavouriteTeam";
import {Link} from "react-router-dom";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";

export interface ITournamentFixtureProps {
    tournament: DivisionTournamentFixtureDetailsDto;
    onTournamentChanged(): Promise<any>;
    date: string;
    expanded: boolean;
}

export function TournamentFixture({tournament, onTournamentChanged, date, expanded}: ITournamentFixtureProps) {
    const {getPreference} = usePreferences();
    const {id: divisionId, name: divisionName, season, favouritesEnabled} = useDivisionData();
    const {account, teams} = useApp();
    const [creating, setCreating] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const isAdmin: boolean = account && account.access && account.access.manageTournaments;
    const {tournamentApi} = useDependencies();
    const favouriteTeamIds: string[] = getPreference<string[]>('favouriteTeamIds') || [];
    const favouriteTeamPlaying: boolean = any(favouriteTeamIds) && any(favouriteTeamIds, teamId => any(tournament.sides, side => side.teamId === teamId));
    const isTeamTournament: boolean = any(tournament.sides, side => !!side.teamId);
    const notAFavourite: boolean = any(favouriteTeamIds) && isTeamTournament && !favouriteTeamPlaying;

    async function createTournamentGame() {
        /* istanbul ignore next */
        if (creating || deleting) {
            /* istanbul ignore next */
            return;
        }

        try {
            setCreating(true);

            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.update({
                id: createTemporaryId(),
                date: date,
                address: tournament.address,
                divisionId: divisionId,
                seasonId: season.id
            });

            if (response.success) {
                await onTournamentChanged();
            } else {
                setSaveError(response);
            }
        } finally {
            setCreating(false);
        }
    }

    async function deleteTournamentGame() {
        /* istanbul ignore next */
        if (deleting || creating) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this tournament fixture?`)) {
            return;
        }

        try {
            setDeleting(true);

            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.delete(tournament.id);

            if (response.success) {
                await onTournamentChanged();
            } else {
                setSaveError(response);
            }
        } finally {
            setDeleting(false);
        }
    }

    function renderLinkToPlayer(player: TournamentPlayerDto) {
        return (<Link key={player.id} to={`/division/${divisionName}/player:${player.name}/${season.name}`}>
            {player.name}
        </Link>);
    }

    function showTournamentSidesPlayers() {
        tournament.sides.sort(sortBy('name'));

        return (<div className="px-3">
            {tournament.sides.map((side: TournamentSideDto) => {
                if (side.teamId && count(side.players) !== 1) {
                    return (<div key={side.id}>
                        <Link to={`/division/${divisionName}/team:${side.teamId}/${season.name}`}>
                            {side.name}
                        </Link>
                    </div>);
                }

                return (<div key={side.id}>
                    {any(side.players)
                        ? (<label className="csv-nodes">
                            {side.players.sort(sortBy('name')).map(renderLinkToPlayer)}
                        </label>)
                        : null}
                </div>);
            })}
        </div>);
    }

    function renderWinner(winningSide: TournamentSideDto) {
        if (winningSide.teamId) {
            const team: TeamDto = teams[winningSide.teamId];

            if (team) {
                return (<strong className="text-primary">
                    {isAdmin ? null : <ToggleFavouriteTeam teamId={team.id} />}
                    <Link to={`/division/${divisionName}/team:${team.name}/${season.name}`}>
                        {winningSide.name}
                    </Link>
                </strong>);
            }
        }

        return (<strong className="text-primary">{winningSide.name}</strong>);
    }

    if (tournament.proposed) {
        if (!isAdmin) {
            // don't show proposed tournament addresses when not an admin
            return null;
        }

        return (<tr>
            <td colSpan={5}>
                Tournament at <strong>{tournament.address}</strong>
            </td>
            <td className="medium-column-width text-end">
                {isAdmin && tournament.proposed ? (
                        <button className="btn btn-sm btn-primary text-nowrap" onClick={createTournamentGame}>
                            {creating
                                ? (<LoadingSpinnerSmall/>)
                                : '➕'}
                        </button>)
                    : null}
                {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                            title="Could not create tournament"/>) : null}
            </td>
        </tr>)
    }

    return (<tr className={notAFavourite && favouritesEnabled && !isAdmin ? ' opacity-25' : ''}>
        <td colSpan={tournament.winningSide ? 3 : 5}>
            <Link to={`/tournament/${tournament.id}`}>
                {tournament.type} at <strong>{tournament.address}</strong>
            </Link>
            {expanded ? showTournamentSidesPlayers() : null}
        </td>
        {tournament.winningSide ? (<td colSpan={2}>
            {tournament.winningSide
                ? (<span className="margin-left">Winner: {renderWinner(tournament.winningSide)}</span>)
                : null}
        </td>) : null}
        {isAdmin ? (<td className="medium-column-width text-end">
            <button className="btn btn-sm btn-danger" onClick={deleteTournamentGame}>
                {deleting
                    ? (<LoadingSpinnerSmall/>)
                    : '🗑'}
            </button>
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={async () => setSaveError(null)}
                    title="Could not delete tournament"/>)
                : null}
        </td>) : null}
    </tr>);
}
