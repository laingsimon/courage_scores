import {IHttp} from "./http";
import {ITournamentGameDto} from "../interfaces/serverSide/Game/ITournamentGameDto";
import {IGameMatchOptionDto} from "../interfaces/serverSide/Game/IGameMatchOptionDto";
import {IPatchTournamentDto} from "../interfaces/serverSide/Game/IPatchTournamentDto";
import {ICreateTournamentSaygDto} from "../interfaces/serverSide/Game/ICreateTournamentSaygDto";
import {IEditTournamentGameDto} from "../interfaces/serverSide/Game/IEditTournamentGameDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface ITournamentApi {
    get(id: string): Promise<ITournamentGameDto | null>;
    update(tournament: IEditTournamentGameDto, lastUpdated?: string): Promise<IClientActionResultDto<ITournamentGameDto>>;
    delete(id: string): Promise<IClientActionResultDto<ITournamentGameDto>>;
    patch(id: string, patch: IPatchTournamentDto): Promise<IClientActionResultDto<ITournamentGameDto>>;
    addSayg(id: string, matchId: string, matchOptions: IGameMatchOptionDto): Promise<IClientActionResultDto<ITournamentGameDto>>;
    deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<ITournamentGameDto>>;
}

class TournamentApi implements ITournamentApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(id: string): Promise<ITournamentGameDto | null> {
        return this.http.get(`/api/Tournament/${id}`);
    }

    update(tournament: IEditTournamentGameDto, lastUpdated?: string): Promise<IClientActionResultDto<ITournamentGameDto>> {
        if (tournament.id && !lastUpdated) {
            throw new Error('lastUpdated must be provided when updating a record');
        }

        const content: IEditTournamentGameDto = Object.assign({lastUpdated}, tournament);
        return this.http.put(`/api/Tournament`, content);
    }

    delete(id: string): Promise<IClientActionResultDto<ITournamentGameDto>> {
        return this.http.delete(`/api/Tournament/${id}`);
    }

    patch(id: string, patch: IPatchTournamentDto): Promise<IClientActionResultDto<ITournamentGameDto>> {
        return this.http.patch(`/api/Tournament/${id}`, patch);
    }

    addSayg(id: string, matchId: string, matchOptions: IGameMatchOptionDto): Promise<IClientActionResultDto<ITournamentGameDto>> {
        const content: ICreateTournamentSaygDto = {matchId, matchOptions};
        return this.http.post(`/api/Tournament/${id}`, content);
    }

    deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<ITournamentGameDto>> {
        return this.http.delete(`/api/Tournament/${id}/${matchId}`);
    }
}

export {TournamentApi};