import { IBuild } from './IBuild.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { IError } from './IError.ts';
import { IBrowserType } from './IBrowserType.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';
import { IFullScreen } from './IFullScreen.ts';

export interface IApp {
    error?: IError;
    onError(error: any): void;
    embed?: boolean;

    divisions: DivisionDto[];
    seasons: SeasonDto[];
    teams: TeamDto[];
    account?: UserDto;
    appLoading?: boolean;
    controls?: boolean;
    reloadDivisions(): UntypedPromise;
    reloadAccount(): UntypedPromise;
    reloadAll(): UntypedPromise;
    reloadTeams(): UntypedPromise;
    reloadSeasons(): UntypedPromise;
    clearError(): UntypedPromise;
    invalidateCacheAndTryAgain(): UntypedPromise;
    build: IBuild;
    reportClientSideException: (err: any) => void;
    browser: IBrowserType;
    fullScreen: IFullScreen;
}
