import {IHttp} from "./http";
import {ITemplateDto} from "../interfaces/serverSide/Season/Creation/ITemplateDto";
import {IProposalResultDto} from "../interfaces/serverSide/Season/Creation/IProposalResultDto";
import {ISeasonHealthCheckResultDto} from "../interfaces/serverSide/Health/ISeasonHealthCheckResultDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";
import {IEditTemplateDto} from "../interfaces/serverSide/Season/Creation/IEditTemplateDto";
import {IProposalRequestDto} from "../interfaces/serverSide/Season/Creation/IProposalRequestDto";
import {IActionResultDto} from "../interfaces/serverSide/IActionResultDto";

export interface ITemplateApi {
    get(id: string): Promise<ITemplateDto | null>;
    delete(id: string): Promise<IClientActionResultDto<ITemplateDto>>;
    getAll(): Promise<ITemplateDto[]>;
    update(template: IEditTemplateDto): Promise<IClientActionResultDto<ITemplateDto>>;
    getCompatibility(seasonId: string): Promise<IClientActionResultDto<IActionResultDto<ITemplateDto>[]>>;
    propose(request: IProposalRequestDto): Promise<IClientActionResultDto<IProposalResultDto>>;
    health(template: IEditTemplateDto): Promise<IClientActionResultDto<ISeasonHealthCheckResultDto>>;
}

class TemplateApi implements ITemplateApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<ITemplateDto | null> {
        return this.http.get(`/api/Template/${id}`);
    }

    delete(id: string): Promise<IClientActionResultDto<ITemplateDto>> {
        return this.http.delete(`/api/Template/${id}`);
    }

    getAll(): Promise<ITemplateDto[]> {
        return this.http.get(`/api/Template/`);
    }

    update(template: IEditTemplateDto): Promise<IClientActionResultDto<ITemplateDto>> {
        return this.http.put(`/api/Template/`, template);
    }

    getCompatibility(seasonId: string): Promise<IClientActionResultDto<IActionResultDto<ITemplateDto>[]>> {
        return this.http.get(`/api/Template/ForSeason/${seasonId}`);
    }

    propose(request: IProposalRequestDto): Promise<IClientActionResultDto<IProposalResultDto>> {
        return this.http.post(`/api/Template/Propose/`, request);
    }

    health(template: IEditTemplateDto): Promise<IClientActionResultDto<ISeasonHealthCheckResultDto>> {
        return this.http.post(`/api/Template/Health/`, template);
    }
}

export {TemplateApi};
