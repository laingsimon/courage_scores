// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {WidescreenSaygPlayerHeading} from "./WidescreenSaygPlayerHeading";

describe('WidescreenSaygPlayerHeading', () => {
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
            <WidescreenSaygPlayerHeading {...props} />);
    }

    describe('score first', () => {
        it('renders score element first', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            const firstElement = context.container.querySelector('h1:nth-child(1)');
            expect(firstElement.textContent).toEqual('123');
        });

        it('renders name element second', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            const firstElement = context.container.querySelector('h1:nth-child(2)');
            expect(firstElement.textContent).toEqual('NAME');
        });

        it('renders nothing else', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            expect(context.container.childNodes[0].childNodes.length).toEqual(2);
        });
    });

    describe('score second', () => {
        it('renders name element first', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            const firstElement = context.container.querySelector('h1:nth-child(1)');
            expect(firstElement.textContent).toEqual('NAME');
        });

        it('renders score element second', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            const firstElement = context.container.querySelector('h1:nth-child(2)');
            expect(firstElement.textContent).toEqual('123');
        });

        it('renders nothing else', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            expect(context.container.childNodes[0].childNodes.length).toEqual(2);
        });
    });
});