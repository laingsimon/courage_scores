import {
    getLayoutData, ITournamentLayoutGenerationContext
} from "./competition";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    roundBuilder,
    sideBuilder,
} from "../../helpers/builders/tournaments";
import {matchOptionsBuilder} from "../../helpers/builders/games";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../helpers/projection";
import {ILayoutDataForMatch, ILayoutDataForRound} from "./layout";

describe('competition', () => {
    const unplayedRound: TournamentRoundDto = {
        matches: [],
    };
    const context: ITournamentLayoutGenerationContext = {
        getLinkToSide(_: TournamentSideDto): JSX.Element {
            return null;
        },
        matchOptionDefaults: {},
    };

    function getSides(count: number): TournamentSideDto[] {
        return repeat(count, (index: number): TournamentSideDto => {
            return {
                id: index.toString(),
                noShow: false,
            };
        })
    }

    describe('unplayed layout', () => {
        interface ILayoutMatchBuilderProps {
            a: string;
            vs?: string;
            m?: string;
        }

        function layoutMatchBuilder({ a, vs, m }: ILayoutMatchBuilderProps) {
            const bye: boolean = !vs;

            return {
                bye: bye || false,
                scoreA: null,
                scoreB: null,
                sideA: {
                    id: null,
                    name: null,
                    link: null,
                    mnemonic: a || null,
                },
                sideB: bye ? null : {
                    id: null,
                    name: null,
                    link: null,
                    mnemonic: vs || null,
                },
                mnemonic: m || null,
            }
        }

        it('4 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(4), context);

            expect(layout.length).toEqual(2);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M1)', vs: 'winner(M2)', m: 'M3' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('5 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(5), context);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E' }),
                ],
                name: 'Quarter-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'E', vs: 'winner(M1)', m: 'M3' }),
                    layoutMatchBuilder({  a: 'winner(M2)' }),
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'winner(M2)', vs: 'winner(M3)', m: 'M4' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('6 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(6), context);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({  a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({  a: 'E', vs: 'F', m: 'M3' }),
                ],
                name: 'Quarter-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'winner(M1)', vs: 'winner(M2)', m: 'M4' }),
                    layoutMatchBuilder({  a: 'winner(M3)' }),
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M3)', vs: 'winner(M4)', m: 'M5' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('7 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(7), context);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G' }),
                ],
                name: 'Quarter-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'G', vs: 'winner(M1)', m: 'M4' }),
                    layoutMatchBuilder({ a: 'winner(M2)', vs: 'winner(M3)', m: 'M5' }),
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M4)', vs: 'winner(M5)', m: 'M6' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('8 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(8), context);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H', m: 'M4' }),
                ],
                name: 'Quarter-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M1)', vs: 'winner(M2)', m: 'M5' }),
                    layoutMatchBuilder({ a: 'winner(M3)', vs: 'winner(M4)', m: 'M6' }),
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M5)', vs: 'winner(M6)', m: 'M7' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('9 sides', () => {
            const layout: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(9), context);

            expect(layout.length).toEqual(4);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H', m: 'M4' }),
                    layoutMatchBuilder({ a: 'I' }),
                ],
                name: 'Round 1',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'I', vs: 'winner(M1)', m: 'M5' }),
                    layoutMatchBuilder({ a: 'winner(M2)', vs: 'winner(M3)', m: 'M6' }),
                    layoutMatchBuilder({ a: 'winner(M4)' }),
                ],
                name: 'Quarter-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M4)', vs: 'winner(M5)', m: 'M7' }),
                    layoutMatchBuilder({ a: 'winner(M6)' }), // TODO: 728 This is a bye-to-the-final
                ],
                name: 'Semi-Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[3]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M6)', vs: 'winner(M7)', m: 'M8' }),
                ],
                name: 'Final',
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });
    });

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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE, sideF ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE, sideF ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC, sideD, sideE ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC ],
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

            const layout: ILayoutDataForRound[] = getLayoutData(
                round,
                [ sideA, sideB, sideC ],
                context);

            expect(layout.length).toBeGreaterThanOrEqual(2);
            expect(layout[0].matches.map(formatMatchData))
                .toEqual([ 'SIDE A vs SIDE B', 'SIDE C' ]);
            expect(layout[0].matches.map(m => m.match)).toEqual([ round.matches[0], undefined ]);
            expect(layout[1].matches.map(m => m.match)).toEqual([ undefined ]);
        });
    });

    describe('round names', () => {
        it('4 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(4), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Semi-Final', 'Final' ]);
        });

        it('5 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(5), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('6 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(6), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('7 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(7), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('8 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(8), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('9 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(9), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Round 1',  'Quarter-Final', 'Semi-Final', 'Final' ]);
        });
    });
});