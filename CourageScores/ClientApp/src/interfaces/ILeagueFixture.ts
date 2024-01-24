import {ISeasonDto} from "./serverSide/Season/ISeasonDto";
import {IDivisionDto} from "./serverSide/IDivisionDto";
import {ITeamPlayerDto} from "./serverSide/Team/ITeamPlayerDto";
import {IGameTeamDto} from "./serverSide/Game/IGameTeamDto";
import {ISelectablePlayer} from "../components/division_players/PlayerSelection";

export interface ILeagueFixture {
    season: ISeasonDto;
    division: IDivisionDto;
    homePlayers: (ITeamPlayerDto & ISelectablePlayer)[];
    awayPlayers: (ITeamPlayerDto & ISelectablePlayer)[];
    readOnly: boolean;
    disabled: boolean;
    home: IGameTeamDto;
    away: IGameTeamDto;
}