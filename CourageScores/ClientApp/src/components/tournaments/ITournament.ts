import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ITournamentPlayerMap} from "./Tournament";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {ISelectablePlayer} from "../common/PlayerSelection";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITournament {
    tournamentData: TournamentGameDto;
    setTournamentData?(newData: TournamentGameDto, save?: boolean): UntypedPromise;
    season?: SeasonDto;
    division?: DivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?(preventLoading?: boolean): Promise<TournamentGameDto | undefined>;
    matchOptionDefaults?: GameMatchOptionDto;
    setEditTournament?(edit: boolean): UntypedPromise;
}