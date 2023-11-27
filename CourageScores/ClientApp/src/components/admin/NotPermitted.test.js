// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp} from "../../helpers/tests";
import {NotPermitted} from "./NotPermitted";

describe('NotPermitted', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                ...props
            },
            (<NotPermitted />),
            '/admin/:mode',
            '/admin/not_permitted');
    }

    describe('when logged out', () => {
        it('renders login button', async () => {
            await renderComponent({
                account: null,
            });

            const loginLink = context.container.querySelector('a.btn');
            expect(loginLink).toBeTruthy();
            expect(loginLink.textContent).toEqual('Login');
            expect(loginLink.href).toEqual('https://localhost:7247/api/Account/Login/?redirectUrl=http://localhost/admin/not_permitted');
        });
    });

    describe('when logged in', () => {
        it('renders home button', async () => {
            await renderComponent({
                account: {},
            });

            const loginLink = context.container.querySelector('a.btn');
            expect(loginLink).toBeTruthy();
            expect(loginLink.textContent).toEqual('Home');
            expect(loginLink.href).toEqual('http://localhost/');
        });
    });
});