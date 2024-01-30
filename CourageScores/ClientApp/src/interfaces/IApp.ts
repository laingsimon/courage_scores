import {IBuild} from "./IBuild";
import {IDivisionDto} from "./models/dtos/IDivisionDto";
import {ISeasonDto} from "./models/dtos/Season/ISeasonDto";
import {ITeamDto} from "./models/dtos/Team/ITeamDto";
import {IUserDto} from "./models/dtos/Identity/IUserDto";
import {DataMap} from "../helpers/collections";
import {IError} from "./IError";

export interface IApp {
    error?: IError;
    onError: (error: any) => void;
    embed?: boolean;

    divisions: DataMap<IDivisionDto>,
    seasons: DataMap<ISeasonDto>,
    teams: DataMap<ITeamDto>,
    account?: IUserDto | null,
    appLoading?: boolean,
    controls?: boolean,
    reloadDivisions: () => Promise<any>,
    reloadAccount: () => Promise<any>,
    reloadAll: () => Promise<any>,
    reloadTeams: () => Promise<any>,
    reloadSeasons: () => Promise<any>,
    clearError: () => Promise<any>,
    invalidateCacheAndTryAgain: () => Promise<any>,
    build: IBuild,
    reportClientSideException: any,
}
