import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { DataError } from './DataError';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from './DivisionDataContainer';
import { createTemporaryId } from '../../helpers/projection';
import { DataErrorDto } from '../../interfaces/models/dtos/Division/DataErrorDto';

describe('DataError', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function setDivisionData() {}

    async function onReloadDivision() {
        return null;
    }

    async function renderComponent(
        containerProps: IDivisionDataContainerProps,
        dataError: DataErrorDto,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <DivisionDataContainer {...containerProps}>
                <DataError dataError={dataError} />
            </DivisionDataContainer>,
        );
    }

    describe('renders', () => {
        it('message and no ids', async () => {
            await renderComponent(
                {
                    id: '',
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                { message: 'SOME MESSAGE' },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(0);
        });

        it('with gameId', async () => {
            const gameId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                {
                    message: 'SOME MESSAGE',
                    gameId,
                },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(1);
            const link = context.required('a');
            expect(link.text()).toEqual('View fixture');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/score/${gameId}`,
            );
        });

        it('with tournamentId', async () => {
            const tournamentId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                {
                    message: 'SOME MESSAGE',
                    tournamentId,
                },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(1);
            const link = context.required('a');
            expect(link.text()).toEqual('View tournament');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/tournament/${tournamentId}`,
            );
        });

        it('with teamId', async () => {
            const teamId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                {
                    message: 'SOME MESSAGE',
                    teamId,
                },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(1);
            const link = context.required('a');
            expect(link.text()).toEqual('View team');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/division/${divisionId}/team:${teamId}`,
            );
        });

        it('with playerId only', async () => {
            const playerId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                {
                    message: 'SOME MESSAGE',
                    playerId,
                },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(0);
        });

        it('with teamId and playerId', async () => {
            const teamId = createTemporaryId();
            const playerId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                    name: '',
                    setDivisionData,
                    onReloadDivision,
                },
                {
                    message: 'SOME MESSAGE',
                    teamId,
                    playerId,
                },
            );

            expect(context.text()).toContain('SOME MESSAGE');
            expect(context.all('a').length).toEqual(1);
            const link = context.required('a');
            expect(link.text()).toEqual('View player');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/division/${divisionId}/player:${playerId}@${teamId}`,
            );
        });
    });
});
