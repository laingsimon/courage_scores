import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ITournamentPlayerMap} from "./Tournament";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {ISelectablePlayer} from "../common/PlayerSelection";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

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
}