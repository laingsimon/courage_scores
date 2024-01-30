import {IHttp} from "./http";
import {IFixtureDateNoteDto} from "../interfaces/models/dtos/IFixtureDateNoteDto";
import {IEditFixtureDateNoteDto} from "../interfaces/models/dtos/IEditFixtureDateNoteDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface INoteApi {
    get(seasonId: string): Promise<IFixtureDateNoteDto[]>;
    create(note: IEditFixtureDateNoteDto): Promise<IClientActionResultDto<IFixtureDateNoteDto>>;
    upsert(id: string, note: IEditFixtureDateNoteDto, lastUpdated?: string): Promise<IClientActionResultDto<IFixtureDateNoteDto>>;
    delete(id: string): Promise<IClientActionResultDto<IFixtureDateNoteDto>>;
}

class NoteApi implements INoteApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(seasonId: string): Promise<IFixtureDateNoteDto[]> {
        return this.http.get(`/api/Note/${seasonId}`);
    }

    create(note: IEditFixtureDateNoteDto): Promise<IClientActionResultDto<IFixtureDateNoteDto>> {
        return this.http.post(`/api/Note`, note);
    }

    upsert(id: string, note: IEditFixtureDateNoteDto, lastUpdated?: string): Promise<IClientActionResultDto<IFixtureDateNoteDto>> {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        return this.http.put(`/api/Note/${id}`, Object.assign({lastUpdated}, note));
    }

    delete(id: string): Promise<IClientActionResultDto<IFixtureDateNoteDto>> {
        return this.http.delete(`/api/Note/${id}`);
    }
}

export {NoteApi};