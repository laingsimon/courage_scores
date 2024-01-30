import {IHttp} from "./http";
import {IReportCollectionDto} from "../interfaces/models/dtos/Report/IReportCollectionDto";
import {IReportRequestDto} from "../interfaces/models/dtos/Report/IReportRequestDto";

export interface IReportApi {
    getReport(request: IReportRequestDto): Promise<IReportCollectionDto>;
}

class ReportApi implements IReportApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    getReport(request: IReportRequestDto): Promise<IReportCollectionDto> {
        return this.http.post(`/api/Report`, request);
    }
}

export {ReportApi};
