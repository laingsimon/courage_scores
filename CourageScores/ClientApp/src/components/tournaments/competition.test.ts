import {getLayoutData, ITournamentLayoutGenerationContext} from "./competition";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../helpers/projection";
import {ILayoutDataForRound} from "./layout";

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

    describe('round names', () => {
        it('4 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(4), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Semi-Final', 'Final' ]);
        });

        it('5 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(5), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Preliminary', 'Semi-Final', 'Final' ]);
        });

        it('6 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(6), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Preliminary', 'Semi-Final', 'Final' ]);
        });

        it('7 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(7), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Preliminary', 'Semi-Final', 'Final' ]);
        });

        it('8 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(8), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
        });

        it('9 sides', () => {
            const layoutData: ILayoutDataForRound[] = getLayoutData(unplayedRound, getSides(9), context);

            const roundNames = layoutData.map((r: ILayoutDataForRound) => r.name);
            expect(roundNames).toEqual([ 'Preliminary',  'Quarter-Final', 'Semi-Final', 'Final' ]);
        });
    });
});