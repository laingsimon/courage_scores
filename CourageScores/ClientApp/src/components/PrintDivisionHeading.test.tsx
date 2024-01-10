// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../helpers/tests";
import React from "react";
import {PrintDivisionHeading} from "./PrintDivisionHeading";
import {DivisionDataContainer} from "./DivisionDataContainer";
import {seasonBuilder} from "../helpers/builders";

describe('PrintDivisionHeading', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData) {
        reportedError = null;
        context = await renderApp(
            {},
            {},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            <DivisionDataContainer {...divisionData}>
                <PrintDivisionHeading {...props} />
            </DivisionDataContainer>);
    }

    describe('when data missing', () => {
        it('renders nothing when no season', async () => {
            await renderComponent({
                hideDivision: false
            }, {season: null, name: 'DIVISION'});

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division included', async () => {
            const season = seasonBuilder('SEASON').build();
            await renderComponent({
                hideDivision: false
            }, {season: season, name: null});

            expect(context.container.textContent).toEqual('');
        });

        it('renders nothing when no division and division excluded', async () => {
            const season = seasonBuilder('SEASON').build();
            await renderComponent({
                hideDivision: true
            }, {season: season, name: null});

            expect(context.container.textContent).toEqual('SEASON');
        });
    })

    describe('when season and division present', () => {
        const season = seasonBuilder('SEASON').build();
        const divisionData = {season: season, name: 'DIVISION'};

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