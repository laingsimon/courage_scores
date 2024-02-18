import {
    getPlayedLayoutData,
    getRoundNameFromSides,
    getUnplayedLayoutData,
    hasScore, ILayoutDataForMatch,
    ILayoutDataForRound, ITournamentLayoutGenerationContext, setRoundNames
} from "./tournaments";
import {distinct} from "./collections";
import {repeat} from "./projection";
import {ITournamentMatchBuilder, roundBuilder, sideBuilder} from "./builders/tournaments";
import {matchOptionsBuilder} from "./builders/games";
import {GameMatchOptionDto} from "../interfaces/models/dtos/Game/GameMatchOptionDto";

describe('tournaments', () => {
    describe('getRoundNameFromSides', () => {
        it('returns round name if exists', () => {
            const round = {
                name: 'ROUND',
            };

            const name = getRoundNameFromSides(round, 2, 1);

            expect(name).toEqual('ROUND');
        });

        it('returns Final if 2 sides', () => {
            const round = {
                name: null,
            };

            const name = getRoundNameFromSides(round, 2, 1);

            expect(name).toEqual('Final');
        });

        it('returns Semi-Final if 4 sides', () => {
            const round = {
                name: null,
            };

            const name = getRoundNameFromSides(round, 4, 1);

            expect(name).toEqual('Semi-Final');
        });

        it('returns Quarter-Final if 6,7 or 8 sides', () => {
            const round = {
                name: null,
            };

            expect(getRoundNameFromSides(round, 6, 1)).toEqual('Quarter-Final');
            expect(getRoundNameFromSides(round, 7, 1)).toEqual('Quarter-Final');
            expect(getRoundNameFromSides(round, 8, 1)).toEqual('Quarter-Final');
        });

        it('returns depth if unimportant number of sides', () => {
            const round = {
                name: null,
            };

            const names = [
                getRoundNameFromSides(round, 1, 1),
                getRoundNameFromSides(round, 3, 1),
                getRoundNameFromSides(round, 5, 1),
                getRoundNameFromSides(round, 9, 1),
                getRoundNameFromSides(round, 0, 1),
                getRoundNameFromSides(round, 10, 1),
            ];

            expect(distinct(names)).toEqual(['Round: 1']);
        });
    });

    describe('hasScore', () => {
        it('returns true if there is a score', () => {
            expect(hasScore(0)).toEqual(true);
            expect(hasScore(1)).toEqual(true);
        });

        it('returns false if there is a null score', () => {
            expect(hasScore(null)).toEqual(false);
        });

        it('returns false if there is an undefined score', () => {
            expect(hasScore(undefined)).toEqual(false);
        });
    });

    describe('getUnplayedLayoutData', () => {
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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(4));

            expect(layout.length).toEqual(2);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M1)', vs: 'winner(M2)', m: 'M3' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('5 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(5));

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'E', vs: 'winner(M1)', m: 'M3' }),
                    layoutMatchBuilder({  a: 'winner(M2)' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'winner(M2)', vs: 'winner(M3)', m: 'M4' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('6 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(6));

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({  a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({  a: 'E', vs: 'F', m: 'M3' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'winner(M1)', vs: 'winner(M2)', m: 'M4' }),
                    layoutMatchBuilder({  a: 'winner(M3)' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M3)', vs: 'winner(M4)', m: 'M5' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('7 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(7));

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'G', vs: 'winner(M1)', m: 'M4' }),
                    layoutMatchBuilder({ a: 'winner(M2)', vs: 'winner(M3)', m: 'M5' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M4)', vs: 'winner(M5)', m: 'M6' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('8 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(8));

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H', m: 'M4' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M1)', vs: 'winner(M2)', m: 'M5' }),
                    layoutMatchBuilder({ a: 'winner(M3)', vs: 'winner(M4)', m: 'M6' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M5)', vs: 'winner(M6)', m: 'M7' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });

        it('9 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(repeat(9));

            expect(layout.length).toEqual(4);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B', m: 'M1' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D', m: 'M2' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F', m: 'M3' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H', m: 'M4' }),
                    layoutMatchBuilder({ a: 'I' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'I', vs: 'winner(M1)', m: 'M5' }),
                    layoutMatchBuilder({ a: 'winner(M2)', vs: 'winner(M3)', m: 'M6' }),
                    layoutMatchBuilder({ a: 'winner(M4)' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M4)', vs: 'winner(M5)', m: 'M7' }),
                    layoutMatchBuilder({ a: 'winner(M6)' }), // TODO: 728 This is a bye-to-the-final
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
            expect(layout[3]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'winner(M6)', vs: 'winner(M7)', m: 'M8' }),
                ],
                name: null,
                alreadySelectedSides: expect.any(Array),
                possibleSides: expect.any(Array),
            });
        });
    });

    describe('getPlayedLayoutData', () => {
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

        it('shows match mnemonics in second round when matches are not defined', async () => {
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
    });

    describe('setRoundNames', () => {
        it('4 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(4)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Semi-Final', 'Final' ]);
        });

        it('5 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(5)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('6 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(6)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('7 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(7)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('8 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(8)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('9 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(repeat(9)));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Round 1',  'Quarter-Final', 'Semi-Final', 'Final' ]);
        });
    });
});