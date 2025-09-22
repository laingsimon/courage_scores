import { useState } from 'react';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { any, count, isEmpty, sortBy, sum } from '../../helpers/collections';
import { useDependencies } from '../common/IocContainer';
import { useApp } from '../common/AppContainer';
import { useDivisionData } from '../league/DivisionDataContainer';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';
import { TournamentPlayerDto } from '../../interfaces/models/dtos/Game/TournamentPlayerDto';
import { DivisionTournamentFixtureDetailsDto } from '../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto';
import { usePreferences } from '../common/PreferencesContainer';
import { ToggleFavouriteTeam } from '../common/ToggleFavouriteTeam';
import { Link } from 'react-router';
import { TournamentMatchDto } from '../../interfaces/models/dtos/Game/TournamentMatchDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { hasAccess } from '../../helpers/conditions';

export interface ITournamentFixtureProps {
    tournament: DivisionTournamentFixtureDetailsDto;
    onTournamentChanged(): UntypedPromise;
    expanded: boolean;
}

export function TournamentFixture({
    tournament,
    onTournamentChanged,
    expanded,
}: ITournamentFixtureProps) {
    const { getPreference } = usePreferences();
    const { name: divisionName, season, favouritesEnabled } = useDivisionData();
    const { account, teams } = useApp();
    const [deleting, setDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] =
        useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const isAdmin: boolean = hasAccess(
        account,
        (access) => access.manageTournaments,
    );
    const { tournamentApi } = useDependencies();
    const favouriteTeamIds: string[] =
        getPreference<string[]>('favouriteTeamIds') || [];
    const favouriteTeamPlaying: boolean =
        any(favouriteTeamIds) &&
        any(favouriteTeamIds, (teamId) =>
            any(tournament.sides, (side) => side.teamId === teamId),
        );
    const isTeamTournament: boolean = any(
        tournament.sides,
        (side) => !!side.teamId,
    );
    const notAFavourite: boolean =
        any(favouriteTeamIds) && isTeamTournament && !favouriteTeamPlaying;

    async function deleteTournamentGame() {
        /* istanbul ignore next */
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (
            !window.confirm(
                `Are you sure you want to delete this tournament fixture?`,
            )
        ) {
            return;
        }

        try {
            setDeleting(true);

            const response: IClientActionResultDto<TournamentGameDto> =
                await tournamentApi.delete(tournament.id!);

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
        return (
            <Link
                key={player.id}
                to={`/division/${divisionName}/player:${player.name}/${season!.name}`}>
                {player.name}
            </Link>
        );
    }

    function renderFirstRoundMatches(matches?: TournamentMatchDto[]) {
        return (
            <div className="px-3" datatype="superleague-players">
                <Link
                    to={`/tournament/${tournament.id}`}
                    className="text-decoration-none">
                    {(matches || []).map((match, index) => (
                        <div
                            key={index}
                            className="d-flex flex-row justify-content-stretch">
                            <div className="flex-grow-1 text-end flex-basis-0 fw-bold">
                                {match.sideA?.name}
                            </div>
                            <div className="width-50 text-center">
                                {match.scoreA}
                            </div>
                            <div className="">-</div>
                            <div className="width-50 text-center">
                                {match.scoreB}
                            </div>
                            <div className="flex-grow-1 flex-basis-0 fw-bold">
                                {match.sideB?.name}
                            </div>
                        </div>
                    ))}
                </Link>
            </div>
        );
    }

    function showTournamentSidesPlayers() {
        if (tournament.singleRound && any(tournament.firstRoundMatches)) {
            return renderFirstRoundMatches(tournament.firstRoundMatches);
        }

        tournament.sides!.sort(sortBy('name'));

        return (
            <div className="px-3">
                {tournament.sides!.map((side: TournamentSideDto) => {
                    if (side.teamId && count(side.players) !== 1) {
                        return (
                            <div key={side.id}>
                                <Link
                                    to={`/division/${divisionName}/team:${side.teamId}/${season!.name}`}>
                                    {side.name}
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <div key={side.id}>
                            {any(side.players) ? (
                                <label className="csv-nodes">
                                    {side
                                        .players!.sort(sortBy('name'))
                                        .map(renderLinkToPlayer)}
                                </label>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        );
    }

    function renderWinner(winningSide: TournamentSideDto) {
        if (winningSide.teamId) {
            const team = teams.find((t) => t.id === winningSide.teamId);

            if (team) {
                return (
                    <strong className="text-primary">
                        {isAdmin ? null : (
                            <ToggleFavouriteTeam teamId={team.id} />
                        )}
                        <Link
                            to={`/division/${divisionName}/team:${team.name}/${season!.name}`}>
                            {winningSide.name}
                        </Link>
                    </strong>
                );
            }
        }

        return <strong className="text-primary">{winningSide.name}</strong>;
    }

    function getSuperleagueScore(side: 'scoreA' | 'scoreB') {
        if (isEmpty(tournament.firstRoundMatches)) {
            return;
        }

        return sum(tournament.firstRoundMatches, (m) => m[side] ?? 0);
    }

    return (
        <tr
            className={
                notAFavourite && favouritesEnabled && !isAdmin
                    ? ' opacity-25'
                    : ''
            }>
            <td colSpan={tournament.winningSide ? 3 : 5}>
                <Link to={`/tournament/${tournament.id}`}>
                    {tournament.type} at <strong>{tournament.address}</strong>
                </Link>
                {tournament.singleRound && tournament.opponent ? (
                    <span className="margin-left d-inline-flex gap-1">
                        <span>{getSuperleagueScore('scoreA')}</span>
                        <span>vs</span>
                        <span>{getSuperleagueScore('scoreB')}</span>
                        <span>{tournament.opponent}</span>
                    </span>
                ) : null}
                {expanded ? showTournamentSidesPlayers() : null}
            </td>
            {tournament.winningSide ? (
                <td colSpan={2}>
                    {tournament.winningSide ? (
                        <span className="margin-left">
                            Winner: {renderWinner(tournament.winningSide)}
                        </span>
                    ) : null}
                </td>
            ) : null}
            {isAdmin ? (
                <td className="medium-column-width text-end">
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={deleteTournamentGame}>
                        {deleting ? <LoadingSpinnerSmall /> : '🗑'}
                    </button>
                    {saveError ? (
                        <ErrorDisplay
                            {...saveError}
                            onClose={async () => setSaveError(null)}
                            title="Could not delete tournament"
                        />
                    ) : null}
                </td>
            ) : null}
        </tr>
    );
}
