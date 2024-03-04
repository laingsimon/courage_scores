import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ITournamentPlayerMap} from "./Tournament";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {ISelectablePlayer} from "../common/PlayerSelection";

export interface ITournament {
    tournamentData: TournamentGameDto;
    setTournamentData?(newData: TournamentGameDto): Promise<any>;
    season?: SeasonDto;
    division?: DivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?(preventLoading?: boolean): Promise<TournamentGameDto>;
    setWarnBeforeSave?(warning: string): Promise<any>;
    matchOptionDefaults?: GameMatchOptionDto;
    saving?: boolean;
    editTournament?: string;
    setEditTournament?(edit: string): Promise<any>;
}