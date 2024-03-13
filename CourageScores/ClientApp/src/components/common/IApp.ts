import {IBuild} from "./IBuild";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {DataMap} from "../../helpers/collections";
import {IError} from "./IError";

export interface IApp {
    error?: IError;
    onError(error: any): void;
    embed?: boolean;

    divisions: DataMap<DivisionDto>;
    seasons: DataMap<SeasonDto>;
    teams: DataMap<TeamDto>;
    account?: UserDto | null;
    appLoading?: boolean;
    controls?: boolean;
    reloadDivisions(): Promise<any>;
    reloadAccount(): Promise<any>;
    reloadAll(): Promise<any>;
    reloadTeams(): Promise<any>;
    reloadSeasons(): Promise<any>;
    clearError(): Promise<any>;
    invalidateCacheAndTryAgain(): Promise<any>;
    build: IBuild;
    reportClientSideException: (err: any) => void;
    isMobile: boolean;
}
