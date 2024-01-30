import {IHttp} from "./http";
import {IWebSocketDto} from "../interfaces/models/dtos/Live/IWebSocketDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface ILiveApi {
    getAll(): Promise<IClientActionResultDto<IWebSocketDto[]>>;
    close(id: string): Promise<IClientActionResultDto<IWebSocketDto>>;
}

class LiveApi implements ILiveApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    getAll(): Promise<IClientActionResultDto<IWebSocketDto[]>> {
        return this.http.get(`/api/Live/Sockets`);
    }

    close(id: string): Promise<IClientActionResultDto<IWebSocketDto>> {
        return this.http.delete(`/api/Live/Socket/${id}`);
    }
}

export {LiveApi};
