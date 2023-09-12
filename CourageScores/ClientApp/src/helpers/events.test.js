// noinspection JSUnresolvedReference

import {handleChange, propChanged, valueChanged} from './events';

describe('events', () => {
    describe('valueChanged', () => {
         it('should set data to true if checkbox checked', async () => {
            let newObj;
            const handler = valueChanged({
                enabled: false,
            }, val => newObj = val);

            await handler({
                target: {
                    type: 'checkbox',
                    name: 'enabled',
                    checked: true,
                    value: null,
                }
            });

            expect(newObj.enabled).toEqual(true);
         });

        it('should set data to false if checkbox unchecked', async () => {
            let newObj;
            const handler = valueChanged({
                enabled: true,
            }, val => newObj = val);

            await handler({
                target: {
                    type: 'checkbox',
                    name: 'enabled',
                    checked: false,
                    value: null,
                }
            });

            expect(newObj.enabled).toEqual(false);
        });

        it('should set data to number if number input changed', async () => {
            let newObj;
            const handler = valueChanged({
                age: 10,
            }, val => newObj = val);

            await handler({
                target: {
                    type: 'number',
                    name: 'age',
                    value: '20',
                }
            });

            expect(newObj.age).toEqual(20);
        });

        it('should set data to null if number input changed to nullIf', async () => {
            let newObj;
            const handler = valueChanged({
                age: 10,
            }, val => newObj = val, '');

            await handler({
                target: {
                    type: 'number',
                    name: 'age',
                    value: '',
                }
            });

            expect(newObj.age).toBeNull();
        });

        it('should set data to string if input changed', async () => {
            let newObj;
            const handler = valueChanged({
                name: 'NAME',
            }, val => newObj = val);

            await handler({
                target: {
                    type: 'text',
                    name: 'name',
                    value: 'NEW',
                }
            });

            expect(newObj.name).toEqual('NEW');
        });

        it('should set data to null if input changed to nullIf', async () => {
            let newObj;
            const handler = valueChanged({
                name: 'NAME',
            }, val => newObj = val, '');

            await handler({
                target: {
                    type: 'text',
                    name: 'name',
                    value: '',
                }
            });

            expect(newObj.name).toBeNull();
        });
    });

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