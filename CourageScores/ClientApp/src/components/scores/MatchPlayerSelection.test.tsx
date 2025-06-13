import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import {
    IMatchPlayerSelectionProps,
    MatchPlayerSelection,
    NEW_PLAYER,
} from './MatchPlayerSelection';
import {
    ILeagueFixtureContainerProps,
    LeagueFixtureContainer,
} from './LeagueFixtureContainer';
import {
    IMatchTypeContainerProps,
    MatchTypeContainer,
} from './MatchTypeContainer';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { GamePlayerDto } from '../../interfaces/models/dtos/Game/GamePlayerDto';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto';
import { ICreatePlayerFor } from './Score';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { ISelectablePlayer } from '../common/PlayerSelection';
import { playerBuilder } from '../../helpers/builders/players';
import {
    IMatchBuilder,
    matchBuilder,
    matchOptionsBuilder,
} from '../../helpers/builders/games';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { teamBuilder } from '../../helpers/builders/teams';
import { createTemporaryId } from '../../helpers/projection';
import { CHECKOUT_3_DART, ENTER_SCORE_BUTTON } from '../../helpers/constants';
import { checkoutWith, keyPad } from '../../helpers/sayg';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';

describe('MatchPlayerSelection', () => {
    const emptyTeam: GameTeamDto = { id: '', name: '' };

    let context: TestContext;
    let reportedError: ErrorState;
    let updatedMatch: GameMatchDto | null;
    let updatedMatchOptions: GameMatchOptionDto | null;
    let additional180: GamePlayerDto | null;
    let additionalHiCheck: {
        notablePlayer: GamePlayerDto;
        score: number;
    } | null;
    let createPlayerFor: ICreatePlayerFor | null;
    let isFullScreen: boolean = false;

    async function onMatchChanged(newMatch: GameMatchDto) {
        updatedMatch = newMatch;
    }
    async function onMatchOptionsChanged(newMatchOptions: GameMatchOptionDto) {
        updatedMatchOptions = newMatchOptions;
    }
    async function on180(player: GamePlayerDto) {
        additional180 = player;
    }
    async function onHiCheck(notablePlayer: GamePlayerDto, score: number) {
        additionalHiCheck = { notablePlayer, score };
    }
    async function setCreatePlayerFor(opts: ICreatePlayerFor) {
        createPlayerFor = opts;
    }
    async function enterFullScreen() {
        isFullScreen = true;
    }
    async function exitFullScreen() {
        isFullScreen = false;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedMatch = null;
        updatedMatchOptions = null;
        additional180 = null;
        additionalHiCheck = null;
        createPlayerFor = null;
        isFullScreen = false;
    });

    async function renderComponent(
        account: UserDto,
        props: IMatchPlayerSelectionProps,
        containerProps: ILeagueFixtureContainerProps,
        matchTypeProps: IMatchTypeContainerProps,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(
                {
                    account,
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen,
                        exitFullScreen,
                        toggleFullScreen: noop,
                    },
                },
                reportedError,
            ),
            <LeagueFixtureContainer {...containerProps}>
                <MatchTypeContainer
                    {...matchTypeProps}
                    setCreatePlayerFor={setCreatePlayerFor}>
                    <MatchPlayerSelection {...props} />
                </MatchTypeContainer>
            </LeagueFixtureContainer>,
            undefined,
            undefined,
            'tbody',
        );
    }

    function assertSelectedPlayer(
        cell: HTMLTableCellElement,
        expected?: string,
    ) {
        const displayedItem = cell.querySelector(
            '.btn-group .dropdown-toggle',
        )!;
        expect(displayedItem).toBeTruthy();

        if (expected) {
            expect(displayedItem.textContent).toEqual(expected);
        } else {
            expect(displayedItem.textContent!.trim()).toEqual('');
        }
    }

    function assertSelectablePlayers(
        cell: HTMLTableCellElement,
        expected: string[],
    ) {
        const menuItems = Array.from(
            cell.querySelectorAll('.btn-group .dropdown-item'),
        );
        const menuItemText = menuItems.map((item) => item.textContent!.trim());
        expect(menuItemText).toEqual([''].concat(expected));
    }

    function assertScore(cell: HTMLTableCellElement, expected: string) {
        const input = cell.querySelector('input')!;
        expect(input).toBeTruthy();
        expect(input.value).toEqual(expected);
    }

    async function selectPlayer(
        cell: HTMLTableCellElement,
        playerName: string,
    ) {
        await doSelectOption(cell.querySelector('.dropdown-menu'), playerName);
    }

    function props(match: IMatchBuilder): IMatchPlayerSelectionProps {
        return {
            match: match.build(),
            on180,
            onHiCheck,
            onMatchChanged,
            onMatchOptionsChanged,
        };
    }

    describe('renders', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const account: UserDto = user({});
        const homePlayer: TeamPlayerDto & ISelectablePlayer =
            playerBuilder('HOME').build();
        const awayPlayer: TeamPlayerDto & ISelectablePlayer =
            playerBuilder('AWAY').build();
        const newPlayer: TeamPlayerDto & ISelectablePlayer = playerBuilder(
            'Add a player...',
            NEW_PLAYER,
        ).build();
        const defaultMatchType: IMatchTypeContainerProps = {
            otherMatches: [],
            matchOptions: matchOptionsBuilder()
                .numberOfLegs(5)
                .playerCount(1)
                .build(),
            homePlayers: [],
            awayPlayers: [],
            setCreatePlayerFor,
        };
        const defaultContainerProps: ILeagueFixtureContainerProps = {
            disabled: false,
            readOnly: false,
            season: season,
            division: division,
            homePlayers: [homePlayer, newPlayer],
            awayPlayers: [awayPlayer, newPlayer],
            home: emptyTeam,
            away: emptyTeam,
        };

        it('when no players selected', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], undefined);
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            assertSelectedPlayer(cells[4], undefined);
        });

        it('when no scores', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome(homePlayer).withAway(awayPlayer)),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when home winner', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(3, 1),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '3');
            assertScore(cells[3], '1');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).toContain('bg-winner');
            expect(cells[1].className).toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when home player has not won but has more legs', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(2, 1),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '2');
            assertScore(cells[3], '1');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when away winner', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 3),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '1');
            assertScore(cells[3], '3');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).toContain('bg-winner');
            expect(cells[4].className).toContain('bg-winner');
        });

        it('when away player has not won but has more legs', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 2),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '1');
            assertScore(cells[3], '2');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when a draw', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '1');
            assertScore(cells[3], '1');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('possible home players', async () => {
            const anotherHomePlayer = playerBuilder('ANOTHER HOME').build();
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, anotherHomePlayer],
                awayPlayers: [awayPlayer],
                home: emptyTeam,
                away: emptyTeam,
            };

            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                containerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME', 'ANOTHER HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('possible away players', async () => {
            const anotherAwayPlayer = playerBuilder('ANOTHER AWAY').build();
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer, anotherAwayPlayer],
                home: emptyTeam,
                away: emptyTeam,
            };

            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                containerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY', 'ANOTHER AWAY']);
        });

        it('when home players are selected for other matches', async () => {
            const anotherHomePlayer = playerBuilder('ANOTHER HOME').build();
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, anotherHomePlayer],
                awayPlayers: [awayPlayer],
                home: emptyTeam,
                away: emptyTeam,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [
                    {
                        id: createTemporaryId(),
                        homeScore: 2,
                        awayScore: 2,
                        homePlayers: [anotherHomePlayer],
                        awayPlayers: [],
                    },
                ],
                matchOptions: matchOptionsBuilder()
                    .playerCount(1)
                    .numberOfLegs(5)
                    .build(),
                setCreatePlayerFor,
                awayPlayers: [],
                homePlayers: [],
            };

            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                containerProps,
                matchTypeProps,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('when away players are selected for other matches', async () => {
            const anotherAwayPlayer = playerBuilder('ANOTHER AWAY').build();
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer, anotherAwayPlayer],
                home: emptyTeam,
                away: emptyTeam,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [
                    {
                        id: createTemporaryId(),
                        homeScore: 2,
                        awayScore: 2,
                        homePlayers: [],
                        awayPlayers: [anotherAwayPlayer],
                    },
                ],
                matchOptions: matchOptionsBuilder()
                    .playerCount(1)
                    .numberOfLegs(5)
                    .build(),
                setCreatePlayerFor,
                awayPlayers: [],
                homePlayers: [],
            };

            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                containerProps,
                matchTypeProps,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('when permitted to record scores as you go', async () => {
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).toContain('📊');
        });

        it('when not permitted to record scores as you go', async () => {
            await renderComponent(
                user({ recordScoresAsYouGo: false }),
                props(
                    matchBuilder()
                        .withHome(homePlayer)
                        .withAway(awayPlayer)
                        .scores(1, 1),
                ),
                defaultContainerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).not.toContain('📊');
        });
    });

    describe('interactivity', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const account: UserDto = user({
            recordScoresAsYouGo: false,
            managePlayers: true,
        });
        const homePlayer: TeamPlayerDto & ISelectablePlayer =
            playerBuilder('HOME').build();
        const awayPlayer: TeamPlayerDto & ISelectablePlayer =
            playerBuilder('AWAY').build();
        const newPlayer: TeamPlayerDto & ISelectablePlayer = playerBuilder(
            'Add a player...',
            NEW_PLAYER,
        ).build();
        const defaultMatchType: IMatchTypeContainerProps = {
            otherMatches: [],
            matchOptions: matchOptionsBuilder()
                .playerCount(1)
                .numberOfLegs(5)
                .startingScore(501)
                .build(),
            setCreatePlayerFor,
            awayPlayers: [],
            homePlayers: [],
        };
        const defaultContainerProps: ILeagueFixtureContainerProps = {
            disabled: false,
            readOnly: false,
            season: season,
            division: division,
            homePlayers: [homePlayer, newPlayer],
            awayPlayers: [awayPlayer, newPlayer],
            away: emptyTeam,
            home: emptyTeam,
        };

        it('can set home player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([homePlayer]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.awayScore).toBeFalsy();
            expect(updatedMatch!.awayScore).toBeFalsy();
        });

        it('can add a home player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'Add a player...');

            reportedError.verifyNoError();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'home',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset a home player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome(homePlayer).withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], ' ');

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toEqual(null);
            expect(updatedMatch!.awayScore).toBeFalsy();
        });

        it('can set away player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'AWAY');

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([awayPlayer]);
            expect(updatedMatch!.homeScore).toBeFalsy();
            expect(updatedMatch!.awayScore).toBeFalsy();
        });

        it('can add an away player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'Add a player...');

            reportedError.verifyNoError();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'away',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset an away player', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway(awayPlayer)),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], ' ');

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toBeFalsy();
            expect(updatedMatch!.awayScore).toEqual(null);
        });

        it('can update home score', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toEqual(3);
            expect(updatedMatch!.awayScore).toBeFalsy();
        });

        it('can update away score', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toBeFalsy();
            expect(updatedMatch!.awayScore).toEqual(3);
        });

        it('sets homeScore to numberOfLegs if greater than numberOfLegs', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '6', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toEqual(5);
            expect(updatedMatch!.awayScore).toBeFalsy();
        });

        it('sets awayScore to numberOfLegs if greater than numberOfLegs', async () => {
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '6', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toBeFalsy();
            expect(updatedMatch!.awayScore).toEqual(5);
        });

        it('changes away score down if entered home score + existing away score > numberOfLegs', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder().scores(undefined, 3).withHome().withAway(),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toEqual(3);
            expect(updatedMatch!.awayScore).toEqual(2);
        });

        it('changes home score down if entered away score + existing home score > numberOfLegs', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder().scores(3, undefined).withHome().withAway(),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch!.homePlayers).toEqual([]);
            expect(updatedMatch!.awayPlayers).toEqual([]);
            expect(updatedMatch!.homeScore).toEqual(2);
            expect(updatedMatch!.awayScore).toEqual(3);
        });

        it('can update match options [playerCount]', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog =
                cells[4].querySelector('div.modal-dialog')!;
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(
                matchOptionsDialog,
                'input[name="playerCount"]',
                '3',
                context.user,
            );

            expect(updatedMatchOptions).toEqual({
                playerCount: 3,
                numberOfLegs: 5,
                startingScore: 501,
            });
        });

        it('can update match options [numberOfLegs]', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog =
                cells[4].querySelector('div.modal-dialog')!;
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(
                matchOptionsDialog,
                'input[name="numberOfLegs"]',
                '3',
                context.user,
            );

            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 3,
                startingScore: 501,
            });
        });

        it('can update match options [startingScore]', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog =
                cells[4].querySelector('div.modal-dialog')!;
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(
                matchOptionsDialog,
                'input[name="startingScore"]',
                '601',
                context.user,
            );

            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 5,
                startingScore: 601,
            });
        });

        it('can close match options dialog', async () => {
            await renderComponent(
                account,
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog =
                cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doClick(findButton(matchOptionsDialog, 'Close'));

            reportedError.verifyNoError();
            expect(cells[4].querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('cannot modify players when readonly', async () => {
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: true,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                home: emptyTeam,
                away: emptyTeam,
            };
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                containerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');
            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await selectPlayer(cells[4], 'AWAY');
            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify scores when readonly', async () => {
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: true,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                away: emptyTeam,
                home: emptyTeam,
            };
            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                containerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);
            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await doChange(cells[3], 'input', '3', context.user);
            reportedError.verifyNoError();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify players when disabled', async () => {
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: true,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                home: teamBuilder('HOME_TEAM').build(),
                away: teamBuilder('AWAY_TEAM').build(),
            };

            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                containerProps,
                defaultMatchType,
            );

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(
                Array.from(cells[0].querySelectorAll('.dropdown-item')),
            ).toEqual([]);
            expect(
                Array.from(cells[4].querySelectorAll('.dropdown-item')),
            ).toEqual([]);
        });

        it('cannot modify scores when disabled', async () => {
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: true,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                home: teamBuilder('HOME_TEAM').build(),
                away: teamBuilder('AWAY_TEAM').build(),
            };

            await renderComponent(
                account,
                props(matchBuilder().withHome().withAway()),
                containerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[1].querySelector('input')).toBeFalsy();
            expect(cells[3].querySelector('input')).toBeFalsy();
        });

        it('can open sayg dialog in fullscreen', async () => {
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doClick(findButton(cells[0], '📊'));

            expect(cells[0].querySelector('div.modal-dialog')).toBeTruthy();
            expect(isFullScreen).toEqual(true);
        });

        it('opens sayg dialog without opening in fullscreen', async () => {
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(
                    matchBuilder()
                        .scores(3, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doClick(findButton(cells[0], '📊'));

            expect(cells[0].querySelector('div.modal-dialog')).toBeTruthy();
            expect(isFullScreen).toEqual(false);
        });

        it('can record home sayg 180', async () => {
            const match = matchBuilder()
                .scores(0, 0)
                .withHome(homePlayer)
                .withAway(awayPlayer)
                .sayg((s) =>
                    s.withLeg(0, (l) =>
                        l
                            .playerSequence('home', 'away')
                            .home()
                            .away()
                            .currentThrow('home')
                            .startingScore(501),
                    ),
                );
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(match),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog')!;

            await keyPad(
                context,
                ['1', '8', '0', ENTER_SCORE_BUTTON],
                saygDialog,
            );

            expect(additional180).toEqual({
                name: 'HOME',
                id: homePlayer.id,
            });
        });

        it('can record away sayg 180', async () => {
            const match = matchBuilder()
                .scores(0, 0)
                .withHome(homePlayer)
                .withAway(awayPlayer)
                .sayg((s) =>
                    s.withLeg(0, (l) =>
                        l
                            .playerSequence('home', 'away')
                            .home()
                            .away()
                            .currentThrow('away')
                            .startingScore(501),
                    ),
                );
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(match),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog')!;

            await keyPad(
                context,
                ['1', '8', '0', ENTER_SCORE_BUTTON],
                saygDialog,
            );

            expect(additional180).toEqual({
                name: 'AWAY',
                id: awayPlayer.id,
            });
        });

        it('can record home sayg hi-check', async () => {
            const match = matchBuilder()
                .scores(0, 0)
                .withHome(homePlayer)
                .withAway(awayPlayer)
                .sayg((s) =>
                    s.withLeg(0, (l) =>
                        l
                            .playerSequence('home', 'away')
                            .home((c) => c.withThrow(400))
                            .away((c) => c.withThrow(0))
                            .currentThrow('home')
                            .startingScore(501),
                    ),
                );
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(match),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog')!;

            await keyPad(
                context,
                ['1', '0', '1', ENTER_SCORE_BUTTON],
                saygDialog,
            );
            await checkoutWith(context, CHECKOUT_3_DART, saygDialog);

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'HOME',
                    id: homePlayer.id,
                },
                score: 101,
            });
            expect(updatedMatch!.homeScore).toEqual(1);
            expect(updatedMatch!.awayScore).toEqual(0);
        });

        it('can record away sayg hi-check', async () => {
            const match = matchBuilder()
                .scores(0, 0)
                .withHome(homePlayer)
                .withAway(awayPlayer)
                .sayg((s) =>
                    s.withLeg(0, (l) =>
                        l
                            .playerSequence('home', 'away')
                            .home((c) => c.withThrow(0))
                            .away((c) => c.withThrow(400))
                            .currentThrow('away')
                            .startingScore(501),
                    ),
                );
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(match),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog')!;

            await keyPad(
                context,
                ['1', '0', '1', ENTER_SCORE_BUTTON],
                saygDialog,
            );
            await checkoutWith(context, CHECKOUT_3_DART, saygDialog);

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'AWAY',
                    id: awayPlayer.id,
                },
                score: 101,
            });
            expect(updatedMatch!.homeScore).toEqual(0);
            expect(updatedMatch!.awayScore).toEqual(1);
        });

        it('can show match statistics', async () => {
            const match = matchBuilder()
                .scores(0, 3)
                .withHome(homePlayer)
                .withAway(awayPlayer)
                .sayg((s) =>
                    s
                        .withLeg(0, (l) =>
                            l
                                .playerSequence('home', 'away')
                                .home((c) => c.withThrow(400))
                                .away((c) => c.withThrow(501))
                                .currentThrow('away')
                                .startingScore(501),
                        )
                        .withLeg(1, (l) =>
                            l
                                .playerSequence('home', 'away')
                                .home((c) => c.withThrow(400))
                                .away((c) => c.withThrow(501))
                                .currentThrow('away')
                                .startingScore(501),
                        )
                        .withLeg(2, (l) =>
                            l
                                .playerSequence('home', 'away')
                                .home((c) => c.withThrow(0))
                                .away((c) => c.withThrow(400))
                                .currentThrow('away')
                                .startingScore(501),
                        )
                        .numberOfLegs(5)
                        .scores(0, 3),
                );
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(match),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain('Match statistics');
        });

        it('can close sayg dialog', async () => {
            await renderComponent(
                user({ recordScoresAsYouGo: true }),
                props(
                    matchBuilder()
                        .scores(1, 1)
                        .withHome(homePlayer)
                        .withAway(awayPlayer),
                ),
                defaultContainerProps,
                defaultMatchType,
            );
            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');
            expect(saygDialog).toBeTruthy();

            await doClick(findButton(saygDialog, 'Close'));

            reportedError.verifyNoError();
            expect(cells[0].querySelector('div.modal-dialog')).toBeFalsy();
        });
    });
});
