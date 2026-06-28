import { useState } from 'react';
import { EditTeamDetails } from './EditTeamDetails.tsx';
import { Dialog } from '../common/Dialog.tsx';
import { propChanged } from '../../helpers/events.ts';
import { useApp } from '../common/AppContainer.tsx';
import { useDivisionData } from '../league/DivisionDataContainer.tsx';
import { AssignTeamToSeasons } from './AssignTeamToSeasons.tsx';
import { DivisionTeamDto } from '../../interfaces/models/dtos/Division/DivisionTeamDto.ts';
import { EditTeamDto } from '../../interfaces/models/dtos/Team/EditTeamDto.ts';
import { ToggleFavouriteTeam } from '../common/ToggleFavouriteTeam.tsx';
import { usePreferences } from '../common/PreferencesContainer.tsx';
import { any } from '../../helpers/collections.ts';
import { Link } from 'react-router';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface IDivisionTeamProps {
    team: DivisionTeamDto;
}

export function DivisionTeam({ team }: IDivisionTeamProps) {
    const {
        id: divisionId,
        season,
        onReloadDivision,
        name: divisionName,
        favouritesEnabled,
    } = useDivisionData();
    const { account, onError, reloadTeams } = useApp();
    const [teamDetails, setTeamDetails] = useState<EditTeamDto>(
        Object.assign({ newDivisionId: divisionId }, team),
    );
    const [editTeam, setEditTeam] = useState<boolean>(false);
    const [addTeamToSeason, setAddTeamToSeason] = useState<boolean>(false);
    const isAdmin = hasAccess(account, AccessOption.manageTeams);
    const { getPreference } = usePreferences();
    const favouriteTeamIds: string[] =
        getPreference<string[]>('favouriteTeamIds') || [];
    const teamIsFavourite: boolean = any(
        favouriteTeamIds,
        (id) => id === team.id,
    );
    const notAFavourite: boolean = any(favouriteTeamIds) && !teamIsFavourite;

    async function teamDetailSaved() {
        await reloadTeams();
        await onReloadDivision();

        setEditTeam(false);
    }

    function renderEditTeam() {
        try {
            return (
                <Dialog title={`Edit team: ${team.name}`}>
                    <EditTeamDetails
                        divisionId={divisionId!}
                        seasonId={season!.id!}
                        team={teamDetails}
                        lastUpdated={team.updated}
                        onCancel={async () => setEditTeam(false)}
                        onChange={propChanged(teamDetails, setTeamDetails)}
                        onSaved={teamDetailSaved}
                    />
                </Dialog>
            );
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function renderAddTeamToSeason() {
        try {
            return (
                <Dialog title="Assign seasons">
                    <AssignTeamToSeasons
                        teamOverview={team}
                        onClose={async () => setAddTeamToSeason(false)}
                    />
                </Dialog>
            );
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    const division: DivisionDto = team.division || {
        id: divisionId!,
        name: divisionName,
    };

    try {
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
                <td>
                    {isAdmin ? (
                        <button
                            onClick={() => setEditTeam(true)}
                            className="btn btn-sm btn-primary margin-right d-print-none">
                            ✏️
                        </button>
                    ) : null}
                    {isAdmin ? (
                        <button
                            onClick={() => setAddTeamToSeason(true)}
                            className="btn btn-sm btn-primary margin-right d-print-none">
                            ➕
                        </button>
                    ) : null}
                    {isAdmin || season?.allowFavouriteTeams === false ? null : (
                        <ToggleFavouriteTeam teamId={team.id!} />
                    )}
                    <Link
                        to={`/division/${division.name || division.id}/team:${team.name}/${season!.name}`}>
                        {team.name}
                    </Link>
                    {editTeam && isAdmin ? renderEditTeam() : null}
                    {addTeamToSeason && isAdmin
                        ? renderAddTeamToSeason()
                        : null}
                </td>
                <td>{team.played}</td>
                <td>{team.points}</td>
                <td>{team.fixturesWon}</td>
                <td>{team.fixturesLost}</td>
                <td>{team.fixturesDrawn}</td>
                <td>{team.difference}</td>
            </tr>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
