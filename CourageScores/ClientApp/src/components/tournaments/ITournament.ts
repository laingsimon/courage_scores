import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {IPlayerIdToTeamMap, ITournamentPlayerMap} from "./Tournament";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {ISelectablePlayer} from "../common/PlayerSelection";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";

export interface ITournament {
    tournamentData: TournamentGameDto;
    setTournamentData?(newData: TournamentGameDto): UntypedPromise;
    season?: SeasonDto;
    division?: DivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?(preventLoading?: boolean): Promise<TournamentGameDto | undefined>;
    setWarnBeforeEditDialogClose?(warning: string | null): UntypedPromise;
    matchOptionDefaults?: GameMatchOptionDto;
    saving?: boolean;
    editTournament?: string;
    setEditTournament?(edit: string): UntypedPromise;
    preventScroll: boolean;
    setPreventScroll(prevent: boolean): void;
    draggingSide?: TournamentSideDto;
    setDraggingSide(side?: TournamentSideDto): UntypedPromise;
    newMatch: TournamentMatchDto;
    setNewMatch(match: TournamentMatchDto): UntypedPromise;
    playerIdToTeamMap: IPlayerIdToTeamMap;
}