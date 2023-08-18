// noinspection JSUnresolvedReference

import {matchEquals} from "./MatchComparer";
import {createTemporaryId} from "../../../helpers/projection";

describe('MatchComparer', () => {
    describe('matchEquals', () => {
        it('when both are null', () => {
            const result = matchEquals(null, null);

            expect(result).toEqual(true);
        });

        it('when x is null and y is not null', () => {
            const result = matchEquals(null, {});

            expect(result).toEqual(false);
        });

        it('when x is not null and y is null', () => {
            const result = matchEquals({}, null);

            expect(result).toEqual(false);
        });

        it('when homeScores are different', () => {
            const result = matchEquals({
                homeScore: 1,
                awayScore: 3,
                homePlayers: [],
                awayPlayers: [],
            }, {
                homeScore: 2,
                awayScore: 3,
                homePlayers: [],
                awayPlayers: [],
            });

            expect(result).toEqual(false);
        });

        it('when awayScores are different', () => {
            const result = matchEquals({
                homeScore: 1,
                awayScore: 3,
                homePlayers: [],
                awayPlayers: [],
            }, {
                homeScore: 1,
                awayScore: 4,
                homePlayers: [],
                awayPlayers: [],
            });

            expect(result).toEqual(false);
        });

        it('when no homePlayers or awayPlayers', () => {
            const result = matchEquals({
                homeScore: 1,
                awayScore: 3,
            }, {
                homeScore: 1,
                awayScore: 3,
            });

            expect(result).toEqual(true);
        });

        it('when homePlayers are different', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};
            const result = matchEquals({
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer],
            }, {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [{id: createTemporaryId()}],
                awayPlayers: [awayPlayer],
            });

            expect(result).toEqual(false);
        });

        it('when homePlayers have different numbers', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};
            const result = matchEquals({
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer],
            }, {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer, {id: createTemporaryId()}],
                awayPlayers: [awayPlayer],
            });

            expect(result).toEqual(false);
        });

        it('when awayPlayers are different', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};
            const result = matchEquals({
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer],
            }, {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [{id: createTemporaryId()}],
            });

            expect(result).toEqual(false);
        });

        it('when awayPlayers have different numbers', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};
            const result = matchEquals({
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer],
            }, {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer, {id: createTemporaryId()}],
            });

            expect(result).toEqual(false);
        });

        it('when identical', () => {
            const homePlayerId = createTemporaryId();
            const awayPlayerId = createTemporaryId();
            const result = matchEquals({
                homeScore: 1,
                awayScore: 2,
                homePlayers: [{id: homePlayerId}],
                awayPlayers: [{id: awayPlayerId}],
            }, {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [{id: homePlayerId}],
                awayPlayers: [{id: awayPlayerId}],
            });

            expect(result).toEqual(true);
        });
    });
});