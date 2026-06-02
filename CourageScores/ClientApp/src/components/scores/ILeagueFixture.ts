import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto.ts';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto.ts';
import { ISelectablePlayer } from '../common/PlayerSelection.ts';

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
