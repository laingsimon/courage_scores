import {PlayedEngine} from "./PlayedEngine";
import {ILayoutEngine} from "./ILayoutEngine";
import {ILayoutRequest} from "./ILayoutRequest";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {createTemporaryId} from "../../../helpers/projection";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {ILayoutDataForSide} from "./ILayoutDataForSide";
import {ILayoutDataForMatch} from "./ILayoutDataForMatch";
import {ILayoutDataForRound} from "./ILayoutDataForRound";

interface ISideLayoutInfo {
    side?: ILayoutDataForSide;
    score?: string;
}

describe('PlayedEngine', () => {
    const matchOptionDefaults: GameMatchOptionDto = {
        numberOfLegs: 5,
    };

    function getLinkToSide(side: TournamentSideDto): JSX.Element {
        return {
            key: 'link',
            type: null,
            props: {side},
        }
    }

    function request(round: TournamentRoundDto, ...sides: TournamentSideDto[]): ILayoutRequest {
        return {
            sides: sides,
            context: {
                matchOptionDefaults,
                getLinkToSide,
            },
            round: round
        };
    }

    function playedRound(name: string, nextRound?: TournamentRoundDto, matchOptions?: GameMatchOptionDto[], ...matches: TournamentMatchDto[]): TournamentRoundDto {
        return {
            id: createTemporaryId(),
            name: name,
            matches: matches,
            nextRound: nextRound,
            matchOptions,
        };
    }

    function playedMatch(sideA?: TournamentSideDto, scoreA?: number, sideB?: TournamentSideDto, scoreB?: number): TournamentMatchDto {
        return {
            id: createTemporaryId(),
            sideA: sideA,
            sideB: sideB,
            scoreA: scoreA,
            scoreB: scoreB,
        };
    }

    function playedSide(name: string): TournamentSideDto {
        return {
            id: createTemporaryId(),
            noShow: false,
            name,
        };
    }

    function unplayedRound(name: string, ...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: false,
            possibleSides: [],
            name: name,
            alreadySelectedSides: [],
        };
    }

    function unplayedMatch(a: string, vs: string, m: string, otn?: string, showMnemonic?: string): ILayoutDataForMatch {
        return {
            scoreA: null,
            scoreB: null,
            sideA: unplayedSide(a, getShowMnemonic('a', showMnemonic)),
            sideB: unplayedSide(vs, getShowMnemonic('vs', showMnemonic)),
            mnemonic: m,
            numberOfSidesOnTheNight: otn,
        };
    }

    function unplayedSide(mnemonic: string, showMnemonic?: boolean): ILayoutDataForSide {
        return {
            mnemonic,
            name: null,
            showMnemonic,
            link: null,
            id: null,
        }
    }

    function expectedRound(name: string, ...matches: ILayoutDataForMatch[]): ILayoutDataForRound {
        return {
            matches,
            preRound: false,
            possibleSides: expect.any(Array),
            name: name,
            alreadySelectedSides: expect.any(Array),
            round: expect.any(Object),
        };
    }

    function expectedMatch(a?: ISideLayoutInfo, vs?: ISideLayoutInfo, m?: string, otn?: string, matchOptions?: GameMatchOptionDto): ILayoutDataForMatch {
        return {
            hideMnemonic: undefined,
            matchOptions,
            saygId: undefined,
            scoreA: a ? a.score : null,
            scoreB: vs ? vs.score : null,
            sideA: a ? a.side : null,
            sideB: vs ? vs.side : null,
            mnemonic: m,
            numberOfSidesOnTheNight: otn,
            match: expect.any(Object),
            winner: null,
        };
    }

    function expectedMatchFromMatch(match: TournamentMatchDto, winner?: string, m?: string, otn?: string, matchOptions?: GameMatchOptionDto): ILayoutDataForMatch {
        return {
            hideMnemonic: undefined,
            matchOptions,
            saygId: undefined,
            scoreA: match.scoreA.toString(),
            scoreB: match.scoreB.toString(),
            sideA: {
                id: match.sideA.id,
                name: match.sideA.name,
                link: {
                    key: 'link',
                    props: { side: match.sideA },
                    type: null,
                },
                mnemonic: null,
            },
            sideB: {
                id: match.sideB.id,
                name: match.sideB.name,
                link: {
                    key: 'link',
                    props: { side: match.sideB },
                    type: null,
                },
                mnemonic: null,
            },
            mnemonic: m,
            numberOfSidesOnTheNight: otn,
            match: match,
            winner: winner || null,
        };
    }

    function getShowMnemonic(side: string, instruction?: string): boolean {
        if (instruction && instruction.indexOf('!' + side) !== -1) {
            return false;
        }
        if (instruction && instruction.indexOf(side) !== -1) {
            return true;
        }

        return undefined;
    }

    function expectedSide(side?: string, score?: string): ISideLayoutInfo {
        return {
            side: {
                mnemonic: side,
                name: null,
                link: null,
                id: null,
            },
            score: score || '0',
        };
    }

    describe('part played fixture', () => {
        it('shows sideA winner of match as mnemonic in next round match', () => {
            const unplayedLayout: ILayoutDataForRound[] = [
                unplayedRound(
                    'Semi-Final',
                    unplayedMatch('A', 'B', 'M1'),
                    unplayedMatch('C', 'D', 'M2'),
                ),
                unplayedRound(
                    'Final',
                    unplayedMatch('winner(M1)', 'winner(M2)', 'M3'),
                ),
            ];
            const engine: ILayoutEngine = new PlayedEngine(new MockEngine(unplayedLayout));
            const side1: TournamentSideDto = playedSide('SIDE 1');
            const side2: TournamentSideDto = playedSide('SIDE 2');
            const matchOptions: GameMatchOptionDto = {
                numberOfLegs: 5,
            };
            const semiFinal1: TournamentMatchDto = playedMatch(side1, 3, side2, 1);
            const semiFinal: TournamentRoundDto = playedRound('Semi-Final', playedRound('Final'), [matchOptions], semiFinal1, playedMatch());

            const result: ILayoutDataForRound[] = engine.calculate(request(semiFinal, side1, side2));

            expect(result).toEqual([
                expectedRound(
                    'Semi-Final',
                    expectedMatchFromMatch(semiFinal1, 'sideA', undefined, undefined, matchOptions),
                    expectedMatch(expectedSide('C'), expectedSide('D'), 'M2', undefined, matchOptions),
                ),
                expectedRound(
                    'Final',
                    unplayedMatch(side1.name, 'winner(M2)', 'M3'),
                ),
            ]);
        });

        it('shows sideB winner of match as mnemonic in next round match', () => {
            const unplayedLayout: ILayoutDataForRound[] = [
                unplayedRound(
                    'Semi-Final',
                    unplayedMatch('A', 'B', 'M1'),
                    unplayedMatch('C', 'D', 'M2'),
                ),
                unplayedRound(
                    'Final',
                    unplayedMatch('winner(M1)', 'winner(M2)', 'M3'),
                ),
            ];
            const engine: ILayoutEngine = new PlayedEngine(new MockEngine(unplayedLayout));
            const side1: TournamentSideDto = playedSide('SIDE 1');
            const side2: TournamentSideDto = playedSide('SIDE 2');
            const matchOptions: GameMatchOptionDto = {
                numberOfLegs: 5,
            };
            const semiFinal1: TournamentMatchDto = playedMatch(side1, 2, side2, 3);
            const semiFinal: TournamentRoundDto = playedRound('Semi-Final', playedRound('Final'), [matchOptions], semiFinal1, playedMatch());

            const result: ILayoutDataForRound[] = engine.calculate(request(semiFinal, side1, side2));

            expect(result).toEqual([
                expectedRound(
                    'Semi-Final',
                    expectedMatchFromMatch(semiFinal1, 'sideB', undefined, undefined, matchOptions),
                    expectedMatch(expectedSide('C'), expectedSide('D'), 'M2', undefined, matchOptions),
                ),
                expectedRound(
                    'Final',
                    unplayedMatch(side2.name, 'winner(M2)', 'M3'),
                ),
            ]);
        });

        it('only shows winners from previous round as possible sides in next round', () => {
            const unplayedLayout: ILayoutDataForRound[] = [
                unplayedRound(
                    'Semi-Final',
                    unplayedMatch('A', 'B', 'M1'),
                    unplayedMatch('C', 'D', 'M2'),
                ),
                unplayedRound(
                    'Final',
                    unplayedMatch('winner(M1)', 'winner(M2)', 'M3'),
                ),
            ];
            const engine: ILayoutEngine = new PlayedEngine(new MockEngine(unplayedLayout));
            const side1: TournamentSideDto = playedSide('SIDE 1');
            const side2: TournamentSideDto = playedSide('SIDE 2');
            const side3: TournamentSideDto = playedSide('SIDE 3');
            const side4: TournamentSideDto = playedSide('SIDE 4');
            const matchOptions: GameMatchOptionDto = {
                numberOfLegs: 5,
            };
            const semiFinal1: TournamentMatchDto = playedMatch(side1, 1, side2, 3);
            const semiFinal2: TournamentMatchDto = playedMatch(side3, 3, side4, 0);
            const semiFinal: TournamentRoundDto = playedRound('Semi-Final', playedRound('Final'), [matchOptions], semiFinal1, semiFinal2);

            const result: ILayoutDataForRound[] = engine.calculate(request(semiFinal, side1, side2));

            const finalRound: ILayoutDataForRound = result[1];
            expect(finalRound.possibleSides).toEqual([ side2, side3 ]);
        });
    });

    describe('edge cases', () => {
        it('when unplayed engine returns empty', () => {
            const unplayedLayout: ILayoutDataForRound[] = [];
            const engine: ILayoutEngine = new PlayedEngine(new MockEngine(unplayedLayout));
            const final: TournamentRoundDto = playedRound('Final');

            const result: ILayoutDataForRound[] = engine.calculate(request(final));

            expect(result).toEqual([]);
        });

        it('shows additional matches if present in round', () => {
            const unplayedLayout: ILayoutDataForRound[] = [
                unplayedRound(
                    'Semi-Final',
                    unplayedMatch('A', 'B', 'M1'),
                    unplayedMatch('C', 'D', 'M2'),
                ),
                unplayedRound(
                    'Final',
                    unplayedMatch('winner(M1)', 'winner(M2)', 'M3'),
                ),
            ];
            const engine: ILayoutEngine = new PlayedEngine(new MockEngine(unplayedLayout));
            const side1: TournamentSideDto = playedSide('SIDE 1');
            const side2: TournamentSideDto = playedSide('SIDE 2');
            const side3: TournamentSideDto = playedSide('SIDE 3');
            const side4: TournamentSideDto = playedSide('SIDE 4');
            const matchOptions: GameMatchOptionDto = {
                numberOfLegs: 5,
            };
            const semiFinal1: TournamentMatchDto = playedMatch(side1, 1, side2, 3);
            const semiFinal2: TournamentMatchDto = playedMatch(side3, 3, side4, 0);
            const extraMatch: TournamentMatchDto = playedMatch(side1, 2, side4, 3);
            const semiFinal: TournamentRoundDto = playedRound('Semi-Final', playedRound('Final'), [matchOptions], semiFinal1, semiFinal2, extraMatch);

            const result: ILayoutDataForRound[] = engine.calculate(request(semiFinal, side1, side2));

            expect(result).toEqual([
                expectedRound(
                    'Semi-Final',
                    expectedMatchFromMatch(semiFinal1, 'sideB', undefined, undefined, matchOptions),
                    expectedMatchFromMatch(semiFinal2, 'sideA', undefined, undefined, matchOptions),
                    expectedMatchFromMatch(extraMatch, 'sideB', undefined, undefined), // extra, unexpected, match
                ),
                expectedRound(
                    'Final',
                    unplayedMatch(side2.name, side3.name, 'M3'),
                ),
            ]);
        });
    });

    class MockEngine implements ILayoutEngine {
        private readonly _layout: ILayoutDataForRound[];

        constructor(layout: ILayoutDataForRound[]) {
            this._layout = layout;
        }

        calculate(_: ILayoutRequest): ILayoutDataForRound[] {
            return this._layout;
        }
    }
});