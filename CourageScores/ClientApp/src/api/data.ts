import {Settings} from "./settings";
import {IHttp} from "./http";
import {IExportDataResultDto} from "../interfaces/dtos/Data/IExportDataResultDto";
import {ITableDto} from "../interfaces/dtos/Data/ITableDto";
import {IImportDataResultDto} from "../interfaces/dtos/Data/IImportDataResultDto";
import {ISingleDataResultDto} from "../interfaces/dtos/Data/ISingleDataResultDto";
import {IExportDataRequestDto} from "../interfaces/dtos/Data/IExportDataRequestDto";
import {IImportDataRequestDto} from "../interfaces/dtos/Data/IImportDataRequestDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IDataApi {
    export(request: IExportDataRequestDto): Promise<IClientActionResultDto<IExportDataResultDto>>;
    tables(): Promise<ITableDto[]>;
    import(request: IImportDataRequestDto, file: any): Promise<IClientActionResultDto<IImportDataResultDto> | null>;
    browse(table: string, id?: string): Promise<IClientActionResultDto<ISingleDataResultDto>> | Promise<IClientActionResultDto<ISingleDataResultDto[]>>;
}

class DataApi implements IDataApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    export(request: IExportDataRequestDto): Promise<IClientActionResultDto<IExportDataResultDto>> {
        return this.http.post(`/api/Data/Export`, request);
    }

    tables(): Promise<ITableDto[]> {
        return this.http.get(`/api/Data/Tables`);
    }

    async import(request: IImportDataRequestDto, file: any): Promise<IClientActionResultDto<IImportDataResultDto> | null> {
        const data = new FormData();
        data.append('Zip', file);
        const keys = Object.keys(request);
        keys.forEach(key => data.append(key, request[key]));

        const settings = new Settings();
        const absoluteUrl = settings.apiHost + `/api/Data/Import`;

        const response = await fetch(absoluteUrl, {
            method: 'POST',
            mode: 'cors',
            body: data,
            headers: {},
            credentials: 'include'
        });

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    browse(table: string, id?: string): Promise<IClientActionResultDto<ISingleDataResultDto>> | Promise<IClientActionResultDto<ISingleDataResultDto[]>> {
        return this.http.get(`/api/Data/Browse/${table}/${id}`);
    }
}

export {DataApi};