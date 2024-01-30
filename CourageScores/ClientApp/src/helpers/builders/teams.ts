import {IAddableBuilder} from "./builders";
import {ITeamDto} from "../../interfaces/models/dtos/Team/ITeamDto";
import {IEditTeamDto} from "../../interfaces/models/dtos/Team/IEditTeamDto";
import {ITeamPlayerDto} from "../../interfaces/models/dtos/Team/ITeamPlayerDto";
import {createTemporaryId} from "../projection";
import {ITeamSeasonDto} from "../../interfaces/models/dtos/Team/ITeamSeasonDto";
import {IGameTeamDto} from "../../interfaces/models/dtos/Game/IGameTeamDto";

export interface ITeamBuilder extends IAddableBuilder<ITeamDto & IEditTeamDto & IGameTeamDto> {
    forSeason: (seasonOrId: any, divisionOrId?: any, players?: ITeamPlayerDto[]) => ITeamBuilder;
    address: (address: string) => ITeamBuilder;
    season: (seasonOrId: any) => ITeamBuilder;
    division: (divisionOrId: any) => ITeamBuilder;
    updated: (updated: string) => ITeamBuilder;
    newDivisionId: (id: string) => ITeamBuilder;
    noId: () => ITeamBuilder;
}

export function teamBuilder(name?: string, id?: string): ITeamBuilder {
    const team: ITeamDto & IEditTeamDto & IGameTeamDto = {
        id: id || createTemporaryId(),
        name,
        address: '',
        seasons: [],
    };

    const builder: ITeamBuilder  = {
        build: () => team,
        addTo: (map: any) => {
            map[team.id] = team;
            return builder;
        },
        forSeason: (seasonOrId: any, divisionOrId?: any, players?: ITeamPlayerDto[]) => {
            const teamSeason: ITeamSeasonDto = {
                seasonId: seasonOrId && seasonOrId.id ? seasonOrId.id : seasonOrId,
                divisionId: divisionOrId && divisionOrId.id ? divisionOrId.id : divisionOrId,
                players: players || [],
            };
            team.seasons.push(teamSeason);
            return builder;
        },
        address: (address: string) => {
            team.address = address;
            return builder;
        },
        season: (seasonOrId: any) => {
            team.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
            return builder;
        },
        division: (divisionOrId: any) => {
            team.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
            return builder;
        },
        updated: (updated: string) => {
            team.updated = updated;
            return builder;
        },
        newDivisionId: (id: string) => {
            team.newDivisionId = id;
            return builder;
        },
        noId: () => {
            delete team.id;
            return builder;
        },
    };

    return builder;
}
