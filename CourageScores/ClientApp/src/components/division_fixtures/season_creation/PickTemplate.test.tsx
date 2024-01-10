// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../../helpers/tests";
import React from "react";
import {PickTemplate} from "./PickTemplate";
import {createTemporaryId} from "../../../helpers/projection";

describe('PickTemplate', () => {
    let context;
    let reportedError;
    let selectedTemplate;

    function setSelectedTemplate(template) {
        selectedTemplate = template;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        selectedTemplate = null;
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
            (<PickTemplate
                {...props}
                setSelectedTemplate={setSelectedTemplate}/>));
    }

    describe('renders', () => {
        const compatibleTemplate = {
            success: true,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: {
                id: createTemporaryId(),
                name: 'COMPATIBLE',
                description: 'COMPATIBLE DESCRIPTION',
                templateHealth: {
                    errors: ['HEALTH ERROR'],
                    warnings: ['HEALTH WARNING'],
                    messages: ['HEALTH MESSAGE'],
                    checks: {},
                },
            },
        };
        const incompatibleTemplate = {
            success: false,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: {
                id: createTemporaryId(),
                name: 'INCOMPATIBLE',
                description: 'INCOMPATIBLE DESCRIPTION',
                templateHealth: {
                    errors: ['HEALTH ERROR'],
                    warnings: ['HEALTH WARNING'],
                    messages: ['HEALTH MESSAGE'],
                    checks: {},
                },
            },
        };

        it('when loading', async () => {
            await renderComponent({
                selectedTemplate: null,
                loading: true,
                templates: null
            });

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toContain('spinner-border spinner-border-sm');
        });

        it('when no template selected', async () => {
            await renderComponent({
                selectedTemplate: null,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const dropdown = context.container.querySelector('.dropdown-menu');
            expect(dropdown).toBeTruthy();
            expect(dropdown.querySelector('.active')).toBeFalsy();
        });

        it('when template selected', async () => {
            await renderComponent({
                selectedTemplate: compatibleTemplate,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const dropdown = context.container.querySelector('.dropdown-menu');
            expect(dropdown).toBeTruthy();
            expect(dropdown.querySelector('.active').textContent).toEqual('COMPATIBLECOMPATIBLE DESCRIPTION');
        });

        it('compatible template errors, warnings and messages', async () => {
            await renderComponent({
                selectedTemplate: compatibleTemplate,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const alert = context.container.querySelector('.alert');
            expect(alert).toBeTruthy();
            expect(alert.className).toContain('alert-success');
            expect(alert.querySelector('h4').textContent).toEqual('✔ Compatible with this season');
            expect(Array.from(alert.querySelectorAll('ol:nth-child(2) li')).map(li => li.textContent)).toEqual(['ERROR']);
            expect(Array.from(alert.querySelectorAll('ol:nth-child(3) li')).map(li => li.textContent)).toEqual(['WARNING']);
            expect(Array.from(alert.querySelectorAll('ol:nth-child(4) li')).map(li => li.textContent)).toEqual(['MESSAGE']);
            expect(alert.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
        });

        it('incompatible template errors, warnings and messages', async () => {
            await renderComponent({
                selectedTemplate: incompatibleTemplate,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const alert = context.container.querySelector('.alert');
            expect(alert).toBeTruthy();
            expect(alert.className).toContain('alert-warning');
            expect(alert.querySelector('h4').textContent).toEqual('🚫 Incompatible with this season');
            expect(Array.from(alert.querySelectorAll('ol:nth-child(2) li')).map(li => li.textContent)).toEqual(['ERROR']);
            expect(Array.from(alert.querySelectorAll('ol:nth-child(3) li')).map(li => li.textContent)).toEqual(['WARNING']);
            expect(Array.from(alert.querySelectorAll('ol:nth-child(4) li')).map(li => li.textContent)).toEqual(['MESSAGE']);
            expect(alert.querySelector('div[datatype="view-health-check"]')).toBeFalsy();
        });

        it('when selected template has no errors, warnings or messages', async () => {
            const quietTemplate = {
                success: true,
                errors: [],
                warnings: [],
                messages: [],
                result: {
                    id: createTemporaryId(),
                    name: 'COMPATIBLE',
                    description: '',
                    templateHealth: {
                        errors: [],
                        warnings: [],
                        messages: [],
                        checks: {},
                    },
                },
            };

            await renderComponent({
                selectedTemplate: quietTemplate,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const alert = context.container.querySelector('.alert');
            expect(alert).toBeTruthy();
            expect(alert.className).toContain('alert-success');
            expect(context.container.querySelectorAll('.alert > ol').length).toEqual(0);
        });
    });

    describe('interactivity', () => {
        const compatibleTemplate = {
            success: true,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: {
                id: createTemporaryId(),
                name: 'COMPATIBLE',
                description: '',
                templateHealth: {
                    errors: ['HEALTH ERROR'],
                    warnings: ['HEALTH WARNING'],
                    messages: ['HEALTH MESSAGE'],
                    checks: {},
                },
            },
        };
        const incompatibleTemplate = {
            success: false,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: {
                id: createTemporaryId(),
                name: 'INCOMPATIBLE',
                description: '',
                templateHealth: {
                    errors: ['HEALTH ERROR'],
                    warnings: ['HEALTH WARNING'],
                    messages: ['HEALTH MESSAGE'],
                    checks: {},
                },
            },
        };

        it('can change template', async () => {
            await renderComponent({
                selectedTemplate: null,
                loading: false,
                templates: {
                    result: [compatibleTemplate, incompatibleTemplate]
                }
            });

            expect(reportedError).toBeNull();
            const dropdown = context.container.querySelector('.dropdown-menu');
            await doSelectOption(dropdown, '🚫 INCOMPATIBLE');

            expect(reportedError).toBeNull();
            expect(selectedTemplate).toEqual(incompatibleTemplate);
        });
    });
});