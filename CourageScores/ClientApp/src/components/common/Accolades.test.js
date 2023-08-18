// noinspection JSUnresolvedReference

import {add180, addHiCheck, remove180, removeHiCheck} from "./Accolades";
import {createTemporaryId} from "../../helpers/projection";
import {playerBuilder} from "../../helpers/builders";

describe('Accolades', () => {
    const player1 = playerBuilder('PLAYER 1').build();
    const player2 = playerBuilder('PLAYER 2').build();
    const player3 = playerBuilder('PLAYER 3').build();

    describe('add180', () => {
        it('will add player to a null set', async () => {
            let updated;
            const sut = add180({
                oneEighties: null,
            }, u => updated = u);

            sut(player1);

            expect(updated.oneEighties).toEqual([player1]);
        });

        it('will add player to an empty set', async () => {
            let updated;
            const sut = add180({
                oneEighties: [],
            }, u => updated = u);

            sut(player1);

            expect(updated.oneEighties).toEqual([player1]);
        });
    });

    describe('remove180', () => {
        it('will remove player at index', async () => {
            let updated;
            const sut = remove180({
                oneEighties: [player1, player2, player3],
            }, u => updated = u);

            sut(player2.id, 1);

            expect(updated.oneEighties).toEqual([player1, player3]);
        });
    });

    describe('addHiCheck', () => {
        it('will add player to a null set', async () => {
            let updated;
            const sut = addHiCheck({
                over100Checkouts: null,
            }, u => updated = u);

            sut(player1, '140');

            expect(updated.over100Checkouts).toEqual([{
                id: player1.id,
                name: player1.name,
                notes: '140',
            }]);
        });

        it('will add player to an empty set', async () => {
            let updated;
            const sut = addHiCheck({
                over100Checkouts: [],
            }, u => updated = u);

            sut(player1, '140');

            expect(updated.over100Checkouts).toEqual([{
                id: player1.id,
                name: player1.name,
                notes: '140',
            }]);
        });
    });

    describe('removeHiCheck', () => {
        it('will remove player at index', async () => {
            let updated;
            const sut = removeHiCheck({
                over100Checkouts: [player1, player2, player3],
            }, u => updated = u);

            sut(player2.id, 1);

            expect(updated.over100Checkouts).toEqual([player1, player3]);
        });
    });
});