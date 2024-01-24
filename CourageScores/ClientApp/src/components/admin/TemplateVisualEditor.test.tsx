﻿import {AdminContainer} from "./AdminContainer";
import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {ITemplateVisualEditorProps, TemplateVisualEditor} from "./TemplateVisualEditor";
import {ITemplateDto} from "../../interfaces/serverSide/Season/Creation/ITemplateDto";

describe('TemplateVisualEditor', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: ITemplateDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
    });

    async function onUpdate(value: ITemplateDto) {
        update = value;
    }

    async function renderComponent(props: ITemplateVisualEditorProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<AdminContainer accounts={[]} tables={[]}>
                <TemplateVisualEditor {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('empty template', async () => {
            await renderComponent({
                template: {
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });

            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');
            expect(sharedAddresses.querySelectorAll('li').length).toEqual(1); // heading, no addresses
            const divisions = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisions.querySelectorAll('li').length).toEqual(1); //heading, no divisions
        });

        it('template shared addresses', async () => {
            await renderComponent({
                template: {
                    name: '',
                    sharedAddresses: [ [ 'A' ] ],
                    divisions: [],
                },
                onUpdate,
            });

            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');
            expect(sharedAddresses.textContent).toContain('A ×');
        });

        it('template divisions', async () => {
            await renderComponent({
                template: {
                    name: '',
                    sharedAddresses: [],
                    divisions: [{
                        sharedAddresses: [ [ 'B' ] ],
                        dates: [],
                    }],
                },
                onUpdate,
            });

            const divisions = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisions.textContent).toContain('B ×');
        });
    });

    describe('interactivity', () => {
        it('can update template shared addresses', async () => {
            await renderComponent({
                template: {
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });
            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');

            await doClick(findButton(sharedAddresses, '➕ Add shared address'));

            expect(update).toEqual({
                name: '',
                sharedAddresses: [ [] ],
                divisions: [],
            });
        });

        it('can update divisions', async () => {
            await renderComponent({
                template: {
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });
            const divisions = context.container.querySelector('div > ul:nth-child(2)');

            await doClick(findButton(divisions, '➕ Add another division'));

            expect(update).toEqual({
                sharedAddresses: [],
                name: '',
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
            });
        });
    });
});