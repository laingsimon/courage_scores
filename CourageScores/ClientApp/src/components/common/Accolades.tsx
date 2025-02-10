import {GamePlayerDto} from "../../interfaces/models/dtos/Game/GamePlayerDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {NotablePlayerDto} from "../../interfaces/models/dtos/Game/NotablePlayerDto";
import {NotableTournamentPlayerDto} from "../../interfaces/models/dtos/Game/NotableTournamentPlayerDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IAccoladeFixtureData {
    oneEighties?: (GamePlayerDto | TournamentPlayerDto)[];
    over100Checkouts?: (NotablePlayerDto | NotableTournamentPlayerDto)[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function add180<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (player: NotablePlayerDto | NotableTournamentPlayerDto) => UntypedPromise {
    return async (player: GamePlayerDto | TournamentPlayerDto) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        if (!newFixtureData.oneEighties) {
            newFixtureData.oneEighties = [];
        }

        newFixtureData.oneEighties.push({
            id: player.id,
            name: player.name,
        });

        setFixtureData(newFixtureData);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function remove180<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (playerId: string, index: number) => UntypedPromise {
    return async (_: string, index: number) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        newFixtureData.oneEighties!.splice(index, 1);

        setFixtureData(newFixtureData);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function addHiCheck<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (player: NotablePlayerDto | NotableTournamentPlayerDto, score: number) => UntypedPromise {
    return async (player: NotablePlayerDto | NotableTournamentPlayerDto, score: number) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        if (!newFixtureData.over100Checkouts) {
            newFixtureData.over100Checkouts = [];
        }

        newFixtureData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            score,
        });

        setFixtureData(newFixtureData);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function removeHiCheck<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (playerId: string, index: number) => UntypedPromise {
    return async (_: string, index: number) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        newFixtureData.over100Checkouts!.splice(index, 1);

        setFixtureData(newFixtureData);
    };
}