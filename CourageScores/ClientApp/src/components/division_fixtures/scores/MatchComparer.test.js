// noinspection JSUnresolvedReference

import {matchEquals} from "./MatchComparer";
import {createTemporaryId} from "../../../helpers/projection";
import {matchBuilder} from "../../../helpers/builders";

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
            const result = matchEquals(
                matchBuilder().withHome().withAway().scores(1, 3).build(),
                matchBuilder().withHome().withAway().scores(2, 3).build());

            expect(result).toEqual(false);
        });

        it('when awayScores are different', () => {
            const result = matchEquals(
                matchBuilder().withHome().withAway().scores(1, 3).build(),
                matchBuilder().withHome().withAway().scores(1, 4).build());

            expect(result).toEqual(false);
        });

        it('when no homePlayers or awayPlayers', () => {
            const result = matchEquals(
                matchBuilder().scores(1, 3).build(),
                matchBuilder().scores(1, 3).build());

            expect(result).toEqual(true);
        });

        it('when homePlayers are different', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};

            const result = matchEquals(
                matchBuilder()
                    .withHome(homePlayer).withAway(awayPlayer).scores(1, 2).build(),
                matchBuilder()
                    .withHome({ id: createTemporaryId() }).withAway(awayPlayer).scores(1, 2).build()
            );

            expect(result).toEqual(false);
        });

        it('when homePlayers have different numbers', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};

            const result = matchEquals(
                matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 2)
                    .build(),
                matchBuilder()
                    .withHome(homePlayer)
                    .withHome({ id: createTemporaryId() })
                    .withAway(awayPlayer)
                    .scores(1, 2)
                    .build()
            );

            expect(result).toEqual(false);
        });

        it('when awayPlayers are different', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};

            const result = matchEquals(
                matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 2)
                    .build(),
                matchBuilder()
                    .withHome(homePlayer)
                    .withAway({ id: createTemporaryId() })
                    .scores(1, 2)
                    .build()
            );

            expect(result).toEqual(false);
        });

        it('when awayPlayers have different numbers', () => {
            const homePlayer = {id: createTemporaryId()};
            const awayPlayer = {id: createTemporaryId()};

            const result = matchEquals(
                matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 2)
                    .build(),
                matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .withAway({ id: createTemporaryId() })
                    .scores(1, 2)
                    .build()
            );

            expect(result).toEqual(false);
        });

        it('when identical', () => {
            const homePlayerId = createTemporaryId();
            const awayPlayerId = createTemporaryId();

            const result = matchEquals(
                matchBuilder()
                    .withHome({ id: homePlayerId })
                    .withAway({ id: awayPlayerId })
                    .scores(1, 2)
                    .build(),
                matchBuilder()
                    .withHome({ id: homePlayerId })
                    .withAway({ id: awayPlayerId })
                    .scores(1, 2)
                    .build()
            );

            expect(result).toEqual(true);
        });
    });
});