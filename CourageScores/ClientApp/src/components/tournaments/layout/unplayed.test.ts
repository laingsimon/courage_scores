import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../../helpers/projection";
import {ILayoutDataForRound} from "../layout";
import {getUnplayedLayoutData} from "./unplayed";

describe('unplayed', () => {
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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(4));

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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(5));

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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(6));

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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(7));

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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(8));

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
            const layout: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(9));

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
});