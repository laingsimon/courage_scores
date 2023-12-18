// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../../helpers/tests";
import React from "react";
import {WidescreenSaygPlayerStatistic} from "./WidescreenSaygPlayerStatistic";

describe('WidescreenSaygPlayerStatistic', () => {
    let context;
    let reportedError;
    let newOneDartAverage;

    afterEach(() => {
        cleanUp(context);
    });

    function setOneDartAverage(newValue) {
        newOneDartAverage = newValue;
    }

    async function renderComponent(props) {
        reportedError = null;
        newOneDartAverage = null;
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
            <WidescreenSaygPlayerStatistic {...props} setOneDartAverage={setOneDartAverage} />);
    }

    describe('renders', () => {
        let legs;

        beforeEach(() => {
            legs = {
                '0': {
                    home: {
                        score: 100,
                        noOfDarts: 3,
                    },
                    away: {
                        score: 101,
                        noOfDarts: 4,
                    },
                },
                '1': {
                    home: {
                        score: 102,
                        noOfDarts: 5,
                    },
                    away: {
                        score: 103,
                        noOfDarts: 6,
                    },
                },
            };
        });

        it('No of darts', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });

            expect(context.container.textContent).toContain('Darts5');
        });

        it('NaN leg average', async () => {
            legs['1'].home.noOfDarts = Number.NaN;

            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });

            expect(context.container.textContent).toContain('Leg Avg-');
        });

        it('3-dart leg average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: false,
            });

            expect(context.container.textContent).toContain('Leg Avg61.2');
            expect(context.container.querySelector('sup').textContent).toEqual('3');
        });

        it('1-dart leg average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });

            expect(context.container.textContent).toContain('Leg Avg20.4');
            expect(context.container.querySelector('sup').textContent).toEqual('1');
        });

        it('NaN match average', async () => {
            legs['1'].home.noOfDarts = Number.NaN;

            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });

            expect(context.container.textContent).toContain('Match Avg-');
        });

        it('3-dart match average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: false,
            });

            expect(context.container.textContent).toContain('Match Avg75.75');
            expect(context.container.querySelector('sup').textContent).toEqual('3');
        });

        it('1-dart match average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });

            expect(context.container.textContent).toContain('Match Avg25.25');
            expect(context.container.querySelector('sup').textContent).toEqual('1');
        });
    });

    describe('interactivity', () => {
        const legs = {
            '0': {
                home: {
                    score: 100,
                    noOfDarts: 3,
                },
                away: {
                    score: 101,
                    noOfDarts: 4,
                },
            },
            '1': {
                home: {
                    score: 102,
                    noOfDarts: 5,
                },
                away: {
                    score: 103,
                    noOfDarts: 6,
                },
            },
        };

        it('can change to 1 dart average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: false,
            });
            expect(context.container.querySelector('sup').textContent).toEqual('3');

            await doClick(context.container.querySelector('div:nth-child(2)'));

            expect(newOneDartAverage).toEqual(true);
        });

        it('can change to 3 dart average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
            });
            expect(context.container.querySelector('sup').textContent).toEqual('1');

            await doClick(context.container.querySelector('div:nth-child(3)'));

            expect(newOneDartAverage).toEqual(false);
        });
    });
});