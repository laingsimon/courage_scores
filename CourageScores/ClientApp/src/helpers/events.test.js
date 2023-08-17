// noinspection JSUnresolvedReference

import {handleChange, propChanged} from './events';

describe('events', () => {
    describe('propChanged', () => {
        it('updates single property when named', () => {
            let newValue;

            const func = propChanged({name: 'Simon', age: 40}, v => newValue = v, 'name');
            func('Laing');

            expect(newValue).toEqual({name: 'Laing', age: 40});
        });

        it('allows property to be provided at update time', () => {
            let newValue;

            const func = propChanged({name: 'Simon', age: 40}, v => newValue = v);
            func('name', 'Laing');

            expect(newValue).toEqual({name: 'Laing', age: 40});
        });
    });

    describe('handleChange', () => {
        it('should return canceling event-handler if no callback provided', async () => {
            const eventHandler = handleChange(null);
            const event = {
                target: {
                    name: 'foo',
                    value: 'bar',
                    type: 'input',
                },
            };

            const result = await eventHandler(event);

            expect(result).toEqual(false);
        });

        it('should return event-handler that supports checkboxes', async () => {
            let handled = null;
            const eventHandler = handleChange((name, value) => {
                handled = {name, value};
            });
            const event = {
                target: {
                    name: 'foo',
                    checked: true,
                    type: 'checkbox',
                },
            };

            await eventHandler(event);

            expect(handled.name).toEqual('foo');
            expect(handled.value).toEqual(true);
        });

        it('should return event-handler that supports inputs', async () => {
            let handled = null;
            const eventHandler = handleChange((name, value) => {
                handled = {name, value};
            });
            const event = {
                target: {
                    name: 'foo',
                    value: 'bar',
                    type: 'input',
                },
            };

            await eventHandler(event);

            expect(handled.name).toEqual('foo');
            expect(handled.value).toEqual('bar');
        });
    });
});