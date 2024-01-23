import {Settings} from "./settings";
import {IHttp} from "./http";
import {IExportDataResultDto} from "../interfaces/serverSide/Data/IExportDataResultDto";
import {ITableDto} from "../interfaces/serverSide/Data/ITableDto";
import {IImportDataResultDto} from "../interfaces/serverSide/Data/IImportDataResultDto";
import {ISingleDataResultDto} from "../interfaces/serverSide/Data/ISingleDataResultDto";
import {IExportDataRequestDto} from "../interfaces/serverSide/Data/IExportDataRequestDto";
import {IImportDataRequestDto} from "../interfaces/serverSide/Data/IImportDataRequestDto";
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
        keys.forEach(key => data.append(key, (request as any)[key]));

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