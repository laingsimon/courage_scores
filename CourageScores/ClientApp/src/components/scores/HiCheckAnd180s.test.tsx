import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { HiCheckAnd180s, IHiCheckAnd180sProps } from './HiCheckAnd180s';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { fixtureBuilder } from '../../helpers/builders/games';
import { playerBuilder } from '../../helpers/builders/players';

describe('HiCheckAnd180s', () => {
    let context: TestContext;
    let updatedFixtureData: GameDto | null;

    async function setFixtureData(newFixtureData: GameDto) {
        updatedFixtureData = newFixtureData;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedFixtureData = null;
    });

    async function renderComponent(props: IHiCheckAnd180sProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <HiCheckAnd180s {...props} />,
            undefined,
            undefined,
            'tbody',
        );
    }

    describe('when logged out', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').build();

        it('when no matches', async () => {
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(1);
            expect(cells[0].element<HTMLTableCellElement>().colSpan).toEqual(5);
            expect(cells[0].text()).toEqual(
                'Select some player/s to add 180s and hi-checks',
            );
        });

        it('when no selected players', async () => {
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .withMatch((m) => m)
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(1);
            expect(cells[0].element<HTMLTableCellElement>().colSpan).toEqual(5);
            expect(cells[0].text()).toEqual(
                'Select some player/s to add 180s and hi-checks',
            );
        });

        it('when empty selected players', async () => {
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .withMatch((m) => m.withHome().withAway())
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(1);
            expect(cells[0].element<HTMLTableCellElement>().colSpan).toEqual(5);
            expect(cells[0].text()).toEqual(
                'Select some player/s to add 180s and hi-checks',
            );
        });

        it('when no 180s or hi-checks', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .withMatch((m) => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(3);
            expect(cells[0].text()).toEqual('180s');
            expect(cells[1].text()).toEqual('');
            expect(cells[2].text()).toEqual('100+ c/o');
        });

        it('when some 180s', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .withMatch((m) => m.withHome(homePlayer).withAway(awayPlayer))
                .with180(homePlayer)
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(3);
            const cell = cells[0];
            expect(cell.text()).toContain('180s');
            expect(cell.text()).toContain('HOME player');
            expect(cell.text()).not.toContain('🗑');
            expect(cell.text()).not.toContain('➕');
        });

        it('when some hi-checks', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .forDivision(division)
                .forSeason(season)
                .withMatch((m) => m.withHome(homePlayer).withAway(awayPlayer))
                .withHiCheck(homePlayer, 100)
                .build();

            await renderComponent({
                saving: false,
                access: 'readonly',
                fixtureData,
                setFixtureData,
            });

            const cells = context.all('td');
            expect(cells.length).toEqual(3);
            const cell = cells[2];
            expect(cell.text()).toContain('100+ c/o');
            expect(cell.text()).toContain('HOME player (100)');
            expect(cell.text()).not.toContain('🗑');
            expect(cell.text()).not.toContain('➕');
        });
    });

    describe('when logged in', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').build();

        describe('renders', () => {
            it('when no matches', async () => {
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const cells = context.all('td');
                expect(cells.length).toEqual(1);
                expect(
                    cells[0].element<HTMLTableCellElement>().colSpan,
                ).toEqual(5);
                expect(cells[0].text()).toEqual(
                    'Select some player/s to add 180s and hi-checks',
                );
            });

            it('when no selected players', async () => {
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) => m.withHome().withAway())
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const cells = context.all('td');
                expect(cells.length).toEqual(1);
                expect(
                    cells[0].element<HTMLTableCellElement>().colSpan,
                ).toEqual(5);
                expect(cells[0].text()).toEqual(
                    'Select some player/s to add 180s and hi-checks',
                );
            });

            it('when no 180s or hi-checks', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const cells = context.all('td');
                expect(cells.length).toEqual(3);
                expect(cells[0].text()).toContain('180s');
                expect(cells[0].text()).toContain('HOME player');
                expect(cells[0].text()).toContain('AWAY player');
                expect(cells[0].text()).toContain('➕');
                expect(cells[1].text()).toEqual('');
                expect(cells[2].text()).toContain('100+ c/o');
                expect(cells[2].text()).toContain('HOME player');
                expect(cells[2].text()).toContain('AWAY player');
                expect(cells[2].text()).toContain('➕');
            });

            it('when some 180s', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .with180(homePlayer)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const cells = context.all('td');
                expect(cells.length).toEqual(3);
                const cell = cells[0];
                expect(cell.text()).toContain('180s');
                expect(cell.text()).toContain('HOME player 🗑');
                expect(cell.text()).toContain('➕');
            });

            it('when some hi-checks', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .withHiCheck(homePlayer, 100)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const cells = context.all('td');
                expect(cells.length).toEqual(3);
                const cell = cells[2];
                expect(cell.text()).toContain('100+ c/o');
                expect(cell.text()).toContain('HOME player (100) 🗑');
                expect(cell.text()).toContain('➕');
            });
        });

        describe('changes', () => {
            it('add a 180', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .with180(homePlayer)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                const td180s = context.all('td')[0];
                const addPlayerContainer = td180s.required('ol li:last-child');
                await addPlayerContainer
                    .required('.dropdown-menu')
                    .select('AWAY player');
                await addPlayerContainer.button('➕').click();

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.oneEighties).toEqual([
                    { id: homePlayer.id, name: homePlayer.name },
                    { id: awayPlayer.id, name: awayPlayer.name },
                ]);
            });

            it('remove a 180', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .with180(homePlayer)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                const td180s = context.all('td')[0];
                expect(td180s).toBeTruthy();
                await td180s.button('HOME player 🗑').click();

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.oneEighties).toEqual([]);
            });

            it('add a hi-check', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .withHiCheck(homePlayer, 100)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                const tdHiChecks = context.all('td')[2];
                const addPlayerContainer =
                    tdHiChecks.required('ol li:last-child');
                await addPlayerContainer.required('input').change('140');
                await addPlayerContainer
                    .required('.dropdown-menu')
                    .select('AWAY player');
                await addPlayerContainer.button('➕').click();

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.over100Checkouts).toEqual([
                    { id: homePlayer.id, name: homePlayer.name, score: 100 },
                    { id: awayPlayer.id, name: awayPlayer.name, score: 140 },
                ]);
            });

            it('remove a hi-check', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .forDivision(division)
                    .forSeason(season)
                    .withMatch((m) =>
                        m.withHome(homePlayer).withAway(awayPlayer),
                    )
                    .withHiCheck(homePlayer, 100)
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                const tdHiChecks = context.all('td')[2];
                expect(tdHiChecks).toBeTruthy();
                await tdHiChecks.button('HOME player (100) 🗑').click();

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.over100Checkouts).toEqual([]);
            });
        });
    });
});
