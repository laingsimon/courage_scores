/* istanbul ignore file */

import {IAddableBuilder} from "./builders";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {EditTeamDto} from "../../interfaces/models/dtos/Team/EditTeamDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {createTemporaryId} from "../projection";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {GameTeamDto} from "../../interfaces/models/dtos/Game/GameTeamDto";

export interface ITeamBuilder extends IAddableBuilder<TeamDto & EditTeamDto & GameTeamDto> {
    forSeason(seasonOrId: any, divisionOrId?: any, players?: TeamPlayerDto[], deleted?: boolean): ITeamBuilder;
    address(address: string): ITeamBuilder;
    season(seasonOrId: any): ITeamBuilder;
    division(divisionOrId: any): ITeamBuilder;
    updated(updated: string): ITeamBuilder;
    newDivisionId(id: string): ITeamBuilder;
    noId(): ITeamBuilder;
}

export function teamBuilder(name?: string, id?: string): ITeamBuilder {
    const team: TeamDto & EditTeamDto & GameTeamDto = {
        id: id || createTemporaryId(),
        name: name || '',
        address: '',
        seasons: [],
    };

    const builder: ITeamBuilder  = {
        build: () => team,
        addTo: (map: any) => {
            map[team.id] = team;
            return builder;
        },
        forSeason: (seasonOrId: any, divisionOrId?: any, players?: TeamPlayerDto[], deleted?: boolean) => {
            const teamSeason: TeamSeasonDto = {
                seasonId: seasonOrId && seasonOrId.id ? seasonOrId.id : seasonOrId,
                divisionId: divisionOrId && divisionOrId.id ? divisionOrId.id : divisionOrId,
                players: players || [],
            };
            if (deleted) {
                teamSeason.deleted = '2020-01-03T04:05:06Z';
            }
            team.seasons?.push(teamSeason);
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
            team.id = '';
            return builder;
        },
    };

    return builder;
}