import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../helpers/tests";
import React from "react";
import {DataError} from "./DataError";
import {DivisionDataContainer, IDivisionDataContainerProps} from "./DivisionDataContainer";
import {createTemporaryId} from "../helpers/projection";
import {IDataErrorDto} from "../interfaces/dtos/Division/IDataErrorDto";

describe('DataError', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function setDivisionData() {

    }

    async function onReloadDivision() {
        return null;
    }

    async function renderComponent(containerProps: IDivisionDataContainerProps, dataError: IDataErrorDto) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<DivisionDataContainer {...containerProps}>
                <DataError dataError={dataError}/>
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        it('message and no ids', async () => {
            await renderComponent({
                id: '',
                name: '',
                setDivisionData,
                onReloadDivision,
            }, { message: 'SOME MESSAGE' });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(0);
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
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a') as HTMLAnchorElement;
            expect(link.textContent).toEqual('View fixture');
            expect(link.href).toEqual(`http://localhost/score/${gameId}`);
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
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a') as HTMLAnchorElement;
            expect(link.textContent).toEqual('View tournament');
            expect(link.href).toEqual(`http://localhost/tournament/${tournamentId}`);
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
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a') as HTMLAnchorElement;
            expect(link.textContent).toEqual('View team');
            expect(link.href).toEqual(`http://localhost/division/${divisionId}/team:${teamId}`);
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
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(0);
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
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a') as HTMLAnchorElement;
            expect(link.textContent).toEqual('View player');
            expect(link.href).toEqual(`http://localhost/division/${divisionId}/player:${playerId}@${teamId}`);
        });
    });
});