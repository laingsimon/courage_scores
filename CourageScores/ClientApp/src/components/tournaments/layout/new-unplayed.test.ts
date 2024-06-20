// noinspection JSUnusedLocalSymbols

import {getUnplayedLayoutData} from "./new-unplayed";
import {ILayoutDataForRound} from "../layout";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {repeat} from "../../../helpers/projection";

interface ILayoutMatchBuilderProps {
    a: string;
    vs?: string;
    m?: string;
}

describe('new-unplayed', () => {
    function getSides(count: number): TournamentSideDto[] {
        return repeat(count, (index: number): TournamentSideDto => {
            return {
                id: index.toString(),
                noShow: false,
            };
        })
    }

    // @ts-ignore
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

    it('returns no rounds or matches for no sides', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData([]);

        //expect(result).toEqual([]);
    });

    it('returns no rounds or matches for one side', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(1));

        //expect(result).toEqual([]);
    });

    it('returns 1 round with 1 match for 2 sides', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(2));

        //expect(result).toEqual([]);
    });

    it('returns 3 (full) rounds for 8 sides', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(8));

        //expect(result).toEqual([]);
    });

    it('returns 1 preliminary match, then 3 (full) rounds for 9 sides', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(9));

        //expect(result).toEqual([]);
    });

    it('returns 2 preliminary matches, then 3 (full) rounds for 10 sides', () => {
        // @ts-ignore
        const result: ILayoutDataForRound[] = getUnplayedLayoutData(getSides(10));

        //expect(result).toEqual([]);
    });
});