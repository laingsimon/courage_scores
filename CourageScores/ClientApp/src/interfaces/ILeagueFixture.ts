import {SeasonDto} from "./models/dtos/Season/SeasonDto";
import {DivisionDto} from "./models/dtos/DivisionDto";
import {TeamPlayerDto} from "./models/dtos/Team/TeamPlayerDto";
import {GameTeamDto} from "./models/dtos/Game/GameTeamDto";
import {ISelectablePlayer} from "../components/division_players/PlayerSelection";

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