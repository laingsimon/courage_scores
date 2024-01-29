import React, {useEffect, useState} from 'react';
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {propChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {EMPTY_ID} from "../../helpers/projection";
import {EmbedAwareLink} from "../common/EmbedAwareLink";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IDivisionPlayerDto} from "../../interfaces/dtos/Division/IDivisionPlayerDto";
import {ITeamDto} from "../../interfaces/dtos/Team/ITeamDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export interface IDivisionPlayerProps {
    player: IDivisionPlayerDto;
    hideVenue: boolean;
}

export function DivisionPlayer({player, hideVenue}: IDivisionPlayerProps) {
    const {account, reloadTeams} = useApp();
    const {id: divisionId, season, onReloadDivision, name: divisionName} = useDivisionData();
    const [playerDetails, setPlayerDetails] = useState(Object.assign({}, player));
    const [editPlayer, setEditPlayer] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<ITeamDto> | null>(null);
    const isAdmin: boolean = account && account.access && account.access.managePlayers;
    const team: ITeamDto = {
        id: player.teamId,
        name: player.team,
        address: '',
    };
    const {playerApi} = useDependencies();

    useEffect(() => {
        setPlayerDetails(Object.assign({}, player));
    }, [player]);

    async function playerDetailSaved() {
        await onReloadDivision();
        await reloadTeams();
        setEditPlayer(false);
    }

    function renderEditPlayer() {
        return (<Dialog title={`Edit player: ${player.name}`}>
            <EditPlayerDetails
                gameId={null}
                player={playerDetails}
                team={team}
                seasonId={season.id}
                divisionId={divisionId}
                onCancel={async () => setEditPlayer(false)}
                onChange={propChanged(playerDetails, setPlayerDetails)}
                onSaved={playerDetailSaved}
            />
        </Dialog>)
    }

    async function deletePlayer() {
        /* istanbul ignore next */
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${player.name}?`)) {
            return;
        }

        setDeleting(true);
        try {
            const response: IClientActionResultDto<ITeamDto> = await playerApi.delete(season.id, player.teamId, player.id);
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

    return (<tr>
        <td>{player.rank}</td>
        <td>
            {isAdmin
                ? (<button disabled={deleting} onClick={() => setEditPlayer(true)}
                           className="btn btn-sm btn-primary margin-right">✏️</button>)
                : null}
            {isAdmin
                ? (<button disabled={deleting} onClick={deletePlayer} className="btn btn-sm btn-danger margin-right">
                    {deleting
                        ? (<LoadingSpinnerSmall/>)
                        : '🗑️'}</button>)
                : null}
            {deleting
                ? (<s>{player.name}</s>)
                : (<EmbedAwareLink to={`/division/${divisionName}/player:${player.name}@${player.team}/${season.name}`}>
                    {player.captain ? (<span>🤴 </span>) : null}
                    {player.name}
                </EmbedAwareLink>)}
            {editPlayer && isAdmin ? renderEditPlayer() : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                        title="Could not delete player"/>) : null}
        </td>
        {hideVenue
            ? null
            : (<td>
                {team.id === EMPTY_ID
                    ? (<span className="text-warning">{player.team}</span>)
                    : (<EmbedAwareLink to={`/division/${divisionName}/team:${team.name}/${season.name}`}
                                       className="margin-right">
                        {deleting ? (<s>{player.team}</s>) : player.team}
                    </EmbedAwareLink>)}
            </td>)}
        <td>{player.singles.matchesPlayed}</td>
        <td>{player.singles.matchesWon}</td>
        <td>{player.singles.matchesLost}</td>
        <td>{player.points}</td>
        <td>{player.winPercentage}</td>
        <td>{player.oneEighties}</td>
        <td>{player.over100Checkouts}</td>
    </tr>);
}
