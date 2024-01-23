import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../helpers/tests";
import React from "react";
import {IPrintDivisionHeadingProps, PrintDivisionHeading} from "./PrintDivisionHeading";
import {DivisionDataContainer, IDivisionDataContainerProps} from "./DivisionDataContainer";
import {seasonBuilder} from "../helpers/builders/seasons";

describe('PrintDivisionHeading', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: IPrintDivisionHeadingProps, divisionData : IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <DivisionDataContainer {...divisionData}>
                <PrintDivisionHeading {...props} />
            </DivisionDataContainer>);
    }

    describe('when data missing', () => {
        it('renders nothing when no season', async () => {
            await renderComponent({
                hideDivision: false
            }, {season: null, name: 'DIVISION'} as any);

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division included', async () => {
            const season = seasonBuilder('SEASON').build();
            await renderComponent({
                hideDivision: false
            }, {season: season, name: null} as any);

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division excluded', async () => {
            const season = seasonBuilder('SEASON').build();
            await renderComponent({
                hideDivision: true
            }, {season: season, name: null} as any);

            expect(context.container.textContent).toEqual('SEASON');
        });
    })

    describe('when season and division present', () => {
        const season = seasonBuilder('SEASON').build();
        const divisionData: IDivisionDataContainerProps = {season: season, name: 'DIVISION'} as any;

        it('shows division name', async () => {
            await renderComponent({
                hideDivision: false
            }, divisionData);

            expect(context.container.textContent).toEqual('DIVISION, SEASON');
        });

        it('excludes division name', async () => {
            await renderComponent({
                hideDivision: true
            }, divisionData);

            expect(context.container.textContent).toEqual('SEASON');
        });
    });
});