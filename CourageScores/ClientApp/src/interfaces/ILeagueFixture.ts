import {ISeasonDto} from "./dtos/Season/ISeasonDto";
import {IDivisionDto} from "./dtos/IDivisionDto";
import {ITeamPlayerDto} from "./dtos/Team/ITeamPlayerDto";
import {IGameTeamDto} from "./dtos/Game/IGameTeamDto";
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