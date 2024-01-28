import {ITournamentGameDto} from "./serverSide/Game/ITournamentGameDto";
import {IDivisionDto} from "./serverSide/IDivisionDto";
import {IGameMatchOptionDto} from "./serverSide/Game/IGameMatchOptionDto";
import {ITournamentPlayerMap} from "../components/division_fixtures/tournaments/Tournament";
import {ISeasonDto} from "./serverSide/Season/ISeasonDto";
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