// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {WidescreenSaygMatchDetails} from "./WidescreenSaygMatchDetails";
import {saygBuilder} from "../../../helpers/builders";

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
        const sayg = saygBuilder()
            .numberOfLegs(3)
            .withLeg('0', l => l.startingScore(301))
            .withLeg('1', l => l.startingScore(501))
            .build();

        it('best of', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(1)').textContent).toEqual('Best of 3');
        });

        it('starting score', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(2)').textContent).toEqual('from 501');
        });

        it('leg number', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(3)').textContent).toEqual('Leg 2');
        });
    });
});