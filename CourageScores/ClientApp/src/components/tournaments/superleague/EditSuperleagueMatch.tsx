import {MatchSayg} from "../MatchSayg";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {UntypedPromise} from "../../../interfaces/UntypedPromise";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {useApp} from "../../common/AppContainer";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {any} from "../../../helpers/collections";
import {TeamPlayerDto} from "../../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {NEW_PLAYER} from "../../scores/MatchPlayerSelection";
import {useState} from "react";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {propChanged} from "../../../helpers/events";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {TeamSeasonDto} from "../../../interfaces/models/dtos/Team/TeamSeasonDto";
import {useTournament} from "../TournamentContainer";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {hasAccess} from "../../../helpers/conditions";

export interface IEditSuperleagueMatchProps {
    index?: number;
    match: TournamentMatchDto;
    tournamentData: TournamentGameDto;
    setMatchData(update: TournamentMatchDto): UntypedPromise;
    deleteMatch?(): UntypedPromise;
    readOnly?: boolean;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean>;
}

export function EditSuperleagueMatch({ index, match, tournamentData, setMatchData, readOnly, patchData, deleteMatch }: IEditSuperleagueMatchProps) {
    const {teams, reloadTeams, onError, account} = useApp();
    const {alreadyPlaying} = useTournament();
    const oddNumberedMatch: boolean = ((index ?? 0) + 1) % 2 !== 0;
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs: tournamentData.bestOf || 7,
    };
    const newPlayer: IBootstrapDropdownItem = {
        text: '➕ New Player/s',
        value: NEW_PLAYER,
    }
    const hostPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(tournamentData.host!, getAlreadySelected('sideA'));
    const opponentPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(tournamentData.opponent!, getAlreadySelected('sideB'));
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<TeamDto | null>(null);
    const [newPlayerDetails, setNewPlayerDetails] = useState<EditTeamPlayerDto | null>(null);
    const canManagePlayers = hasAccess(account, a => a.managePlayers);
    const [editingPlayer, setEditingPlayer] = useState<TeamPlayerDto | null>(null);
    const [editingPlayerTeam, setEditingPlayerTeam] = useState<TeamDto | null>(null);

    function getAlreadySelected(side: 'sideA' | 'sideB'): TeamPlayerDto[] {
        return tournamentData.round?.matches!
            .filter((_: TournamentMatchDto, i: number) => i !== index)
            .flatMap((match: TournamentMatchDto) => {
                const matchSide: TournamentSideDto = match[side];
                return matchSide.players || [];
            }) || [];
    }

    function getTeam(name?: string): TeamDto | undefined {
        return teams.filter((t: TeamDto) => t.name === name)[0];
    }

    function getPlayersForTeamName(name: string, alreadySelected: TeamPlayerDto[]): IBootstrapDropdownItem[] {
        const selectedForThisMatch = (match.sideA.players || []).concat(match.sideB.players || []);

        return teams
            .filter((t: TeamDto) => t.name === name)
            .map(t => t.seasons!.find((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId && !ts.deleted))
            .flatMap(ts => ts?.players || [])
            .filter(p => !any(alreadySelected, selected => selected.id === p.id))
            .map((p: TeamPlayerDto): IBootstrapDropdownItem => {
                const playingInAnotherTournament: DivisionTournamentFixtureDetailsDto | undefined = alreadyPlaying![p.id];
                const isSelected = any(selectedForThisMatch, selectedForMatch => selectedForMatch.id === p.id);

                return {
                    text: playingInAnotherTournament
                        ? <span className={isSelected ? '' : 'text-secondary'}>🚫 {p.name} (playing on {playingInAnotherTournament.type})</span>
                        : p.name,
                    value: p.id,
                    collapsedText: p.name,
                    disabled: !isSelected && !!playingInAnotherTournament,
                } as IBootstrapDropdownItem
        }).sort(playerSort(selectedForThisMatch));
    }

    function playerSort(alreadySelected: TeamPlayerDto[]): (optionA: IBootstrapDropdownItem, optionB: IBootstrapDropdownItem) => number {
        function getSortableKey(option: IBootstrapDropdownItem): string {
            const playingInAnotherTournament: DivisionTournamentFixtureDetailsDto | undefined = alreadyPlaying![option.value];
            const isSelected = any(alreadySelected, p => p.id === option.value);
            return `${playingInAnotherTournament && !isSelected ? 'B' : 'A'}|${option.collapsedText}`;
        }

        return (optionA: IBootstrapDropdownItem, optionB: IBootstrapDropdownItem): number => {
            const sortableA = getSortableKey(optionA);
            const sortableB = getSortableKey(optionB);

            return sortableA.localeCompare(sortableB);
        };
    }

    async function changeHostSide(playerId: string) {
        await changeSide(playerId, 'sideA', hostPlayers);
    }

    async function changeOpponentSide(playerId: string) {
        await changeSide(playerId, 'sideB', opponentPlayers);
    }

    async function changeSide(playerId: string, side: 'sideA' | 'sideB', players: IBootstrapDropdownItem[]) {
        try {
            if (playerId === NEW_PLAYER) {
                const teamName = side === 'sideA' ? tournamentData.host! : tournamentData.opponent!;
                const team = teams.find((t: TeamDto) => t.name === teamName);
                if (team) {
                    setAddPlayerDialogOpen(team);
                    setNewPlayerDetails({name: '', captain: false});
                }
                else {
                    onError(`Unable to find team with name '${teamName}'`);
                }
                return;
            }

            const newMatch = Object.assign({}, match);
            newMatch[side] = Object.assign({}, newMatch[side]);
            const player = players.find(p => p.value === playerId)!;
            newMatch[side].players = [{
                id: playerId,
                name: player.text
            }];
            newMatch[side].name = player.text;

            await setMatchData(newMatch);
        } catch (e) {
            // istanbul ignore next
            onError(e);
        }
    }

    async function patchRoundData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string) {
        if (!nestInRound) {
            // no need to pass this up, super-league tournaments don't record 180s and hi-checks differently
            return;
        }

        const roundPatch: PatchTournamentRoundDto = patch as PatchTournamentRoundDto;
        if (patchData) {
            await patchData(roundPatch, nestInRound, saygId);
        }
    }

    function renderCreatePlayerDialog(team: TeamDto) {
        return (<Dialog title={`Add player/s for ${team.name}`}>
            <EditPlayerDetails
                player={newPlayerDetails!}
                seasonId={tournamentData.seasonId!}
                divisionId={tournamentData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={async () => setAddPlayerDialogOpen(null)}
                onSaved={reloadPlayers}
                team={team}
                initialMultiple={true} />
        </Dialog>);
    }

    function editPlayer(playerToFind: TeamPlayerDto, team: TeamDto) {
        const teamSeason = team.seasons!.filter(ts => ts.seasonId === tournamentData.seasonId && !ts.deleted)[0];
        const player = teamSeason.players!.filter(p => p.id === playerToFind.id)[0];

        if (!player) {
            alert(`Unable to find player ${playerToFind.name} (id: ${playerToFind.id}) in team ${team.name}`);
            return;
        }

        setEditingPlayer(player);
        setEditingPlayerTeam(team);
    }

    function renderEditPlayer() {
        return (<Dialog title={`Edit player: ${editingPlayer!.name}`}>
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
        </Dialog>)
    }

    async function playerDetailSaved() {
        await reloadTeams();

        const newMatch = Object.assign({}, match);
        const sideDesignation: 'sideA' | 'sideB' = editingPlayerTeam!.name === tournamentData.host ? 'sideA' : 'sideB';
        const newSide = Object.assign({}, newMatch[sideDesignation]);
        newSide.name = editingPlayer!.name;
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
        if (canManagePlayers) {
            return players.concat(newPlayer);
        }

        return players;
    }

    try {
        return (<tr key={match.id}>
            <td>
                {deleteMatch && !readOnly
                    ? <button className="btn btn-sm btn-danger no-wrap" onClick={deleteMatch}>🗑️ {index! + 1}</button>
                    : (index === undefined ? null : index + 1)}
            </td>
            <td className="no-wrap">
                {!readOnly && canManagePlayers && match.sideA?.players![0]
                    ? (<button className="btn btn-sm btn-outline-primary me-1" onClick={() => editPlayer(match.sideA!.players![0], getTeam(tournamentData.host)!)}>✏️</button>)
                    : null}
                {readOnly
                    ? match.sideA?.name
                    : <BootstrapDropdown value={match.sideA?.players![0]?.id} options={appendNewPlayer(hostPlayers)} onChange={changeHostSide}/>}
            </td>
            <td>v</td>
            <td className="no-wrap">
                {readOnly
                    ? match.sideB?.name
                    : <BootstrapDropdown value={match.sideB?.players![0]?.id} options={appendNewPlayer(opponentPlayers)} onChange={changeOpponentSide}/>}
                {!readOnly && canManagePlayers && match.sideB?.players![0]
                    ? (<button className="btn btn-sm btn-outline-primary ms-1" onClick={() => editPlayer(match.sideB!.players![0], getTeam(tournamentData.opponent)!)}>✏️</button>)
                    : null}
            </td>
            <td className="d-print-none">
                {index === undefined ? null : <MatchSayg
                    match={match}
                    matchOptions={matchOptions}
                    matchIndex={index}
                    patchData={patchRoundData}
                    readOnly={readOnly}
                    showViewSayg={true}
                    firstLegPlayerSequence={oddNumberedMatch ? ['away', 'home'] : ['home', 'away']}
                    finalLegPlayerSequence={oddNumberedMatch ? ['away', 'home'] : ['home', 'away']}
                    initialOneDartAverage={true}/>}

                {addPlayerDialogOpen ? renderCreatePlayerDialog(addPlayerDialogOpen!) : null}
                {editingPlayer ? renderEditPlayer() : null}
            </td>
        </tr>);
    } catch (e) {
        // istanbul ignore next
        onError(e);
    }
}