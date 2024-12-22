import {addSide,} from "./tournaments";
import {sideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {playerBuilder} from "../../helpers/builders/players";

describe('tournaments', () => {
    describe('addSide', () => {
        it('can add a side as-is', () => {
            const currentTournament = tournamentBuilder().build();
            const player1 = playerBuilder('PLAYER 1').build();
            const player2 = playerBuilder('PLAYER 1').build();
            const newSide = sideBuilder('SIDE  ')
                .withPlayer(player1)
                .withPlayer(player2)
                .build();
            newSide.id = '';

            const updatedTournament: TournamentGameDto = addSide(currentTournament, newSide, { addAsIndividuals: false });

            expect(updatedTournament.sides!.length).toEqual(1);
            expect(updatedTournament.sides![0].id).not.toEqual('');
            expect(updatedTournament.sides![0].name).toEqual('SIDE');
            expect(updatedTournament.sides![0].players).toEqual([ player1, player2 ]);
        });

        it('can add each player as a discrete side', () => {
            const currentTournament = tournamentBuilder().build();
            const player1 = playerBuilder('PLAYER 1').build();
            const player2 = playerBuilder('PLAYER 2').build();
            const newSide = sideBuilder('')
                .withPlayer(player1)
                .withPlayer(player2)
                .build();
            newSide.id = '';

            const updatedTournament: TournamentGameDto = addSide(currentTournament, newSide, { addAsIndividuals: true });

            expect(updatedTournament.sides!.length).toEqual(2);
            expect(updatedTournament.sides![0].id).not.toEqual('');
            expect(updatedTournament.sides![0].name).toEqual('PLAYER 1');
            expect(updatedTournament.sides![0].players).toEqual([ player1 ]);
            expect(updatedTournament.sides![1].id).not.toEqual('');
            expect(updatedTournament.sides![1].name).toEqual('PLAYER 2');
            expect(updatedTournament.sides![1].players).toEqual([ player2 ]);
        })
    });
});