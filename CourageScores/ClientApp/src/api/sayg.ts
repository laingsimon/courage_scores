import {IHttp} from "./http";
import {IRecordedScoreAsYouGoDto} from "../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {IUpdateRecordedScoreAsYouGoDto} from "../interfaces/serverSide/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface ISaygApi {
    get(id: string): Promise<IRecordedScoreAsYouGoDto | null>;
    upsert(data: IUpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<IRecordedScoreAsYouGoDto>>;
    delete(id: string): Promise<IClientActionResultDto<IRecordedScoreAsYouGoDto>>;
}

class SaygApi implements ISaygApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<IRecordedScoreAsYouGoDto | null> {
        return this.http.get(`/api/Sayg/${id}`);
    }

    upsert(data: IUpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<IRecordedScoreAsYouGoDto>> {
        return this.http.post(`/api/Sayg`, data);
    }

    delete(id: string): Promise<IClientActionResultDto<IRecordedScoreAsYouGoDto>> {
        return this.http.delete(`/api/Sayg/${id}`);
    }
}

export {SaygApi};
