import {IBuild} from "./IBuild";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IError} from "./IError";
import {IBrowserType} from "./IBrowserType";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

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
    isFullScreen?: boolean;
}