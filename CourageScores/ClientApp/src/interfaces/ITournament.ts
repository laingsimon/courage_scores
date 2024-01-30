import {ITournamentGameDto} from "./models/dtos/Game/ITournamentGameDto";
import {IDivisionDto} from "./models/dtos/IDivisionDto";
import {IGameMatchOptionDto} from "./models/dtos/Game/IGameMatchOptionDto";
import {ITournamentPlayerMap} from "../components/division_fixtures/tournaments/Tournament";
import {ISeasonDto} from "./models/dtos/Season/ISeasonDto";
import {ISelectablePlayer} from "../components/division_players/PlayerSelection";

export interface ITournament {
    tournamentData: ITournamentGameDto;
    setTournamentData?: (newData: ITournamentGameDto) => Promise<any>;
    season?: ISeasonDto;
    division?: IDivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?: (preventLoading?: boolean) => Promise<ITournamentGameDto>;
    setWarnBeforeSave?: (warning: string) => Promise<any>;
    matchOptionDefaults?: IGameMatchOptionDto;
}