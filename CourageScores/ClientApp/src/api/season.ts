import {IHttp} from "./http";
import {ISeasonDto} from "../interfaces/models/dtos/Season/ISeasonDto";
import {ISeasonHealthCheckResultDto} from "../interfaces/models/dtos/Health/ISeasonHealthCheckResultDto";
import {IEditSeasonDto} from "../interfaces/models/dtos/Season/IEditSeasonDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface ISeasonApi {
    update(season: IEditSeasonDto, lastUpdated?: string): Promise<IClientActionResultDto<ISeasonDto>>;
    delete(id: string): Promise<IClientActionResultDto<ISeasonDto>>;
    getAll(): Promise<ISeasonDto[]>;
    getHealth(id: string): Promise<ISeasonHealthCheckResultDto>;
}

class SeasonApi implements ISeasonApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    update(season: IEditSeasonDto, lastUpdated?: string): Promise<IClientActionResultDto<ISeasonDto>> {
        if (season.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Season`, Object.assign({lastUpdated}, season));
    }

    delete(id: string): Promise<IClientActionResultDto<ISeasonDto>> {
        return this.http.delete(`/api/Season/${id}`);
    }

    getAll(): Promise<ISeasonDto[]> {
        return this.http.get(`/api/Season`);
    }

    getHealth(id: string): Promise<ISeasonHealthCheckResultDto> {
        return this.http.get(`/api/Season/${id}/health`);
    }
}

export {SeasonApi};