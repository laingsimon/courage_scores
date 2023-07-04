// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton} from "../../helpers/tests";
import React from "react";
import {ShareButton} from "./ShareButton";

describe('ShareButton', () => {
    let context;
    let reportedError;
    let shareData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, name, currentPath) {
        // noinspection JSValidateTypes
        navigator.share = (data) => shareData = data;
        reportedError = null;
        shareData = null;
        context = await renderApp(
            { },
            { name },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<ShareButton {...props} />),
            null,
            currentPath);
    }

    describe('with get hash function', () => {
        it('shares page with given title and text', async () => {
            await renderComponent({
                title: 'TITLE',
                text: 'TEXT',
                getHash: () => '#HASH'
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({
                getHash: () => '#HASH'
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: () => ''
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
        });

        it('does not share page with null hash', async () => {
            await renderComponent({
                getHash: () => null
            });

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeNull();
        });
    });

    describe('using location hash', () => {
        it('shares page with given title and text', async () => {
            await renderComponent({
                title: 'TITLE',
                text: 'TEXT'
            }, 'Courage Scores', '/test/#HASH');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({
            }, 'Courage Scores', '/test/#HASH');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: () => ''
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
        });
    });
});