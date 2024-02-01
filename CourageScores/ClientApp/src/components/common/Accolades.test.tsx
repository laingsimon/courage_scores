// noinspection JSUnresolvedReference

import {add180, addHiCheck, IAccoladeFixtureData, remove180, removeHiCheck} from "./Accolades";
import {playerBuilder} from "../../helpers/builders/players";
import {GamePlayerDto} from "../../interfaces/models/dtos/Game/GamePlayerDto";

describe('Accolades', () => {
    const player1: GamePlayerDto = playerBuilder('PLAYER 1').build();
    const player2: GamePlayerDto = playerBuilder('PLAYER 2').build();
    const player3: GamePlayerDto = playerBuilder('PLAYER 3').build();

    describe('add180', () => {
        it('will add player to a null set', async () => {
            let updated: IAccoladeFixtureData;
            const sut = add180({
                over100Checkouts: null,
                oneEighties: null,
            }, (u: IAccoladeFixtureData) => updated = u);

            await sut(player1);

            expect(updated.oneEighties).toEqual([{
                id: player1.id,
                name: player1.name,
            }]);
        });

        it('will add player to an empty set', async () => {
            let updated: IAccoladeFixtureData;
            const sut = add180({
                over100Checkouts: null,
                oneEighties: [],
            }, (u: IAccoladeFixtureData) => updated = u);

            await sut(player1);

            expect(updated.oneEighties).toEqual([{
                id: player1.id,
                name: player1.name,
            }]);
        });
    });

    describe('remove180', () => {
        it('will remove player at index', async () => {
            let updated: IAccoladeFixtureData;
            const sut = remove180({
                over100Checkouts: null,
                oneEighties: [player1, player2, player3],
            }, u => updated = u);

            await sut(player2.id, 1);

            expect(updated.oneEighties).toEqual([player1, player3]);
        });
    });

    describe('addHiCheck', () => {
        it('will add player to a null set', async () => {
            let updated: IAccoladeFixtureData;
            const sut = addHiCheck({
                oneEighties: null,
                over100Checkouts: null,
            }, (u: IAccoladeFixtureData) => updated = u);

            await sut(player1, 140);

            expect(updated.over100Checkouts).toEqual([{
                id: player1.id,
                name: player1.name,
                score: 140,
            }]);
        });

        it('will add player to an empty set', async () => {
            let updated: IAccoladeFixtureData;
            const sut = addHiCheck({
                oneEighties: null,
                over100Checkouts: [],
            }, (u: IAccoladeFixtureData) => updated = u);

            await sut(player1, 140);

            expect(updated.over100Checkouts).toEqual([{
                id: player1.id,
                name: player1.name,
                score: 140,
            }]);
        });
    });

    describe('removeHiCheck', () => {
        it('will remove player at index', async () => {
            let updated: IAccoladeFixtureData;
            const sut = removeHiCheck({
                oneEighties: null,
                over100Checkouts: [player1, player2, player3],
            }, (u: IAccoladeFixtureData) => updated = u);

            await sut(player2.id, 1);

            expect(updated.over100Checkouts).toEqual([player1, player3]);
        });
    });
});