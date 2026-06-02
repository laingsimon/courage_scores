import { MatchSayg } from '../MatchSayg.tsx';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto.ts';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../../common/BootstrapDropdown.tsx';
import { TeamDto } from '../../../interfaces/models/dtos/Team/TeamDto.ts';
import { GameMatchOptionDto } from '../../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { useApp } from '../../common/AppContainer.tsx';
import { PatchTournamentDto } from '../../../interfaces/models/dtos/Game/PatchTournamentDto.ts';
import { PatchTournamentRoundDto } from '../../../interfaces/models/dtos/Game/PatchTournamentRoundDto.ts';
import { any, skip, take } from '../../../helpers/collections.ts';
import { TeamPlayerDto } from '../../../interfaces/models/dtos/Team/TeamPlayerDto.ts';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto.ts';
import { NEW_PLAYER } from '../../scores/MatchPlayerSelection.tsx';
import { useState } from 'react';
import { Dialog } from '../../common/Dialog.tsx';
import { EditPlayerDetails } from '../../division_players/EditPlayerDetails.tsx';
import { propChanged } from '../../../helpers/events.ts';
import { EditTeamPlayerDto } from '../../../interfaces/models/dtos/Team/EditTeamPlayerDto.ts';
import { useTournament } from '../TournamentContainer.tsx';
import { DivisionTournamentFixtureDetailsDto } from '../../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto.ts';
import { hasAccess } from '../../../helpers/conditions.ts';
import { getTeamSeasons } from '../../../helpers/teams.ts';
import { repeat } from '../../../helpers/projection.ts';
import { matchPlayerFilter } from '../../../helpers/superleague.ts';
import { TeamSeasonDto } from '../../../interfaces/models/dtos/Team/TeamSeasonDto.ts';
import { TournamentGameDto } from '../../../interfaces/models/dtos/Game/TournamentGameDto.ts';
import { UntypedPromise } from '../../../interfaces/UntypedPromise.ts';
import { TournamentPlayerDto } from '../../../interfaces/models/dtos/Game/TournamentPlayerDto.ts';
import { IPlayerSizeTournamentPlayerMap } from '../Tournament.tsx';

export interface TeamAndSeason {
    team: TeamDto;
    season: TeamSeasonDto;
}

export interface IEditSuperleagueMatchProps {
    index?: number;
    match: TournamentMatchDto;
    tournamentData: TournamentGameDto;
    setMatchData(update: TournamentMatchDto): UntypedPromise;
    deleteMatch?(): UntypedPromise;
    readOnly?: boolean;
    patchData?(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ): Promise<boolean>;
    newMatch?: boolean;
    matchNumber?: number;
    playerCount: number;
    numberOfLegs: number;
    useFirstNameOnly?: boolean;
    showFullNames?: boolean;
}

export function EditSuperleagueMatch({
    index,
    match,
    tournamentData,
    setMatchData,
    readOnly,
    patchData,
    deleteMatch,
    newMatch,
    matchNumber,
    playerCount,
    numberOfLegs,
    useFirstNameOnly,
    showFullNames,
}: IEditSuperleagueMatchProps) {
    const { teams, reloadTeams, onError, account } = useApp();
    const { alreadyPlaying } = useTournament();
    const oddNumberedMatch: boolean = (matchNumber ?? 1) % 2 !== 0;
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs,
    };
    const canManagePlayers = hasAccess(
        account,
        (a) => a.managePlayers && a.manageTeams,
    );
    const newPlayer: IBootstrapDropdownItem = {
        text: canManagePlayers ? (
            '➕ New Player/s'
        ) : (
            <span className="text-secondary">
                ➕ New Player/s (you need 'Manage players' and 'Manage teams'
                permission)
            </span>
        ),
        value: NEW_PLAYER,
        disabled: !canManagePlayers,
    };
    const hostPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(
        tournamentData.host!,
        getAlreadySelected('sideA'),
    );
    const opponentPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(
        tournamentData.opponent!,
        getAlreadySelected('sideB'),
    );
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] =
        useState<TeamDto | null>(null);
    const [newPlayerDetails, setNewPlayerDetails] =
        useState<EditTeamPlayerDto | null>(null);
    const [editingPlayer, setEditingPlayer] = useState<TeamPlayerDto | null>(
        null,
    );
    const [editingPlayerTeam, setEditingPlayerTeam] = useState<TeamDto | null>(
        null,
    );

    function getAlreadySelected(side: 'sideA' | 'sideB'): TeamPlayerDto[] {
        const thisMatchSide = match[side]!;

        return (
            tournamentData.round?.matches
                ?.filter(matchPlayerFilter(playerCount))
                .flatMap((match: TournamentMatchDto) => {
                    const matchSide: TournamentSideDto | undefined =
                        match[side];
                    return matchSide?.players?.filter((p) => !!p) || [];
                }) || []
        ).concat(thisMatchSide.players ?? []);
    }

    function getTeamSeason(name?: string): TeamAndSeason | undefined {
        const seasonId = tournamentData.seasonId;
        const teamsByName = teams.filter((t: TeamDto) => t.name === name);

        return teamsByName.flatMap(
            (team) =>
                getTeamSeasons(team, seasonId).map((ts) => ({
                    team,
                    season: ts,
                })) ?? [],
        )[0];
    }

    function getPlayersForTeamName(
        name: string,
        alreadySelected: TeamPlayerDto[],
    ): IBootstrapDropdownItem[] {
        const selectedForThisMatch = (match.sideA?.players || []).concat(
            match.sideB?.players || [],
        );

        const team = getTeamSeason(name);
        return (team?.season?.players ?? [])
            .filter(
                (p) =>
                    !any(alreadySelected, (selected) => selected.id === p.id),
            )
            .map((p: TeamPlayerDto): IBootstrapDropdownItem => {
                const sameCountPlayersInOtherTournaments: IPlayerSizeTournamentPlayerMap =
                    alreadyPlaying?.[`${playerCount}`] ?? {};

                const playingInAnotherTournament:
                    | DivisionTournamentFixtureDetailsDto
                    | undefined = sameCountPlayersInOtherTournaments[p.id];
                const isSelected = any(
                    selectedForThisMatch,
                    (selectedForMatch) => selectedForMatch.id === p.id,
                );

                return playerOption(
                    p,
                    isSelected,
                    playingInAnotherTournament,
                    team,
                );
            })
            .sort(playerSort(selectedForThisMatch));
    }

    function playerOption(
        p: TournamentPlayerDto,
        isSelected?: boolean,
        playingInAnotherTournament?: DivisionTournamentFixtureDetailsDto,
        team?: TeamAndSeason,
    ): IBootstrapDropdownItem {
        return {
            text: playingInAnotherTournament ? (
                <span className={isSelected ? '' : 'text-secondary'}>
                    🚫 {p.name} (playing on {playingInAnotherTournament.type})
                </span>
            ) : (
                playerName(p, team)
            ),
            value: p.id,
            collapsedText: p.name,
            disabled: !isSelected && !!playingInAnotherTournament,
        };
    }

    function playerName(player: TournamentPlayerDto, team?: TeamAndSeason) {
        const players = team?.season?.players ?? [];

        const otherPlayersWithSameName = players
            .filter((p) => p.id !== player.id)
            .filter(
                (p) =>
                    p.name.trim().toLowerCase() ===
                    player.name.trim().toLowerCase(),
            );

        return otherPlayersWithSameName.length === 0
            ? player.name
            : `${player.name} (${player.id.substring(0, 8)})`;
    }

    function playerSort(
        alreadySelected: TeamPlayerDto[],
    ): (
        optionA: IBootstrapDropdownItem,
        optionB: IBootstrapDropdownItem,
    ) => number {
        function getSortableKey(option: IBootstrapDropdownItem): string {
            const sameCountPlayersInOtherTournaments: IPlayerSizeTournamentPlayerMap =
                alreadyPlaying?.[`${playerCount}`] ?? {};

            const playingInAnotherTournament:
                | DivisionTournamentFixtureDetailsDto
                | undefined = sameCountPlayersInOtherTournaments[option.value!];
            const isSelected = any(
                alreadySelected,
                (p) => p.id === option.value,
            );
            return `${playingInAnotherTournament && !isSelected ? 'B' : 'A'}|${option.collapsedText}`;
        }

        return (
            optionA: IBootstrapDropdownItem,
            optionB: IBootstrapDropdownItem,
        ): number => {
            const sortableA = getSortableKey(optionA);
            const sortableB = getSortableKey(optionB);

            return sortableA.localeCompare(sortableB);
        };
    }

    async function changeHostSide(playerId: string, index: number) {
        await changeSide(
            playerId,
            'sideA',
            prependSelectedPlayer(
                hostPlayers,
                match.sideA?.players?.[index],
                tournamentData.host,
            ),
            index,
        );
    }

    async function changeOpponentSide(playerId: string, index: number) {
        await changeSide(
            playerId,
            'sideB',
            prependSelectedPlayer(
                opponentPlayers,
                match.sideB?.players?.[index],
                tournamentData.opponent,
            ),
            index,
        );
    }

    async function changeSide(
        playerId: string,
        side: 'sideA' | 'sideB',
        players: IBootstrapDropdownItem[],
        index: number,
    ) {
        try {
            if (playerId === NEW_PLAYER) {
                const teamName =
                    side === 'sideA'
                        ? tournamentData.host!
                        : tournamentData.opponent!;
                const teamSeason = getTeamSeason(teamName);
                if (teamSeason) {
                    setAddPlayerDialogOpen(getTeamSeason(teamName)!.team);
                    setNewPlayerDetails({ name: '', captain: false });
                } else {
                    onError(`Unable to find team with name '${teamName}'`);
                }
                return;
            }

            const newMatch = Object.assign({}, match);
            newMatch[side] = Object.assign({}, newMatch[side]);
            const player = players.find((p) => p.value === playerId)!;
            const sidePlayer = {
                id: playerId,
                name: player.collapsedText,
            };
            newMatch[side].players = repeat(playerCount, (i) => {
                const currentPlayer = newMatch[side]?.players?.[i];
                return i === index ? sidePlayer : currentPlayer;
            }).filter((p) => !!p);
            newMatch[side].name = newMatch[side].players
                .map((p) => (useFirstNameOnly ? firstNameOnly(p.name) : p.name))
                .join(' & ');

            await setMatchData(newMatch);
        } catch (e) {
            // istanbul ignore next
            onError(e);
        }
    }

    function firstNameOnly(name?: string): string {
        const names: string[] = name?.split(' ') || [];
        return names.length >= 1 ? names[0] : (name ?? '');
    }

    async function patchRoundData(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ) {
        if (!nestInRound) {
            // no need to pass this up, super-league tournaments don't record 180s and hi-checks differently
            return;
        }

        const roundPatch = patch as PatchTournamentRoundDto;
        if (patchData) {
            await patchData(roundPatch, nestInRound, saygId);
        }
    }

    function renderCreatePlayerDialog(team: TeamDto) {
        return (
            <Dialog title={`Add player/s for ${team.name}`}>
                <EditPlayerDetails
                    player={newPlayerDetails!}
                    seasonId={tournamentData.seasonId!}
                    divisionId={tournamentData.divisionId}
                    onChange={propChanged(
                        newPlayerDetails,
                        setNewPlayerDetails,
                    )}
                    onCancel={async () => setAddPlayerDialogOpen(null)}
                    onSaved={reloadPlayers}
                    team={team}
                    initialMultiple={true}
                />
            </Dialog>
        );
    }

    function editPlayer(playerToFind: TeamPlayerDto, team: TeamAndSeason) {
        const player = team.season.players!.filter(
            (p) => p.id === playerToFind.id,
        )[0];

        if (!player) {
            alert(
                `Unable to find player ${playerToFind.name} (id: ${playerToFind.id}) in team ${team.team.name}`,
            );
            return;
        }

        setEditingPlayer(player);
        setEditingPlayerTeam(team.team);
    }

    function renderEditPlayer() {
        return (
            <Dialog title={`Edit player: ${editingPlayer!.name}`}>
                <EditPlayerDetails
                    gameId={undefined}
                    player={editingPlayer!}
                    team={editingPlayerTeam!}
                    seasonId={tournamentData.seasonId!}
                    divisionId={tournamentData.divisionId}
                    onCancel={async () => setEditingPlayer(null)}
                    onChange={propChanged(editingPlayer, setEditingPlayer)}
                    onSaved={playerDetailSaved}
                />
            </Dialog>
        );
    }

    async function playerDetailSaved() {
        await reloadTeams();

        const newMatch = Object.assign({}, match);
        const sideDesignation: 'sideA' | 'sideB' =
            editingPlayerTeam!.name === tournamentData.host ? 'sideA' : 'sideB';
        const newSide = Object.assign({}, newMatch[sideDesignation]);
        newSide.name = editingPlayer!.name;
        newSide.players = newSide.players?.map(
            (p: TournamentPlayerDto): TournamentPlayerDto => {
                if (p.id === editingPlayer!.id) {
                    const updatedMatchPlayer = Object.assign({}, p);
                    updatedMatchPlayer.name = editingPlayer!.name;
                    return updatedMatchPlayer;
                }

                return p;
            },
        );

        newMatch[sideDesignation] = newSide;
        await setMatchData(newMatch);

        setEditingPlayerTeam(null);
        setEditingPlayer(null);
    }

    async function reloadPlayers() {
        await reloadTeams();
        setAddPlayerDialogOpen(null);
        setNewPlayerDetails(null);
    }

    function appendNewPlayer(players: IBootstrapDropdownItem[]) {
        const indexOfFirstDisabledPlayer = players.findIndex(
            (op) => op.disabled && op.value !== newPlayer.value, // TODO: Do something more intelligent here
        );
        const noOfDisabledPlayers =
            indexOfFirstDisabledPlayer === -1
                ? players.length
                : indexOfFirstDisabledPlayer;

        const enabledPlayers = take(players, noOfDisabledPlayers);
        const disabledPlayers = skip(players, noOfDisabledPlayers);
        return enabledPlayers.concat(newPlayer).concat(disabledPlayers);
    }

    function prependSelectedPlayer(
        players: IBootstrapDropdownItem[],
        selectedPlayer?: TournamentPlayerDto,
        teamName?: string,
    ) {
        if (!selectedPlayer || !teamName) {
            return players;
        }

        const team = getTeamSeason(teamName);

        const selectedPlayerOption = playerOption(
            selectedPlayer,
            true,
            undefined,
            team,
        );
        return [selectedPlayerOption].concat(players);
    }

    function hostSide(index: number) {
        return (
            <div key={index}>
                {canManagePlayers && match.sideA?.players![index] ? (
                    <button
                        className="btn btn-sm btn-outline-primary me-1 d-print-none"
                        onClick={() =>
                            editPlayer(
                                match.sideA!.players![index],
                                getTeamSeason(tournamentData.host)!,
                            )
                        }>
                        ✏️
                    </button>
                ) : null}
                <BootstrapDropdown
                    value={match.sideA?.players![index]?.id}
                    options={prependSelectedPlayer(
                        appendNewPlayer(hostPlayers),
                        match.sideA?.players?.[index],
                        tournamentData.host,
                    )}
                    onChange={(v) => changeHostSide(v!, index)}
                    datatype={`player-index-${index}`}
                />
            </div>
        );
    }

    function opponentSide(index: number) {
        return (
            <div key={index}>
                <BootstrapDropdown
                    value={match.sideB?.players![index]?.id}
                    options={prependSelectedPlayer(
                        appendNewPlayer(opponentPlayers),
                        match.sideB?.players?.[index],
                        tournamentData.opponent,
                    )}
                    onChange={(v) => changeOpponentSide(v!, index)}
                    datatype={`player-index-${index}`}
                />
                {canManagePlayers && match.sideB?.players![index] ? (
                    <button
                        className="btn btn-sm btn-outline-primary ms-1 d-print-none"
                        onClick={() =>
                            editPlayer(
                                match.sideB!.players![index],
                                getTeamSeason(tournamentData.opponent)!,
                            )
                        }>
                        ✏️
                    </button>
                ) : null}
            </div>
        );
    }

    try {
        return (
            <tr key={match.id} className={!newMatch ? '' : 'd-print-none'}>
                <td>
                    {deleteMatch && !readOnly ? (
                        <button
                            className="btn btn-sm btn-danger no-wrap d-print-none"
                            onClick={deleteMatch}>
                            🗑️ {matchNumber}
                        </button>
                    ) : newMatch ? null : (
                        matchNumber
                    )}
                </td>
                <td className="no-wrap d-table-cell text-end">
                    {readOnly && match.sideA?.name}
                    {!readOnly && <>{repeat(playerCount, hostSide)}</>}
                </td>
                <td>v</td>
                <td className="no-wrap d-table-cell">
                    {readOnly && match.sideB?.name}
                    {!readOnly && <>{repeat(playerCount, opponentSide)}</>}
                </td>
                <td className="d-print-none">
                    {newMatch ? null : (
                        <MatchSayg
                            match={match}
                            matchOptions={matchOptions}
                            matchIndex={index!}
                            patchData={patchRoundData}
                            readOnly={readOnly}
                            showViewSayg={true}
                            firstLegPlayerSequence={
                                oddNumberedMatch
                                    ? ['away', 'home']
                                    : ['home', 'away']
                            }
                            finalLegPlayerSequence={
                                oddNumberedMatch
                                    ? ['away', 'home']
                                    : ['home', 'away']
                            }
                            initialOneDartAverage={true}
                            showFullNames={showFullNames}
                        />
                    )}

                    {addPlayerDialogOpen
                        ? renderCreatePlayerDialog(addPlayerDialogOpen!)
                        : null}
                    {editingPlayer ? renderEditPlayer() : null}
                </td>
            </tr>
        );
    } catch (e) {
        // istanbul ignore next
        onError(e);
    }
}
