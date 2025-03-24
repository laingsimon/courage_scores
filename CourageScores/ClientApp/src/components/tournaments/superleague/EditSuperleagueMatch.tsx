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
import {any, sortBy} from "../../../helpers/collections";
import {TeamPlayerDto} from "../../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {NEW_PLAYER} from "../../scores/MatchPlayerSelection";
import {useState} from "react";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {propChanged} from "../../../helpers/events";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {TeamSeasonDto} from "../../../interfaces/models/dtos/Team/TeamSeasonDto";

export interface IEditSuperleagueMatchProps {
    index?: number;
    match: TournamentMatchDto;
    tournamentData: TournamentGameDto;
    setMatchData(update: TournamentMatchDto): UntypedPromise;
    deleteMatch?(): UntypedPromise;
    preventScroll?: boolean;
    readOnly?: boolean;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean>;
}

export function EditSuperleagueMatch({ index, match, tournamentData, setMatchData, preventScroll, readOnly, patchData, deleteMatch }: IEditSuperleagueMatchProps) {
    const {teams, reloadTeams} = useApp();
    const oddNumberedMatch: boolean = ((index ?? 0) + 1) % 2 !== 0;
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs: tournamentData.bestOf,
    };
    const newPlayer: IBootstrapDropdownItem = {
        text: '➕ New Player/s',
        value: NEW_PLAYER,
    }
    const hostPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(tournamentData.host!, getAlreadySelected('sideA'));
    const opponentPlayers: IBootstrapDropdownItem[] = getPlayersForTeamName(tournamentData.opponent!, getAlreadySelected('sideB'));
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<TeamDto | null>(null);
    const [newPlayerDetails, setNewPlayerDetails] = useState<EditTeamPlayerDto | null>(null);

    function getAlreadySelected(side: 'sideA' | 'sideB'): TeamPlayerDto[] {
        return tournamentData.round?.matches!
            .filter((_: TournamentMatchDto, i: number) => i !== index)
            .flatMap((match: TournamentMatchDto) => {
                const matchSide: TournamentSideDto = match[side];
                return matchSide.players || [];
            }) || [];
    }

    function getPlayersForTeamName(name: string, alreadySelected: TeamPlayerDto[]): IBootstrapDropdownItem[] {
        return teams
            .filter((t: TeamDto) => t.name === name)
            .map(t => t.seasons!.find((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId && !ts.deleted))
            .flatMap(ts => ts?.players || [])
            .sort(sortBy('name'))
            .filter(p => !any(alreadySelected, selected => selected.id === p.id))
            .map((p: TeamPlayerDto): IBootstrapDropdownItem => {
                return {
                    text: p.name,
                    value: p.id
                }
        });
    }

    async function changeHostSide(playerId: string) {
        await changeSide(playerId, 'sideA', hostPlayers);
    }

    async function changeOpponentSide(playerId: string) {
        await changeSide(playerId, 'sideB', opponentPlayers);
    }

    async function changeSide(playerId: string, side: 'sideA' | 'sideB', players: IBootstrapDropdownItem[]) {
        if (playerId === NEW_PLAYER) {
            const teamName = side === 'sideA' ? tournamentData.host! : tournamentData.opponent!;
            const team = teams.find((t: TeamDto) => t.name === teamName)!;
            setNewPlayerDetails({name: '', captain: false});
            setAddPlayerDialogOpen(team);
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

    async function reloadPlayers() {
        await reloadTeams();
        setAddPlayerDialogOpen(null);
        setNewPlayerDetails(null);
    }

    return (<tr key={match.id}>
        <td>
            {deleteMatch ? <button className="btn btn-sm btn-danger no-wrap" onClick={deleteMatch}>🗑️ {index === undefined ? null : index + 1}</button> : null}
        </td>
        <td>
            {readOnly
                ? (preventScroll ? '' : match.sideA?.name)
                : <BootstrapDropdown value={match.sideA?.players![0]?.id} options={hostPlayers.concat(newPlayer)} onChange={changeHostSide} />}
        </td>
        <td>v</td>
        <td>
            {readOnly
                ? (preventScroll ? '' : match.sideB?.name)
                : <BootstrapDropdown value={match.sideB?.players![0]?.id} options={opponentPlayers.concat(newPlayer)} onChange={changeOpponentSide} />}
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
                initialOneDartAverage={true} />}

            {addPlayerDialogOpen ? renderCreatePlayerDialog(addPlayerDialogOpen!) : null}
        </td>
    </tr>);
}