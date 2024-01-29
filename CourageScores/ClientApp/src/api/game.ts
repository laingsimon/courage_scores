import {IHttp} from "./http";
import {IGameDto} from "../interfaces/dtos/Game/IGameDto";
import {IRecordScoresDto} from "../interfaces/dtos/Game/IRecordScoresDto";
import {IEditGameDto} from "../interfaces/dtos/Game/IEditGameDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IGameApi {
    get(id: string): Promise<IGameDto | null>;
    updateScores(id: string, scores: IRecordScoresDto, lastUpdated?: string): Promise<IClientActionResultDto<IGameDto>>;
    update(game: IEditGameDto, lastUpdated?: string): Promise<IClientActionResultDto<IGameDto>>;
    delete(id: string): Promise<IClientActionResultDto<IGameDto>>;
}

class GameApi implements IGameApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<IGameDto | null> {
        return this.http.get(`/api/Game/${id}`);
    }

    updateScores(id: string, scores: IRecordScoresDto, lastUpdated?: string): Promise<IClientActionResultDto<IGameDto>> {
        if (!lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        const content: IRecordScoresDto = Object.assign({lastUpdated}, scores);
        return this.http.put(`/api/Scores/${id}`, content);
    }

    update(game: IEditGameDto, lastUpdated?: string): Promise<IClientActionResultDto<IGameDto>> {
        if (game.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        const content: IEditGameDto = Object.assign({lastUpdated}, game);
        return this.http.put(`/api/Game`, content);
    }

    delete(id: string): Promise<IClientActionResultDto<IGameDto>> {
        return this.http.delete(`/api/Game/${id}`);
    }
}

export {GameApi};