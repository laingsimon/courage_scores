import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { ITournamentPlayerMap } from './Tournament.ts';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { ISelectablePlayer } from '../common/PlayerSelection.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface ITournament {
    tournamentData: TournamentGameDto;
    setTournamentData?(
        newData: TournamentGameDto,
        save?: boolean,
    ): UntypedPromise;
    season?: SeasonDto;
    division?: DivisionDto;
    alreadyPlaying?: ITournamentPlayerMap;
    allPlayers?: ISelectablePlayer[];
    saveTournament?(
        preventLoading?: boolean,
    ): Promise<TournamentGameDto | undefined>;
    matchOptionDefaults?: GameMatchOptionDto;
    setEditTournament?(edit: boolean): UntypedPromise;
    superleagueMasterDrawOnly?: boolean;
    setSuperleagueMasterDrawOnly: (value: boolean) => UntypedPromise;
}
