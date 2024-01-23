import {IHttp} from "./http";
import {IDivisionDto} from "../interfaces/serverSide/IDivisionDto";
import {IDivisionDataDto} from "../interfaces/serverSide/Division/IDivisionDataDto";
import {IEditDivisionDto} from "../interfaces/serverSide/IEditDivisionDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IDivisionApi {
    getAll(): Promise<IDivisionDto[]>;
    get(id: string): Promise<IDivisionDto>;
    data(divisionId: string, seasonId?: string): Promise<IDivisionDataDto>;
    update(details: IEditDivisionDto, lastUpdated?: string): Promise<IClientActionResultDto<IDivisionDto>>;
    delete(id: string): Promise<IClientActionResultDto<IDivisionDto>>;
}

class DivisionApi implements IDivisionApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    getAll(): Promise<IDivisionDto[]> {
        return this.http.get(`/api/Division`);
    }

    get(id: string): Promise<IDivisionDto> {
        return this.http.get(`/api/Division/${id}`);
    }

    data(divisionId: string, seasonId?: string): Promise<IDivisionDataDto> {
        if (seasonId) {
            return this.http.get(`/api/Division/${divisionId}/${seasonId}/Data`);
        }

        return this.http.get(`/api/Division/${divisionId}/Data`);
    }

    update(details: IEditDivisionDto, lastUpdated?: string): Promise<IClientActionResultDto<IDivisionDto>> {
        if (details.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Division`, Object.assign({lastUpdated}, details));
    }

    delete(id: string): Promise<IClientActionResultDto<IDivisionDto>> {
        return this.http.delete(`/api/Division/${id}`);
    }
}

export {DivisionApi};