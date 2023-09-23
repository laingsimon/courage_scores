// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {SavingProposals} from "./SavingProposals";

describe('SavingProposals', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = null;
    });

    async function renderComponent(props) {
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<SavingProposals {...props} />));
    }

    describe('renders', () => {
        it('when saving and no fixtures to save', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 0,
                saveResults: [{
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }],
                saving: true,
            });

            expect(context.container.innerHTML).not.toContain('spinner-border-sm');
            expect(context.container.textContent).toContain('SAVE MESSAGE');
        });

        it('when saving and some fixtures to save', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 2,
                saveResults: [{
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }],
                saving: true,
            });

            expect(context.container.innerHTML).toContain('spinner-border-sm');
            expect(context.container.textContent).toContain('SAVE MESSAGE');
        });

        it('when not saving and has fixtures to save', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 2,
                saveResults: [{
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }],
                saving: false,
            });

            expect(context.container.innerHTML).not.toContain('spinner-border-sm');
            expect(context.container.textContent).toContain('SAVE MESSAGE');
            expect(context.container.querySelector('.progress')).toBeTruthy();
        });

        it('progress and progress bar', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 2,
                saveResults: [{
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }],
                saving: true,
            });

            const progressStatement = context.container.querySelector('div > div:nth-child(2)');
            const progressBar = context.container.querySelector('.progress .progress-bar');
            expect(progressStatement.textContent).toEqual('1 fixtures of 3 saved');
            expect(progressBar.style.width).toEqual('33.33%');
        });

        it('errors, warnings and messages', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 2,
                saveResults: [{
                    success: true,
                    errors: ['SUCCESSFUL SAVE ERROR'],
                    warnings: ['SUCCESSFUL SAVE WARNING'],
                    messages: ['SUCCESSFUL SAVE MESSAGE'],
                }, {
                    success: false,
                    errors: ['FAILURE SAVE ERROR'],
                    warnings: ['FAILURE SAVE WARNING'],
                    messages: ['FAILURE SAVE MESSAGE'],
                }],
                saving: true,
            });

            const messagesContainer = Array.from(context.container.querySelectorAll('.overflow-auto'));
            expect(messagesContainer.length).toEqual(1); // only one result is unsuccessful
            const failureSaveResult = messagesContainer[0];
            expect(Array.from(failureSaveResult.querySelectorAll('ol:nth-child(1) > li')).map(li => li.textContent)).toEqual(['FAILURE SAVE ERROR']);
            expect(Array.from(failureSaveResult.querySelectorAll('ol:nth-child(2) > li')).map(li => li.textContent)).toEqual(['FAILURE SAVE WARNING']);
            expect(Array.from(failureSaveResult.querySelectorAll('ol:nth-child(3) > li')).map(li => li.textContent)).toEqual(['FAILURE SAVE MESSAGE']);
        });

        it('when no errors, warnings or messages', async () => {
            await renderComponent({
                saveMessage: 'SAVE MESSAGE',
                noOfFixturesToSave: 2,
                saveResults: [{
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }, {
                    success: false,
                    errors: [],
                    warnings: [],
                    messages: [],
                }],
                saving: true,
            });

            const messagesContainer = Array.from(context.container.querySelectorAll('.overflow-auto'));
            expect(messagesContainer.length).toEqual(1);
            expect(messagesContainer[0].querySelectorAll('ol').length).toEqual(0);
        });
    });
});