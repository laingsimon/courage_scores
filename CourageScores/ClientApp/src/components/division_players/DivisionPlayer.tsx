import { useEffect, useState } from 'react';
import { Dialog } from '../common/Dialog.tsx';
import { EditPlayerDetails } from './EditPlayerDetails.tsx';
import { ErrorDisplay } from '../common/ErrorDisplay.tsx';
import { propChanged } from '../../helpers/events.ts';
import { useDependencies } from '../common/IocContainer.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { useDivisionData } from '../league/DivisionDataContainer.tsx';
import { EMPTY_ID } from '../../helpers/projection.ts';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto.ts';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ToggleFavouriteTeam } from '../common/ToggleFavouriteTeam.tsx';
import { usePreferences } from '../common/PreferencesContainer.tsx';
import { any } from '../../helpers/collections.ts';
import { Link } from 'react-router';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface IDivisionPlayerProps {
    player: DivisionPlayerDto;
    hideVenue?: boolean;
}

export function DivisionPlayer({ player, hideVenue }: IDivisionPlayerProps) {
    const { account, reloadTeams } = useApp();
    const {
        id: divisionId,
        season,
        onReloadDivision,
        name: divisionName,
        favouritesEnabled,
    } = useDivisionData();
    const [playerDetails, setPlayerDetails] = useState<DivisionPlayerDto>(
        Object.assign({}, player),
    );
    const [editPlayer, setEditPlayer] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] =
        useState<IClientActionResultDto<TeamDto> | null>(null);
    const isAdmin: boolean = hasAccess(account, AccessOption.managePlayers);
    const team: TeamDto = {
        id: player.teamId!,
        name: player.team,
        address: '',
    };
    const { playerApi } = useDependencies();
    const { getPreference } = usePreferences();
    const favouriteTeamIds: string[] =
        getPreference<string[]>('favouriteTeamIds') || [];
    const teamIsFavourite: boolean = any(
        favouriteTeamIds,
        (id) => id === player.teamId,
    );
    const notAFavourite: boolean = any(favouriteTeamIds) && !teamIsFavourite;

    useEffect(() => {
        setPlayerDetails(Object.assign({}, player));
    }, [player]);

    async function playerDetailSaved() {
        await onReloadDivision();
        await reloadTeams();
        setEditPlayer(false);
    }

    function renderEditPlayer() {
        return (
            <Dialog title={`Edit player: ${player.name}`}>
                <EditPlayerDetails
                    gameId={undefined}
                    player={playerDetails}
                    team={team}
                    seasonId={season!.id!}
                    divisionId={divisionId!}
                    onCancel={async () => setEditPlayer(false)}
                    onChange={propChanged(playerDetails, setPlayerDetails)}
                    onSaved={playerDetailSaved}
                />
            </Dialog>
        );
    }

    async function deletePlayer() {
        /* istanbul ignore next */
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (
            !window.confirm(`Are you sure you want to delete ${player.name}?`)
        ) {
            return;
        }

        setDeleting(true);
        try {
            const response: IClientActionResultDto<TeamDto> =
                await playerApi.delete(season!.id!, player.teamId!, player.id!);
            if (response.success) {
                await onReloadDivision();
                await reloadTeams();
            } else {
                setSaveError(response);
            }
        } finally {
            setDeleting(false);
        }
    }

    const division: DivisionDto = player.division || {
        id: divisionId!,
        name: divisionName,
    };

    return (
        <tr
            className={
                notAFavourite &&
                favouritesEnabled &&
                !isAdmin &&
                season?.allowFavouriteTeams !== false
                    ? ' opacity-25'
                    : ''
            }>
            <td>{player.rank}</td>
            <td>
                {isAdmin ? (
                    <button
                        disabled={deleting}
                        onClick={() => setEditPlayer(true)}
                        className="btn btn-sm btn-primary margin-right">
                        ✏️
                    </button>
                ) : null}
                {isAdmin ? (
                    <button
                        disabled={deleting}
                        onClick={deletePlayer}
                        className="btn btn-sm btn-danger margin-right">
                        {deleting ? <LoadingSpinnerSmall /> : '🗑️'}
                    </button>
                ) : null}
                {deleting ? (
                    <s>{player.name}</s>
                ) : (
                    <Link
                        to={`/division/${division.name || division.id}/player:${player.name}@${player.team}/${season!.name}`}>
                        {player.captain ? <span>🤴 </span> : null}
                        {player.name}
                    </Link>
                )}
                {editPlayer && isAdmin ? renderEditPlayer() : null}
                {saveError ? (
                    <ErrorDisplay
                        {...saveError}
                        onClose={async () => setSaveError(null)}
                        title="Could not delete player"
                    />
                ) : null}
            </td>
            {hideVenue ? null : (
                <td>
                    {team.id === EMPTY_ID ? (
                        <span className="text-warning">{player.team}</span>
                    ) : (
                        <>
                            {isAdmin ||
                            season?.allowFavouriteTeams === false ? null : (
                                <ToggleFavouriteTeam teamId={player.teamId!} />
                            )}
                            <Link
                                to={`/division/${division.name || division.id}/team:${team.name}/${season!.name}`}
                                className="margin-right">
                                {deleting ? <s>{player.team}</s> : player.team}
                            </Link>
                        </>
                    )}
                </td>
            )}
            <td>{player.singles?.matchesPlayed}</td>
            <td>{player.singles?.matchesWon}</td>
            <td>{player.singles?.matchesLost}</td>
            <td>{player.points}</td>
            <td>{player.winPercentage}</td>
            <td>{player.oneEighties}</td>
            <td>{player.over100Checkouts}</td>
        </tr>
    );
}
