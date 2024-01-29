import {IAddableBuilder, IBuilder} from "./builders";
import {IPlayerPerformanceDto} from "../../interfaces/dtos/Division/IPlayerPerformanceDto";
import {ITeamPlayerDto} from "../../interfaces/dtos/Team/ITeamPlayerDto";
import {IDivisionPlayerDto} from "../../interfaces/dtos/Division/IDivisionPlayerDto";
import {INotablePlayerDto} from "../../interfaces/dtos/Game/INotablePlayerDto";
import {ISelectablePlayer} from "../../components/division_players/PlayerSelection";
import {createTemporaryId} from "../projection";

export interface IPlayerBuilder extends IAddableBuilder<ITeamPlayerDto & IDivisionPlayerDto & INotablePlayerDto & ISelectablePlayer> {
    captain: () => IPlayerBuilder;
    notes: (notes?: string) => IPlayerBuilder;
    noId: () => IPlayerBuilder;
    email: (email?: string) => IPlayerBuilder;
    team: (team: any) => IPlayerBuilder;
    singles: (metricsFunc: any) => IPlayerBuilder;
}

export function playerBuilder(name?: string, id?: string): IPlayerBuilder {
    const player: ITeamPlayerDto & IDivisionPlayerDto & INotablePlayerDto & ISelectablePlayer = {
        id: id || createTemporaryId(),
        name,
        team: null,
    };

    const builder: IPlayerBuilder = {
        build: () => player,
        addTo: (map: any) => {
            map[player.id] = player;
            return builder;
        },
        captain: () => {
            player.captain = true;
            return builder;
        },
        notes: (notes?: string) => {
            player.notes = notes;
            return builder;
        },
        noId: () => {
            delete player.id;
            return builder;
        },
        email: (email?: string) => {
            player.emailAddress = email;
            return builder;
        },
        team: (team: any) => {
            player.teamId = team.id ? team.id : team;
            return builder;
        },
        singles: (metricsFunc: (metricsBuilder: IPlayerPerformanceBuilder) => IPlayerPerformanceDto) => {
            player.singles = metricsFunc(playerPerformanceBuilder());
            return builder;
        },
    };

    return builder;
}

export interface IPlayerPerformanceBuilder extends IBuilder<IPlayerPerformanceDto> {
    matchesPlayed: (count: number) => IPlayerPerformanceBuilder;
}

export function playerPerformanceBuilder(): IPlayerPerformanceBuilder {
    const metrics: IPlayerPerformanceDto = {
    };

    const builder: IPlayerPerformanceBuilder = {
        build: () => metrics,
        matchesPlayed: (count: number) => {
            metrics.matchesPlayed = count;
            return builder;
        },
    };

    return builder;
}
