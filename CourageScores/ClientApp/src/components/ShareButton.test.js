// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../helpers/tests";
import React from "react";
import {ShareButton} from "./ShareButton";

describe('ShareButton', () => {
    let context;
    let reportedError;
    let shareData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, currentPath) {
        // noinspection JSValidateTypes
        navigator.share = (data) => shareData = data;
        reportedError = null;
        shareData = null;
        context = await renderApp(
            { },
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
            });

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({
                getHash: () => '#HASH'
            });

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage League');
            expect(shareData.title).toEqual('Courage League');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: () => ''
            });

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage League');
            expect(shareData.title).toEqual('Courage League');
            expect(shareData.url).toContain('/test');
        });

        it('does not share page with null hash', async () => {
            await renderComponent({
                getHash: () => null
            });

            await doClick(context.container, 'button');

            expect(shareData).toBeNull();
        });
    });

    describe('using location hash', () => {
        it('shares page with given title and text', async () => {
            await renderComponent({
                title: 'TITLE',
                text: 'TEXT'
            }, '/test/#HASH');

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({
            }, '/test/#HASH');

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage League');
            expect(shareData.title).toEqual('Courage League');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: () => ''
            });

            await doClick(context.container, 'button');

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage League');
            expect(shareData.title).toEqual('Courage League');
            expect(shareData.url).toContain('/test');
        });
    });
});