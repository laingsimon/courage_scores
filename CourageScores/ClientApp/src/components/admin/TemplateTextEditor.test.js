// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, renderApp, doChange} from "../../helpers/tests";
import {TemplateTextEditor} from "./TemplateTextEditor";
import {createTemporaryId} from "../../helpers/projection";

describe('TemplateTextEditor', () => {
    let context;
    let reportedError;
    let update;
    let valid;

    afterEach(() => {
        cleanUp(context);
    });

    function onUpdate(value) {
        update = value;
    }
    function setValid(value) {
        valid = value;
    }

    async function renderComponent(props) {
        reportedError = null;
        update = null;
        valid = null;
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
            (<AdminContainer>
                <TemplateTextEditor {...props} onUpdate={onUpdate} setValid={setValid} />
            </AdminContainer>));
    }

    describe('interactivity', () => {
        it('renders empty template', async () => {
            await renderComponent({
                template: {},
            });

            const textarea = context.container.querySelector('textarea');
            expect(textarea.value).toEqual('{}');
        });

        it('marks template as invalid when invalid json', async () => {
            await renderComponent({
                template: {},
            });

            await doChange(context.container, 'textarea', 'foo', context.user);

            expect(valid).toEqual(false);
            expect(update).toBeNull();
        });

        it('marks template as valid when json is valid again', async () => {
            await renderComponent({
                template: {},
            });

            await doChange(context.container, 'textarea', 'foo', context.user);
            await doChange(context.container, 'textarea', '{}', context.user);

            expect(valid).toEqual(true);
        });

        it('updates template when valid', async () => {
            await renderComponent({
                template: {},
            });

            await doChange(context.container, 'textarea', 'foo', context.user);
            await doChange(context.container, 'textarea', '{"a": "b"}', context.user);

            expect(valid).toEqual(true);
            expect(update).toEqual({ a: 'b' });
        });

        it('excludes non-editable properties', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
                someProperty: 'something',
                updated: '2023-01-02',
                created: '2023-01-01',
                author: 'Simon',
                editor: 'Simon',
                deleted: null,
                remover: null,
                templateHealth: {
                    checks: {},
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                },
                sharedAddresses: [],
                divisions: [],
            };

            await renderComponent({
                template,
            });

            const editableTemplate = {
                someProperty: 'something',
                sharedAddresses: [],
                divisions: [],
            };
            const textarea = context.container.querySelector('textarea');
            expect(textarea.value).toEqual(JSON.stringify(editableTemplate, null, '  '));
        });
    });
});