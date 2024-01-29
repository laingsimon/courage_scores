import {IHttp} from "./http";
import {IErrorDetailDto} from "../interfaces/dtos/IErrorDetailDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IErrorApi {
    get(id: string): Promise<IErrorDetailDto>;
    getRecent(since: string): Promise<IErrorDetailDto[]>;
    add(error: IErrorDetailDto): Promise<IClientActionResultDto<IErrorDetailDto>>;
}

class ErrorApi implements IErrorApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<IErrorDetailDto> {
        return this.http.get(`/api/Error/${id}`);
    }

    getRecent(since: string): Promise<IErrorDetailDto[]> {
        return this.http.get(`/api/Error/Since/${since}`);
    }

    add(error: IErrorDetailDto): Promise<IClientActionResultDto<IErrorDetailDto>> {
        return this.http.put(`/api/Error`, error);
    }
}

export {ErrorApi};
