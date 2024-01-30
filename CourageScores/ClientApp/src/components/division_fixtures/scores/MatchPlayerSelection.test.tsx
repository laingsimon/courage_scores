import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMatchPlayerSelectionProps, MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {ILeagueFixtureContainerProps, LeagueFixtureContainer} from "./LeagueFixtureContainer";
import {IMatchTypeContainerProps, MatchTypeContainer} from "./MatchTypeContainer";
import {IUserDto} from "../../../interfaces/models/dtos/Identity/IUserDto";
import {IGamePlayerDto} from "../../../interfaces/models/dtos/Game/IGamePlayerDto";
import {IGameMatchOptionDto} from "../../../interfaces/models/dtos/Game/IGameMatchOptionDto";
import {IGameMatchDto} from "../../../interfaces/models/dtos/Game/IGameMatchDto";
import {ICreatePlayerFor} from "./Score";
import {ISeasonDto} from "../../../interfaces/models/dtos/Season/ISeasonDto";
import {IDivisionDto} from "../../../interfaces/models/dtos/IDivisionDto";
import {ITeamPlayerDto} from "../../../interfaces/models/dtos/Team/ITeamPlayerDto";
import {ISelectablePlayer} from "../../division_players/PlayerSelection";
import {playerBuilder} from "../../../helpers/builders/players";
import {matchBuilder, matchOptionsBuilder} from "../../../helpers/builders/games";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {teamBuilder} from "../../../helpers/builders/teams";
import {ILegBuilder, ILegCompetitorScoreBuilder, IRecordedSaygBuilder} from "../../../helpers/builders/sayg";
import {createTemporaryId} from "../../../helpers/projection";

describe('MatchPlayerSelection', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedMatch: IGameMatchDto;
    let updatedMatchOptions: IGameMatchOptionDto;
    let additional180: IGamePlayerDto;
    let additionalHiCheck: {notablePlayer: IGamePlayerDto, score: string};
    let createPlayerFor: ICreatePlayerFor;

    async function onMatchChanged(newMatch: IGameMatchDto){
        updatedMatch = newMatch;
    }
    async function onMatchOptionsChanged(newMatchOptions: IGameMatchOptionDto){
        updatedMatchOptions = newMatchOptions;
    }
    async function on180(player: IGamePlayerDto){
        additional180 = player;
    }
    async function onHiCheck(notablePlayer: IGamePlayerDto, score: string){
        additionalHiCheck = {notablePlayer, score};
    }
    async function setCreatePlayerFor(opts: ICreatePlayerFor){
        createPlayerFor = opts;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedMatch = null;
        updatedMatchOptions = null;
        additional180 = null;
        additionalHiCheck = null;
        createPlayerFor = null;
    });

    async function renderComponent(account: IUserDto, props: IMatchPlayerSelectionProps, containerProps: ILeagueFixtureContainerProps, matchTypeProps: IMatchTypeContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account
            }, reportedError),
            (<LeagueFixtureContainer {...containerProps}>
                <MatchTypeContainer {...matchTypeProps} setCreatePlayerFor={setCreatePlayerFor}>
                    <MatchPlayerSelection {...props} />
                </MatchTypeContainer>
            </LeagueFixtureContainer>),
            null,
            null,
            'tbody');
    }

    function assertSelectedPlayer(cell: HTMLTableCellElement, expected?: string) {
        const displayedItem = cell.querySelector('.btn-group .dropdown-toggle');
        expect(displayedItem).toBeTruthy();

        if (expected) {
            expect(displayedItem.textContent).toEqual(expected);
        } else {
            expect(displayedItem.textContent.trim()).toEqual('');
        }
    }

    function assertSelectablePlayers(cell: HTMLTableCellElement, expected: string[]) {
        const menuItems = Array.from(cell.querySelectorAll('.btn-group .dropdown-item'));
        const menuItemText = menuItems.map(item => item.textContent.trim());
        expect(menuItemText).toEqual([''].concat(expected));
    }

    function assertScore(cell: HTMLTableCellElement, expected: string) {
        const input = cell.querySelector('input');
        expect(input).toBeTruthy();
        expect(input.value).toEqual(expected);
    }

    async function selectPlayer(cell: HTMLTableCellElement, playerName: string) {
        await doSelectOption(cell.querySelector('.dropdown-menu'), playerName);
    }

    describe('renders', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const account: IUserDto = {
            emailAddress: '',
            givenName: '',
            name: '',
            access: {},
        };
        const homePlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('HOME').build();
        const awayPlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('AWAY').build();
        const newPlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('Add a player...', NEW_PLAYER).build();
        const defaultMatchType: IMatchTypeContainerProps = {
            otherMatches: [],
            matchOptions: matchOptionsBuilder().numberOfLegs(5).playerCount(1).build(),
            homePlayers: null,
            awayPlayers: null,
            setCreatePlayerFor: null,
        };
        const defaultContainerProps: ILeagueFixtureContainerProps = {
            disabled: false,
            readOnly: false,
            season: season,
            division: division,
            homePlayers: [homePlayer, newPlayer],
            awayPlayers: [awayPlayer, newPlayer],
            home: null,
            away: null,
        };

        it('when no players selected', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder().withHome().withAway().build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], null);
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            assertSelectedPlayer(cells[4], null);
        });

        it('when no scores', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder().withHome(homePlayer).withAway(awayPlayer).build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when home winner', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(3, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
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

        it('when away winner', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 3)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
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

        it('when a draw', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
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
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, anotherHomePlayer],
                awayPlayers: [awayPlayer],
                home: null,
                away: null,
            };

            await renderComponent(account, props, containerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME', 'ANOTHER HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('possible away players', async () => {
            const anotherAwayPlayer = playerBuilder('ANOTHER AWAY').build();
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer, anotherAwayPlayer],
                home: null,
                away: null,
            };

            await renderComponent(account, props, containerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY', 'ANOTHER AWAY']);
        });

        it('when home players are selected for other matches', async () => {
            const anotherHomePlayer = playerBuilder('ANOTHER HOMR').build();
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer, anotherHomePlayer],
                awayPlayers: [awayPlayer],
                home: null,
                away: null,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [{
                    id: createTemporaryId(),
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [anotherHomePlayer],
                    awayPlayers: [],
                }],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).build(),
                setCreatePlayerFor: null,
                awayPlayers: null,
                homePlayers: null,
            };

            await renderComponent(account, props, containerProps, matchTypeProps);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('when away players are selected for other matches', async () => {
            const anotherAwayPlayer = playerBuilder('ANOTHER AWAY').build();
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: false,
                season: season,
                division: division,
                homePlayers: [homePlayer],
                awayPlayers: [awayPlayer, anotherAwayPlayer],
                home: null,
                away: null,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [{
                    id: createTemporaryId(),
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [],
                    awayPlayers: [anotherAwayPlayer],
                }],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).build(),
                setCreatePlayerFor: null,
                awayPlayers: null,
                homePlayers: null,
            };

            await renderComponent(account, props, containerProps, matchTypeProps);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], ['HOME']);
            assertSelectablePlayers(cells[4], ['AWAY']);
        });

        it('when permitted to record scores as you go', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                emailAddress: '',
                name: '',
                givenName: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).toContain('📊');
        });

        it('when not permitted to record scores as you go', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .scores(1, 1)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: false
                }
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).not.toContain('📊');
        });
    });

    describe('interactivity', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                managePlayers: true
            },
        };
        const homePlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('HOME').build();
        const awayPlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('AWAY').build();
        const newPlayer: ITeamPlayerDto & ISelectablePlayer = playerBuilder('Add a player...', NEW_PLAYER).build();
        const defaultMatchType: IMatchTypeContainerProps = {
            otherMatches: [],
            matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).build(),
            setCreatePlayerFor: null,
            awayPlayers: null,
            homePlayers: null,
        };
        const defaultContainerProps: ILeagueFixtureContainerProps = {
            disabled: false,
            readOnly: false,
            season: season,
            division: division,
            homePlayers: [homePlayer, newPlayer],
            awayPlayers: [awayPlayer, newPlayer],
            away: null,
            home: null,
        };

        it('can set home player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([homePlayer]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.awayScore).toBeFalsy();
            expect(updatedMatch.awayScore).toBeFalsy();
        });

        it('can add a home player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'Add a player...');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).not.toBeNull();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'home',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset a home player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome(homePlayer)
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], ' ');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toBeFalsy();
        });

        it('can set away player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'AWAY');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([awayPlayer]);
            expect(updatedMatch.homeScore).toBeFalsy();
            expect(updatedMatch.awayScore).toBeFalsy();
        });

        it('can add an away player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'Add a player...');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).not.toBeNull();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'away',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset an away player', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], ' ');

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toBeFalsy();
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can update home score', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toEqual(3);
            expect(updatedMatch.awayScore).toBeFalsy();
        });

        it('can update away score', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toBeFalsy();
            expect(updatedMatch.awayScore).toEqual(3);
        });

        it('sets homeScore to numberOfLegs if greater than numberOfLegs', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '6', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toEqual(5);
            expect(updatedMatch.awayScore).toBeFalsy();
        });

        it('sets awayScore to numberOfLegs if greater than numberOfLegs', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '6', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toBeFalsy();
            expect(updatedMatch.awayScore).toEqual(5);
        });

        it('changes away score down if entered home score + existing away score > numberOfLegs', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(null, 3)
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toEqual(3);
            expect(updatedMatch.awayScore).toEqual(2);
        });

        it('changes home score down if entered away score + existing home score > numberOfLegs', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(3, null)
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([]);
            expect(updatedMatch.awayPlayers).toEqual([]);
            expect(updatedMatch.homeScore).toEqual(2);
            expect(updatedMatch.awayScore).toEqual(3);
        });

        it('can update match options [playerCount]', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).startingScore(501).build(),
                homePlayers: null,
                awayPlayers: null,
                setCreatePlayerFor: null,
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="playerCount"]', '3', context.user);

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 3,
                numberOfLegs: 5,
                startingScore: 501,
            });
        });

        it('can update match options [numberOfLegs]', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).startingScore(501).build(),
                homePlayers: null,
                awayPlayers: null,
                setCreatePlayerFor: null,
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="numberOfLegs"]', '3', context.user);

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 3,
                startingScore: 501,
            });
        });

        it('can update match options [startingScore]', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).startingScore(501).build(),
                homePlayers: null,
                awayPlayers: null,
                setCreatePlayerFor: null,
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="startingScore"]', '601', context.user);

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 5,
                startingScore: 601,
            });
        });

        it('can close match options dialog', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const matchTypeProps: IMatchTypeContainerProps = {
                otherMatches: [],
                matchOptions: matchOptionsBuilder().playerCount(1).numberOfLegs(5).startingScore(501).build(),
                homePlayers: null,
                awayPlayers: null,
                setCreatePlayerFor: null,
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doClick(findButton(matchOptionsDialog, 'Close'));

            expect(reportedError.hasError()).toEqual(false);
            expect(cells[4].querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('cannot modify players when readonly', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: true,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                home: null,
                away: null,
            };
            await renderComponent(account, props, containerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');
            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await selectPlayer(cells[4], 'AWAY');
            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify scores when readonly', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const containerProps: ILeagueFixtureContainerProps = {
                disabled: false,
                readOnly: true,
                season: season,
                division: division,
                homePlayers: [homePlayer, newPlayer],
                awayPlayers: [awayPlayer, newPlayer],
                away: null,
                home: null,
            };
            await renderComponent(account, props, containerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);
            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await doChange(cells[3], 'input', '3', context.user);
            expect(reportedError.hasError()).toEqual(false);
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify players when disabled', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
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

            await renderComponent(account, props, containerProps, defaultMatchType);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const homePlayers = Array.from(cells[0].querySelectorAll('.dropdown-item'));
            const awayPlayers = Array.from(cells[4].querySelectorAll('.dropdown-item'));
            expect(homePlayers).toEqual([]);
            expect(awayPlayers).toEqual([]);
        });

        it('cannot modify scores when disabled', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .withHome()
                    .withAway()
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
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

            await renderComponent(account, props, containerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const homeScore = cells[1].querySelector('input');
            const awayScore = cells[3].querySelector('input');
            expect(homeScore).toBeFalsy();
            expect(awayScore).toBeFalsy();
        });

        it('can open sayg dialog', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doClick(findButton(cells[0], '📊'));

            const saygDialog = cells[0].querySelector('div.modal-dialog');
            expect(saygDialog).toBeTruthy();
        });

        it('can record home sayg 180', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(0, 0)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .sayg(
                        (s: IRecordedSaygBuilder) => s.withLeg(0, (l: ILegBuilder) => l
                            .playerSequence('home', 'away')
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .currentThrow('home')
                            .startingScore(501)))
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additional180).toEqual({
                name: 'HOME',
                id: homePlayer.id,
                team: null,
            });
        });

        it('can record away sayg 180', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(0, 0)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .sayg(
                        (s: IRecordedSaygBuilder) => s.withLeg(0, (l: ILegBuilder) => l
                            .playerSequence('home', 'away')
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .currentThrow('away')
                            .startingScore(501)))
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additional180).toEqual({
                name: 'AWAY',
                id: awayPlayer.id,
                team: null,
            });
        });

        it('can record home sayg hi-check', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(0, 0)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .sayg(
                        (s: IRecordedSaygBuilder) => s.withLeg(0, (l: ILegBuilder) => l
                            .playerSequence('home', 'away')
                            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(400))
                            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(0))
                            .currentThrow('home')
                            .startingScore(501)))
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '101', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'HOME',
                    id: homePlayer.id,
                    team: null,
                },
                score: '101',
            });
            expect(updatedMatch).toBeTruthy();
            expect(updatedMatch.homeScore).toEqual(1);
            expect(updatedMatch.awayScore).toEqual(0);
        });

        it('can record away sayg hi-check', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(0, 0)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .sayg(
                        (s: IRecordedSaygBuilder) => s.withLeg(0, (l: ILegBuilder) => l
                            .playerSequence('home', 'away')
                            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(400))
                            .currentThrow('away')
                            .startingScore(501)))
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '101', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'AWAY',
                    id: awayPlayer.id,
                    team: null,
                },
                score: '101',
            });
            expect(updatedMatch).toBeTruthy();
            expect(updatedMatch.homeScore).toEqual(0);
            expect(updatedMatch.awayScore).toEqual(1);
        });

        it('can close sayg dialog', async () => {
            const props: IMatchPlayerSelectionProps = {
                match: matchBuilder()
                    .scores(1, 1)
                    .withHome(homePlayer)
                    .withAway(awayPlayer)
                    .build(),
                on180,
                onHiCheck,
                onMatchChanged,
                onMatchOptionsChanged,
            };
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');
            expect(saygDialog).toBeTruthy();

            await doClick(findButton(saygDialog, 'Close'));

            expect(reportedError.hasError()).toEqual(false);
            expect(cells[0].querySelector('div.modal-dialog')).toBeFalsy();
        });
    });
});