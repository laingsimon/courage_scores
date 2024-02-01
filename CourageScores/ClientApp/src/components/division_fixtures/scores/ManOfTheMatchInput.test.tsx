import {
    appProps,
    brandingProps,
    cleanUp,
    doSelectOption,
    ErrorState,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {IManOfTheMatchInputProps, ManOfTheMatchInput} from "./ManOfTheMatchInput";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";
import {UserDto} from "../../../interfaces/models/dtos/Identity/UserDto";
import {fixtureBuilder, IMatchBuilder} from "../../../helpers/builders/games";
import {playerBuilder} from "../../../helpers/builders/players";

describe('ManOfTheMatchInput', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedFixtureData: GameDto;

    async function setFixtureData(newFixtureData: GameDto) {
        updatedFixtureData = newFixtureData;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedFixtureData = null;
    });

    async function renderComponent(account: UserDto, props: IManOfTheMatchInputProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account: account,
            }, reportedError),
            (<ManOfTheMatchInput {...props} />),
            null,
            null,
            'tbody');
    }

    function assertPlayers(container: Element, names: string[], displayed: string, selected?: string) {
        names.unshift(' ');

        const players = Array.from(container.querySelectorAll('div.btn-group div[role="menu"] button[role="menuitem"]')) as HTMLButtonElement[];
        const displayedPlayer = container.querySelector('div.btn-group > button > span');
        const selectedPlayer = container.querySelector('div.btn-group div[role="menu"] button[role="menuitem"].active');
        expect(players.map(span => span.textContent)).toEqual(names);
        expect(displayedPlayer.textContent).toEqual(displayed);
        if (selected) {
            expect(selectedPlayer).toBeTruthy();
            expect(selectedPlayer.textContent).toEqual(selected);
        } else {
            if (selectedPlayer) {
                expect(selectedPlayer.textContent).toEqual(' ');
            }
        }
    }

    describe('when logged out', () => {
        const account = null;
        const saving = false;
        const access = '';

        it('when no matches', async () => {
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent(account, { saving, fixtureData, access, setFixtureData });

            expect(context.container.innerHTML).toEqual('');
        });

        it('when no selected players', async () => {
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .withMatch((m: IMatchBuilder) => m.withHome().withAway())
                .build();

            await renderComponent(account, { saving, fixtureData, access, setFixtureData });

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.innerHTML).toEqual('');
        });

        it('when no man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(account, { saving, fixtureData, access, setFixtureData });

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(homePlayer, null)
                .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(account, { saving, fixtureData, access, setFixtureData });

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.innerHTML).toEqual('');
        });

        it('when away man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(null, awayPlayer)
                .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(account, { saving, fixtureData, access, setFixtureData });

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in', () => {
        let account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
        };

        describe('renders', () => {
            it('when no matches', async () => {
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when disabled', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(awayPlayer, homePlayer)
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData, disabled: true });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                expect(cells[0].querySelector('.dropdown-toggle').textContent).toEqual('AWAY player');
                expect(cells[2].querySelector('.dropdown-toggle').textContent).toEqual('HOME player');
            });

            it('when no selected players', async () => {
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway())
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when no man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], ['AWAY player'], ' ', null);
                assertPlayers(cells[2], ['HOME player'], ' ', null);
            });

            it('when home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(awayPlayer, null)
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], ['AWAY player'], 'AWAY player', 'AWAY player');
            });

            it('when away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(null, homePlayer)
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[2], ['HOME player'], 'HOME player', 'HOME player');
            });
        });

        describe('changes', () => {
            it('set home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();
                expect(reportedError.hasError()).toEqual(false);
                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), 'AWAY player')

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toEqual(awayPlayer.id);
            });

            it('unset home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(homePlayer, null)
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                expect(reportedError.hasError()).toEqual(false);
                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), ' ');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toBeUndefined();
            });

            it('set away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                expect(reportedError.hasError()).toEqual(false);
                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });
                const awayMOM = context.container.querySelectorAll('td')[2];

                await doSelectOption(awayMOM.querySelector('.dropdown-menu'), 'HOME player');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.away.manOfTheMatch).toEqual(homePlayer.id);
            });

            it('unset away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(null, awayPlayer)
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                expect(reportedError.hasError()).toEqual(false);
                await renderComponent(account, { saving: false, fixtureData, access: 'admin', setFixtureData });
                const awayMOM = context.container.querySelectorAll('td')[2];

                await doSelectOption(awayMOM.querySelector('.dropdown-menu'), ' ');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.away.manOfTheMatch).toBeUndefined();
            });
        });
    });
});