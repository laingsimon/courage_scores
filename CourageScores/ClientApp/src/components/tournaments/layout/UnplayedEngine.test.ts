import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../../helpers/projection";
import {UnplayedEngine} from "./UnplayedEngine";
import {ILayoutEngine} from "./ILayoutEngine";

describe('UnplayedEngine', () => {
    let possibleSides: TournamentSideDto[];
    let engine: ILayoutEngine;

    function getSides(count: number): TournamentSideDto[] {
        return repeat(count, (index: number): TournamentSideDto => {
            return {
                id: index.toString(),
                noShow: false,
            };
        })
    }

    function match(a: string, vs: string, m: string, otn?: number, showMnemonic?: string): ILayoutDataForMatch {
        return {
            scoreA: null,
            scoreB: null,
            sideA: side(a, getShowMnemonic('A', showMnemonic)),
            sideB: side(vs, getShowMnemonic('vs', showMnemonic)),
            mnemonic: m,
            numberOfSidesOnTheNight: otn,
        };
    }

    function getShowMnemonic(side: string, instruction?: string): boolean {
        if (instruction === '!' + side) {
            return false;
        }
        if (instruction && instruction.indexOf(side) !== -1) {
            return true;
        }

        return undefined;
    }

    function side(mnemonic: string, showMnemonic?: boolean): ILayoutDataForSide {
        return {
            mnemonic,
            name: null,
            showMnemonic,
            link: null,
            id: null,
        }
    }

    function round(name: string, ...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: false,
            possibleSides,
            name: name,
            alreadySelectedSides: [],
        };
    }

    function preRound(...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: true,
            possibleSides,
            name: 'Preliminary',
            alreadySelectedSides: [],
        };
    }

    beforeEach(() => {
        possibleSides = null;
        engine = new UnplayedEngine();
    });

    it('returns no rounds or matches for no sides', () => {
        possibleSides = getSides(0);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([]);
    });

    it('returns no rounds or matches for one side', () => {
        possibleSides = getSides(1);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([]);
    });

    it('returns 1 round with 1 match for 2 sides', () => {
        possibleSides = getSides(2);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([
            round('Final', match('A', 'B', 'M1', undefined, '!vs')),
        ]);
    });

    it('returns 2 (full) rounds for 7 sides', () => {
        possibleSides = getSides(7);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([
            preRound(
                match('A', 'B', 'M1', 7, 'vs'),
                match('C', 'D', 'M2', 6, 'vs'),
                match('E', 'F', 'M3', 5, 'vs'),
            ),
            round(
                'Semi-Final',
                match('G', 'winner(M1)', 'M4', 3, 'vs'),
                match('winner(M2)', 'winner(M3)', 'M5', 4, 'vs'),
            ),
            round(
                'Final',
                match('winner(M4)', 'winner(M5)', 'M6', undefined, '!vs'),
            ),
        ]);
    });

    it('returns 3 (full) rounds for 8 sides', () => {
        possibleSides = getSides(8);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([
            round(
                'Quarter-Final',
                match('A', 'B', 'M1', undefined, '!vs'),
                match('C', 'D', 'M2', undefined, '!vs'),
                match('E', 'F', 'M3', undefined, '!vs'),
                match('G', 'H', 'M4', undefined, '!vs'),
            ),
            round(
                'Semi-Final',
                match('winner(M1)', 'winner(M2)', 'M5', undefined, '!vs'),
                match('winner(M3)', 'winner(M4)', 'M6', undefined, '!vs'),
            ),
            round(
                'Final',
                match('winner(M5)', 'winner(M6)', 'M7', undefined, '!vs'),
            ),
        ]);
    });

    it('returns 1 preliminary match, then 3 (full) rounds for 9 sides', () => {
        possibleSides = getSides(9);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([
            preRound(
                match('A', 'B', 'M1', 9, 'vs'),
            ),
            round(
                'Quarter-Final',
                match('C', 'D', 'M2', undefined, '!vs'),
                match('E', 'F', 'M3', undefined, '!vs'),
                match('G', 'H', 'M4', undefined, '!vs'),
                match('I', 'winner(M1)', 'M5', 8, 'vs'),
            ),
            round(
                'Semi-Final',
                match('winner(M2)', 'winner(M3)', 'M6', undefined, '!vs'),
                match('winner(M4)', 'winner(M5)', 'M7', undefined, '!vs'),
            ),
            round(
                'Final',
                match('winner(M6)', 'winner(M7)', 'M8', undefined, '!vs'),
            ),
        ]);
    });

    it('returns 2 preliminary matches, then 3 (full) rounds for 10 sides', () => {
        possibleSides = getSides(10);

        const result: ILayoutDataForRound[] = engine.calculate(possibleSides);

        expect(result).toEqual([
            preRound(
                match('A', 'B', 'M1', 10, 'vs'),
                match('C', 'D', 'M2', 9, 'vs'),
            ),
            round(
                'Quarter-Final',
                match('E', 'F', 'M3', undefined, '!vs'),
                match('G', 'H', 'M4', undefined, '!vs'),
                match('I', 'winner(M1)', 'M5', 7, 'vs'),
                match('J', 'winner(M2)', 'M6', 8, 'vs'),
            ),
            round(
                'Semi-Final',
                match('winner(M3)', 'winner(M4)', 'M7', undefined, '!vs'),
                match('winner(M5)', 'winner(M6)', 'M8', undefined, '!vs'),
            ),
            round(
                'Final',
                match('winner(M7)', 'winner(M8)', 'M9', undefined, '!vs'),
            ),
        ]);
    });
});