// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../../helpers/tests";
import React from "react";
import {MatchAverage} from "./MatchAverage";

describe('MatchAverage', () => {
    let context;
    let oneDartAverage;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        oneDartAverage = null;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            { },
            <MatchAverage
                {...props}
                setOneDartAverage={(value) => oneDartAverage = value} />,
            null,
            null,
            'tbody');
    }

    it('renders nothing when no averages', async () => {
        await renderComponent({
            homeAverage: null,
            awayAverage: null,
            singlePlayer: null,
            oneDartAverage: false
        });

        expect(context.container.innerHTML).toEqual('');
    });

    it('renders 3 dart average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            singlePlayer: null,
            oneDartAverage: false
        });

        const homeAverage = context.container.querySelector('td:nth-child(2)');
        const awayAverage = context.container.querySelector('td:nth-child(3)');
        expect(homeAverage.textContent).toEqual('30.33');
        expect(awayAverage.textContent).toEqual('20.56');
    });

    it('renders 1 dart average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            singlePlayer: null,
            oneDartAverage: true
        });

        const homeAverage = context.container.querySelector('td:nth-child(2)');
        const awayAverage = context.container.querySelector('td:nth-child(3)');
        expect(homeAverage.textContent).toEqual('10.11');
        expect(awayAverage.textContent).toEqual('6.85');
    });

    it('renders single player average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: null,
            singlePlayer: true,
            oneDartAverage: false
        });

        const homeAverage = context.container.querySelector('td:nth-child(2)');
        const awayAverage = context.container.querySelector('td:nth-child(3)');
        expect(homeAverage.textContent).toEqual('30.33');
        expect(awayAverage).toBeFalsy();
    });

    it('renders home average as winner', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            singlePlayer: null,
            oneDartAverage: false
        });

        const homeAverage = context.container.querySelector('td:nth-child(2)');
        const awayAverage = context.container.querySelector('td:nth-child(3)');
        expect(homeAverage.className).toContain('bg-winner');
        expect(awayAverage.className).not.toContain('bg-winner');
    });

    it('renders away average as winner', async () => {
        await renderComponent({
            homeAverage: 20.5555,
            awayAverage: 30.3333,
            singlePlayer: null,
            oneDartAverage: false
        });

        const homeAverage = context.container.querySelector('td:nth-child(2)');
        const awayAverage = context.container.querySelector('td:nth-child(3)');
        expect(homeAverage.className).not.toContain('bg-winner');
        expect(awayAverage.className).toContain('bg-winner');
    });

    it('can change one dart average option', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            singlePlayer: null,
            oneDartAverage: true
        });
        const toggle = context.container.querySelector('input[id="oneDartAverage"]');
        expect(toggle.checked).toEqual(true);

        await doClick(toggle);

        expect(oneDartAverage).toEqual(false);
    });
});