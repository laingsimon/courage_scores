import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {GameTeamDto} from "../../interfaces/models/dtos/Game/GameTeamDto";
import {ISelectablePlayer} from "../common/PlayerSelection";

export interface ILeagueFixture {
    season: SeasonDto;
    division: DivisionDto;
    homePlayers: (TeamPlayerDto & ISelectablePlayer)[];
    awayPlayers: (TeamPlayerDto & ISelectablePlayer)[];
    readOnly: boolean;
    disabled: boolean;
    home: GameTeamDto;
    away: GameTeamDto;
}