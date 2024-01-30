import {IGamePlayerDto} from "../../interfaces/models/dtos/Game/IGamePlayerDto";
import {ITournamentPlayerDto} from "../../interfaces/models/dtos/Game/ITournamentPlayerDto";
import {INotablePlayerDto} from "../../interfaces/models/dtos/Game/INotablePlayerDto";
import {INotableTournamentPlayerDto} from "../../interfaces/models/dtos/Game/INotableTournamentPlayerDto";

export interface IAccoladeFixtureData {
    oneEighties?: (IGamePlayerDto | ITournamentPlayerDto)[];
    over100Checkouts?: (INotablePlayerDto | INotableTournamentPlayerDto)[];
}

export function add180<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (player: INotablePlayerDto | INotableTournamentPlayerDto) => Promise<any> {
    return async (player: IGamePlayerDto | ITournamentPlayerDto) => {
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

export function remove180<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (playerId: string, index: number) => Promise<any> {
    return async (_: string, index: number) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        newFixtureData.oneEighties.splice(index, 1);

        setFixtureData(newFixtureData);
    }
}

export function addHiCheck<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (player: INotablePlayerDto | INotableTournamentPlayerDto, notes: string) => Promise<any> {
    return async (player: INotablePlayerDto | INotableTournamentPlayerDto, notes: string) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        if (!newFixtureData.over100Checkouts) {
            newFixtureData.over100Checkouts = [];
        }

        newFixtureData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes,
        });

        setFixtureData(newFixtureData);
    }
}

export function removeHiCheck<T extends IAccoladeFixtureData>(fixtureData: T, setFixtureData: (newData: T) => any): (playerId: string, index: number) => Promise<any> {
    return async (_: string, index: number) => {
        const newFixtureData: T = Object.assign({}, fixtureData);

        newFixtureData.over100Checkouts.splice(index, 1);

        setFixtureData(newFixtureData);
    };
}

