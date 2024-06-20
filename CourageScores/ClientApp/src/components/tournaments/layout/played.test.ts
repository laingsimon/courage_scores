import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    roundBuilder,
    sideBuilder,
} from "../../../helpers/builders/tournaments";
import {matchOptionsBuilder} from "../../../helpers/builders/games";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ILayoutDataForMatch, ILayoutDataForRound} from "../layout";
import {ITournamentLayoutGenerationContext} from "../competition";
import {getPlayedLayoutData} from "./played";

describe('played', () => {
    describe('played layouts', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder().numberOfLegs(5).build();

        function formatMatchData(m: ILayoutDataForMatch) {
            const sideAName: string = m.sideA.mnemonic || m.sideA.name;
            const sideBName: string = m.sideB ? (m.sideB.mnemonic || m.sideB.name) : null;

            return sideAName + (m.sideB ? ' vs ' + sideBName : '');
        }

        it('shows player name in bye when only one bye', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA).sideB(sideB))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC).sideB(sideD))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(1);
            expect(layout[0].matches.map(formatMatchData))
                .toEqual([ 'SIDE A vs SIDE B', 'SIDE C vs SIDE D', 'SIDE E' ]);
        });

        it('bye from first round plays first in second round', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA).sideB(sideB))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC).sideB(sideD))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[1].matches.map(formatMatchData))
                .toEqual([ 'SIDE E vs winner(M1)', 'winner(M2)' ]);
        });

        it('shows player name in subsequent round bye', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 0).sideB(sideB, 3))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 3).sideB(sideD, 0))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[1].matches.map(formatMatchData))
                .toEqual([ 'SIDE E vs SIDE B', 'SIDE C' ]);
        });

        it('shows mnemonics for unselected sides in first round', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 0).sideB(sideB, 3))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(1);
            expect(layout[0].matches.map(formatMatchData))
                .toEqual([ 'SIDE A vs SIDE B', 'A vs B', 'C' ]);
        });

        it('shows match mnemonics in second round when matches are not defined', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 0).sideB(sideB, 3))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 3).sideB(sideD, 1))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M1', 'M2' ]);
            expect(layout[1].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M3' ]);
            expect(layout[1].matches.map(formatMatchData)).toEqual([ 'SIDE B vs SIDE C' ]);
        });

        it('shows match mnemonic when winner not selected in subsequent round', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const sideF = sideBuilder('SIDE F').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 3).sideB(sideB, 0))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 3).sideB(sideD, 1))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 3).sideB(sideF, 2))
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 3).sideB(sideC, 0)))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE, sideF ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M1', 'M2', 'M3' ]);
            expect(layout[0].matches.map((m: ILayoutDataForMatch) => m.hideMnemonic)).toEqual([ true, true, false ]);
            expect(layout[0].matches.map(formatMatchData)).toEqual([
                'SIDE A vs SIDE B',
                'SIDE C vs SIDE D',
                'SIDE E vs SIDE F',
            ]);
            expect(layout[1].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M1', null /*bye*/ ]);
            expect(layout[1].matches.map((m: ILayoutDataForMatch) => m.hideMnemonic)).toEqual([ false, undefined /*bye*/ ]);
            expect(layout[1].matches.map(formatMatchData)).toEqual([
                'SIDE A vs SIDE C',
                'SIDE E',
            ]);
        });

        it('does not show match mnemonic when winner is selected in subsequent round', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const sideF = sideBuilder('SIDE F').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 3).sideB(sideB, 0))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 3).sideB(sideD, 1))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 3).sideB(sideF, 2))
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 3).sideB(sideC, 0))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 3).sideB(sideE, 0))))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE, sideF ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M1', 'M2', 'M3' ]);
            expect(layout[0].matches.map((m: ILayoutDataForMatch) => m.hideMnemonic)).toEqual([ true, true, true ]);
            expect(layout[0].matches.map(formatMatchData)).toEqual([
                'SIDE A vs SIDE B',
                'SIDE C vs SIDE D',
                'SIDE E vs SIDE F',
            ]);
            expect(layout[1].matches.map((m: ILayoutDataForMatch) => m.mnemonic)).toEqual([ 'M1', null /*bye*/ ]);
            expect(layout[1].matches.map((m: ILayoutDataForMatch) => m.hideMnemonic)).toEqual([ true, undefined /*bye*/ ]);
            expect(layout[1].matches.map(formatMatchData)).toEqual([
                'SIDE A vs SIDE C',
                'SIDE E',
            ]);
            expect(layout[2].matches.map(formatMatchData)).toEqual([
                'SIDE A vs SIDE E',
            ]);
        });

        it('returns match options where available', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const sideD = sideBuilder('SIDE D').build();
            const sideE = sideBuilder('SIDE E').build();
            const firstMatchOptions = matchOptionsBuilder().numberOfLegs(7).build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA).sideB(sideB))
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC).sideB(sideD))
                .withMatchOption(firstMatchOptions)
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC, sideD, sideE ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(1);
            expect(layout[0].matches.map(m => m.matchOptions))
                .toEqual([ firstMatchOptions, matchOptionDefaults, undefined ]);
        });

        it('includes round data in round layout', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA).sideB(sideB))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map(formatMatchData))
                .toEqual([ 'SIDE A vs SIDE B', 'SIDE C' ]);
            expect(layout[0].round).toEqual(round);
            expect(layout[1].round).toBeFalsy();
        });

        it('includes match data in round layout', () => {
            const sideA = sideBuilder('SIDE A').build();
            const sideB = sideBuilder('SIDE B').build();
            const sideC = sideBuilder('SIDE C').build();
            const round = roundBuilder()
                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA).sideB(sideB))
                .build();
            const context: ITournamentLayoutGenerationContext = {
                getLinkToSide: () => null,
                matchOptionDefaults,
            };

            const layout: ILayoutDataForRound[] = getPlayedLayoutData(
                [ sideA, sideB, sideC ],
                round,
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map(formatMatchData))
                .toEqual([ 'SIDE A vs SIDE B', 'SIDE C' ]);
            expect(layout[0].matches.map(m => m.match)).toEqual([ round.matches[0], undefined ]);
            expect(layout[1].matches.map(m => m.match)).toEqual([ undefined ]);
        });
    });
});