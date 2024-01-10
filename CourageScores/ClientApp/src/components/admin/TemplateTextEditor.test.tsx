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

        it('does not transform single line excel whitespace input', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({ template });
            const input = '   ';

            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', input, context.user);

            const textareaOutput = context.container.querySelector('textarea[placeholder="Copy into template"]');
            expect(textareaOutput.value).toEqual('');
        });

        it('transforms single line excel fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({ template });
            const input = 'A\tB\t\tC\t\D';

            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', input, context.user);

            const textareaOutput = context.container.querySelector('textarea[placeholder="Copy into template"]');
            expect(JSON.parse(textareaOutput.value)).toEqual({
                fixtures: [
                    {home: 'A', away: 'B'},
                    {home: 'C', away: 'D'}
                ]
            });
        });

        it('transforms multi line excel fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({ template });
            const input = 'A\tB\t\tC\t\D\n' +
                'E\tF\t\tG\tH\n\n';

            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', input, context.user);

            const textareaOutput = context.container.querySelector('textarea[placeholder="Copy into template"]');
            expect(JSON.parse('[' + textareaOutput.value + ']')).toEqual([{
                fixtures: [
                    {home: 'A', away: 'B'},
                    {home: 'C', away: 'D'}
                ]
            }, {
                fixtures: [
                    {home: 'E', away: 'F'},
                    {home: 'G', away: 'H'}
                ]
            }]);
        });

        it('transforms single line excel bye fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({ template });
            const input = 'A\t-\t\tC\t\D';

            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', input, context.user);

            const textareaOutput = context.container.querySelector('textarea[placeholder="Copy into template"]');
            expect(JSON.parse(textareaOutput.value)).toEqual({
                fixtures: [
                    {home: 'A'},
                    {home: 'C', away: 'D'}
                ]
            });
        });

        it('clears transformed output when input is cleared', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({ template });
            const input = 'A\t-\t\tC\t\D';

            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', input, context.user);
            await doChange(context.container, 'textarea[placeholder="Copy from excel"]', '', context.user);

            const textareaOutput = context.container.querySelector('textarea[placeholder="Copy into template"]');
            expect(textareaOutput.value).toEqual('');
        });
    });
});