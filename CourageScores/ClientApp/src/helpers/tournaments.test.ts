// noinspection JSUnresolvedReference

import {
    getRoundNameFromSides,
    getUnplayedLayoutData,
    hasScore,
    ILayoutDataForRound, setRoundNames
} from "./tournaments";
import {distinct} from "./collections";

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
        }

        function layoutMatchBuilder({ a, vs }: ILayoutMatchBuilderProps) {
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
            }
        }

        it('4 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(4);

            expect(layout.length).toEqual(2);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A/B', vs: 'C/D' }),
                ],
                name: null,
            });
        });

        it('5 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(5);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D' }),
                    layoutMatchBuilder({ a: 'E' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'E', vs: 'A/B' }),
                    layoutMatchBuilder({  a: 'C/D' }),
                ],
                name: null,
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'C/D', vs: 'A/B/E' }),
                ],
                name: null,
            });
        });

        it('6 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(6);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'A', vs: 'B' }),
                    layoutMatchBuilder({  a: 'C', vs: 'D' }),
                    layoutMatchBuilder({  a: 'E', vs: 'F' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({  a: 'A/B', vs: 'C/D' }),
                    layoutMatchBuilder({  a: 'E/F' }),
                ],
                name: null,
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'E/F', vs: 'A/B/C/D' }),
                ],
                name: null,
            });
        });

        it('7 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(7);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F' }),
                    layoutMatchBuilder({ a: 'G' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'G', vs: 'A/B' }),
                    layoutMatchBuilder({ a: 'C/D', vs: 'E/F' }),
                ],
                name: null,
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A/B/G', vs: 'C/D/E/F' }),
                ],
                name: null,
            });
        });

        it('8 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(8);

            expect(layout.length).toEqual(3);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A/B', vs: 'C/D' }),
                    layoutMatchBuilder({ a: 'E/F', vs: 'G/H' }),
                ],
                name: null,
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A/B/C/D', vs: 'E/F/G/H' }),
                ],
                name: null,
            });
        });

        it('9 sides', () => {
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(9);

            expect(layout.length).toEqual(4);
            expect(layout[0]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'A', vs: 'B' }),
                    layoutMatchBuilder({ a: 'C', vs: 'D' }),
                    layoutMatchBuilder({ a: 'E', vs: 'F' }),
                    layoutMatchBuilder({ a: 'G', vs: 'H' }),
                    layoutMatchBuilder({ a: 'I' }),
                ],
                name: null,
            });
            expect(layout[1]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'I', vs: 'A/B' }),
                    layoutMatchBuilder({ a: 'C/D', vs: 'E/F' }),
                    layoutMatchBuilder({ a: 'G/H' }),
                ],
                name: null,
            });
            expect(layout[2]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'G/H', vs: 'A/B/I' }),
                    layoutMatchBuilder({ a: 'C/D/E/F' }),
                ],
                name: null,
            });
            expect(layout[3]).toEqual({
                matches: [
                    layoutMatchBuilder({ a: 'C/D/E/F', vs: 'A/B/G/H/I' }),
                ],
                name: null,
            });
        });
    });

    describe('setRoundNames', () => {
        it('4 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(4));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Semi-Final', 'Final' ]);
        });

        it('5 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(5));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('6 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(6));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('7 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(7));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('8 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(8));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('9 sides', () => {
            const layoutData: ILayoutDataForRound[] = setRoundNames(getUnplayedLayoutData(9));

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Round 1',  'Quarter-Final', 'Semi-Final', 'Final' ]);
        });
    });
});