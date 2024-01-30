import {ISeasonDto} from "./models/dtos/Season/ISeasonDto";
import {IDivisionDto} from "./models/dtos/IDivisionDto";
import {ITeamPlayerDto} from "./models/dtos/Team/ITeamPlayerDto";
import {IGameTeamDto} from "./models/dtos/Game/IGameTeamDto";
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