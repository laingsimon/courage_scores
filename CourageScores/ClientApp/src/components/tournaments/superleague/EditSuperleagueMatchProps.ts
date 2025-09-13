import { TeamDto } from '../../../interfaces/models/dtos/Team/TeamDto';
import { TeamSeasonDto } from '../../../interfaces/models/dtos/Team/TeamSeasonDto';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto';
import { TournamentGameDto } from '../../../interfaces/models/dtos/Game/TournamentGameDto';
import { UntypedPromise } from '../../../interfaces/UntypedPromise';
import { PatchTournamentDto } from '../../../interfaces/models/dtos/Game/PatchTournamentDto';
import { PatchTournamentRoundDto } from '../../../interfaces/models/dtos/Game/PatchTournamentRoundDto';

export interface TeamAndSeason {
    team: TeamDto;
    season: TeamSeasonDto;
}

export interface IEditSuperleagueMatchProps {
    index?: number;
    match: TournamentMatchDto;
    tournamentData: TournamentGameDto;
    setMatchData(update: TournamentMatchDto): UntypedPromise;
    deleteMatch?(): UntypedPromise;
    readOnly?: boolean;
    patchData?(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ): Promise<boolean>;
    newMatch?: boolean;
    matchNumber?: number;
}
