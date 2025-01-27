/* istanbul ignore file */

import {IAddableBuilder, IBuilder} from "./builders";
import {PlayerPerformanceDto} from "../../interfaces/models/dtos/Division/PlayerPerformanceDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {DivisionPlayerDto} from "../../interfaces/models/dtos/Division/DivisionPlayerDto";
import {NotablePlayerDto} from "../../interfaces/models/dtos/Game/NotablePlayerDto";
import {ISelectablePlayer} from "../../components/common/PlayerSelection";
import {createTemporaryId} from "../projection";

export interface IPlayerBuilder extends IAddableBuilder<TeamPlayerDto & DivisionPlayerDto & NotablePlayerDto & ISelectablePlayer> {
    captain(): IPlayerBuilder;
    score(score: number): IPlayerBuilder;
    noId(): IPlayerBuilder;
    email(email?: string): IPlayerBuilder;
    team(team: any): IPlayerBuilder;
    singles(metricsFunc: any): IPlayerBuilder;
}

export function playerBuilder(name?: string, id?: string): IPlayerBuilder {
    const player: TeamPlayerDto & DivisionPlayerDto & NotablePlayerDto & ISelectablePlayer = {
        id: id || createTemporaryId(),
        name: name || '',
        team: undefined!,
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
        score: (score: number) => {
            player.score = score;
            return builder;
        },
        noId: () => {
            player.id = '';
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
        singles: (metricsFunc: (metricsBuilder: IPlayerPerformanceBuilder) => PlayerPerformanceDto) => {
            player.singles = metricsFunc(playerPerformanceBuilder());
            return builder;
        },
    };

    return builder;
}

export interface IPlayerPerformanceBuilder extends IBuilder<PlayerPerformanceDto> {
    matchesPlayed(count: number): IPlayerPerformanceBuilder;
}

export function playerPerformanceBuilder(): IPlayerPerformanceBuilder {
    const metrics: PlayerPerformanceDto = {
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