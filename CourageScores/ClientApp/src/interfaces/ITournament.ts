import {TournamentGameDto} from "./models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "./models/dtos/DivisionDto";
import {GameMatchOptionDto} from "./models/dtos/Game/GameMatchOptionDto";
import {ITournamentPlayerMap} from "../components/division_fixtures/tournaments/Tournament";
import {SeasonDto} from "./models/dtos/Season/SeasonDto";
import {ISelectablePlayer} from "../components/division_players/PlayerSelection";

export interface ITournament {
    tournamentData: TournamentGameDto;
    setTournamentData?: (newData: TournamentGameDto) => Promise<any>;
    season?: SeasonDto;
    division?: DivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?: (preventLoading?: boolean) => Promise<TournamentGameDto>;
    setWarnBeforeSave?: (warning: string) => Promise<any>;
    matchOptionDefaults?: GameMatchOptionDto;
}