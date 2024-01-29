import {IHttp} from "./http";
import {ITeamDto} from "../interfaces/dtos/Team/ITeamDto";
import {IEditTeamPlayerDto} from "../interfaces/dtos/Team/IEditTeamPlayerDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IPlayerApi {
    create(divisionId: string, seasonId: string, teamId: string, player: IEditTeamPlayerDto): Promise<IClientActionResultDto<ITeamDto>>;
    delete(seasonId: string, teamId: string, playerId: string): Promise<IClientActionResultDto<ITeamDto>>;
    update(seasonId: string, teamId: string, playerId: string, player: IEditTeamPlayerDto, lastUpdated?: string): Promise<IClientActionResultDto<ITeamDto>>;
}

class PlayerApi implements IPlayerApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    create(divisionId: string, seasonId: string, teamId: string, player: IEditTeamPlayerDto): Promise<IClientActionResultDto<ITeamDto>> {
        return this.http.post(`/api/Player/${divisionId}/${seasonId}/${teamId}`, player);
    }

    delete(seasonId: string, teamId: string, playerId: string): Promise<IClientActionResultDto<ITeamDto>> {
        return this.http.delete(`/api/Player/${seasonId}/${teamId}/${playerId}`);
    }

    update(seasonId: string, teamId: string, playerId: string, player: IEditTeamPlayerDto, lastUpdated?: string): Promise<IClientActionResultDto<ITeamDto>> {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.patch(`/api/Player/${seasonId}/${teamId}/${playerId}`, Object.assign({lastUpdated}, player));
    }
}

export {PlayerApi};