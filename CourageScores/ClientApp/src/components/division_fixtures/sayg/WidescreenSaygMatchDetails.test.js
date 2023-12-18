// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {WidescreenSaygMatchDetails} from "./WidescreenSaygMatchDetails";

describe('WidescreenSaygMatchDetails', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
            },
            <WidescreenSaygMatchDetails {...props} />);
    }

    describe('renders', () => {
        it('best of', async () => {
            await renderComponent({
                legs: {
                    '0': {
                        startingScore: 301,
                    },
                    '1': {
                        startingScore: 501,
                    },
                },
                numberOfLegs: 3,
            });

            expect(context.container.querySelector('span:nth-child(1)').textContent).toEqual('Best of 3');
        });

        it('starting score', async () => {
            await renderComponent({
                legs: {
                    '0': {
                        startingScore: 301,
                    },
                    '1': {
                        startingScore: 501,
                    },
                },
                numberOfLegs: 3,
            });

            expect(context.container.querySelector('span:nth-child(2)').textContent).toEqual('from 501');
        });

        it('leg number', async () => {
            await renderComponent({
                legs: {
                    '0': {
                        startingScore: 301,
                    },
                    '1': {
                        startingScore: 501,
                    },
                },
                numberOfLegs: 3,
            });

            expect(context.container.querySelector('span:nth-child(3)').textContent).toEqual('Leg 2');
        });
    });
});