import {IHttp} from "./http";
import {ITeamDto} from "../interfaces/models/dtos/Team/ITeamDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";
import {IEditTeamDto} from "../interfaces/models/dtos/Team/IEditTeamDto";

export interface ITeamApi {
    get(id: string): Promise<ITeamDto | null>;
    getAll(): Promise<ITeamDto[]>;
    update(team: IEditTeamDto, lastUpdated?: string): Promise<IClientActionResultDto<ITeamDto>>;
    delete(id: string, seasonId: string): Promise<IClientActionResultDto<ITeamDto>>;
    add(id: string, seasonId: string, copyPlayersFromSeasonId?: string): Promise<IClientActionResultDto<ITeamDto>>;
    getForDivisionAndSeason(divisionId: string, seasonId: string): Promise<ITeamDto[]>;
}

class TeamApi implements ITeamApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<ITeamDto | null> {
        return this.http.get(`/api/Team/${id}`);
    }

    getAll(): Promise<ITeamDto[]> {
        return this.http.get(`/api/Team`);
    }

    update(team: IEditTeamDto, lastUpdated?: string): Promise<IClientActionResultDto<ITeamDto>> {
        if (team.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Team`, Object.assign({lastUpdated}, team));
    }

    delete(id: string, seasonId: string): Promise<IClientActionResultDto<ITeamDto>> {
        return this.http.delete(`/api/Team/${id}/${seasonId}`);
    }

    add(id: string, seasonId: string, copyPlayersFromSeasonId?: string): Promise<IClientActionResultDto<ITeamDto>> {
        return this.http.put(`/api/Team/${id}/${seasonId}`, {
            id: id,
            seasonId: seasonId,
            copyPlayersFromSeasonId: copyPlayersFromSeasonId
        });
    }

    getForDivisionAndSeason(divisionId: string, seasonId: string): Promise<ITeamDto[]> {
        return this.http.get(`/api/Team/${divisionId}/${seasonId}`);
    }
}

export {TeamApi};