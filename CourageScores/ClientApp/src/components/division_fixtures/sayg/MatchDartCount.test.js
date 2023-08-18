// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {MatchDartCount} from "./MatchDartCount";

describe('MatchDartCount', () => {
    let context;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {},
            <MatchDartCount
                {...props} />,
            null,
            null,
            'tbody');
    }

    it('renders nothing when no darts thrown', async () => {
        await renderComponent({
            homeCount: 0,
            awayCount: 0,
            singlePlayer: null,
        });

        expect(context.container.innerHTML).toEqual('');
    });

    it('renders dart counts', async () => {
        await renderComponent({
            homeCount: 10,
            awayCount: 12,
            singlePlayer: null,
        });

        const homeCount = context.container.querySelector('td:nth-child(2)');
        const awayCount = context.container.querySelector('td:nth-child(3)');
        expect(homeCount.textContent).toEqual('10');
        expect(awayCount.textContent).toEqual('12');
    });

    it('renders single player dart count', async () => {
        await renderComponent({
            homeCount: 15,
            awayCount: null,
            singlePlayer: true,
        });

        const homeCount = context.container.querySelector('td:nth-child(2)');
        const awayCount = context.container.querySelector('td:nth-child(3)');
        expect(homeCount.textContent).toEqual('15');
        expect(awayCount).toBeFalsy();
    });

    it('renders home dart count as winner', async () => {
        await renderComponent({
            homeCount: 10,
            awayCount: 15,
            singlePlayer: null,
        });

        const homeCount = context.container.querySelector('td:nth-child(2)');
        const awayCount = context.container.querySelector('td:nth-child(3)');
        expect(homeCount.className).toContain('bg-winner');
        expect(awayCount.className).not.toContain('bg-winner');
    });

    it('renders away dart count as winner', async () => {
        await renderComponent({
            homeCount: 15,
            awayCount: 10,
            singlePlayer: null,
        });

        const homeCount = context.container.querySelector('td:nth-child(2)');
        const awayCount = context.container.querySelector('td:nth-child(3)');
        expect(homeCount.className).not.toContain('bg-winner');
        expect(awayCount.className).toContain('bg-winner');
    });
});