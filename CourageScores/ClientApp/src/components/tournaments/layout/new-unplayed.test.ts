import {getUnplayedLayoutData} from "./new-unplayed";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../../helpers/projection";

describe('new-unplayed', () => {
    let possibleSides: TournamentSideDto[];

    function getSides(count: number): TournamentSideDto[] {
        return repeat(count, (index: number): TournamentSideDto => {
            return {
                id: index.toString(),
                noShow: false,
            };
        })
    }

    function match(a: string, vs: string, m: string, otn?: number): ILayoutDataForMatch {
        return {
            scoreA: null,
            scoreB: null,
            sideA: side(a),
            sideB: side(vs),
            mnemonic: m,
            numberOfSidesOnTheNight: otn,
        };
    }

    function side(mnemonic: string): ILayoutDataForSide {
        return {
            mnemonic,
            name: null,
            showMnemonic: undefined,
            link: null,
            id: null,
        }
    }

    function round(...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: false,
            possibleSides,
            name: null,
            alreadySelectedSides: [],
        };
    }

    function preRound(...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: true,
            possibleSides,
            name: null,
            alreadySelectedSides: [],
        };
    }

    beforeEach(() => {
        possibleSides = null;
    });

    it('returns no rounds or matches for no sides', () => {
        possibleSides = getSides(0);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([]);
    });

    it('returns no rounds or matches for one side', () => {
        possibleSides = getSides(1);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([]);
    });

    it('returns 1 round with 1 match for 2 sides', () => {
        possibleSides = getSides(2);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([
            round(match('A', 'B', 'M1')),
        ]);
    });

    it('returns 3 (full) rounds for 8 sides', () => {
        possibleSides = getSides(8);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([
            round(
                match('A', 'B', 'M1'),
                match('C', 'D', 'M2'),
                match('E', 'F', 'M3'),
                match('G', 'H', 'M4'),
            ),
            round(
                match('winner(M1)', 'winner(M2)', 'M5'),
                match('winner(M3)', 'winner(M4)', 'M6'),
            ),
            round(
                match('winner(M5)', 'winner(M6)', 'M7'),
            ),
        ]);
    });

    it('returns 1 preliminary match, then 3 (full) rounds for 9 sides', () => {
        possibleSides = getSides(9);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([
            preRound(
                match('A', 'B', 'M1', 9),
            ),
            round(
                match('C', 'D', 'M3' /* TODO: this should be M2 */),
                match('E', 'F', 'M4' /* TODO: this should be M3 */),
                match('G', 'H', 'M5' /* TODO: this should be M4 */),
                match('I', 'winner(M1)', 'M2' /* TODO: this should be M5 */, 8),
            ),
            round(
                match('winner(M3)', 'winner(M4)', 'M6'),
                match('winner(M5)', 'winner(M2)', 'M7'),
            ),
            round(
                match('winner(M6)', 'winner(M7)', 'M8'),
            ),
        ]);
    });

    it('returns 2 preliminary matches, then 3 (full) rounds for 10 sides', () => {
        possibleSides = getSides(10);

        const result: ILayoutDataForRound[] = getUnplayedLayoutData(possibleSides);

        expect(result).toEqual([
            preRound(
                match('A', 'B', 'M1', 10),
                match('C', 'D', 'M2', 9),
            ),
            round(
                match('E', 'F', 'M5' /* TODO: this should be M3 */),
                match('G', 'H', 'M6' /* TODO: this should be M4 */),
                match('J', 'winner(M1)', 'M3' /* TODO: this should be M5 */, 8 /* TODO: this should be 7 or null */),
                match('I', 'winner(M2)', 'M4' /* TODO: this should be M6 */, 6 /* TODO: this should be 8 */),
            ),
            round(
                match('winner(M5)', 'winner(M6)', 'M7'),
                match('winner(M3)', 'winner(M4)', 'M8'),
            ),
            round(
                match('winner(M7)', 'winner(M8)', 'M9'),
            ),
        ]);
    });
});