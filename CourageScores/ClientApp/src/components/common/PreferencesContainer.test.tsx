import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {PreferencesContainer, usePreferences} from "./PreferencesContainer";
import {IPreferences} from "./IPreferences";
import {Cookies} from "react-cookie";
import {act} from "@testing-library/react";

describe('PreferencesContainer', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(preferenceStore: IPreferences) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<PreferencesContainer insecure={true}>
                <PreferencesContainerAccessor exposeVia={preferenceStore} />
            </PreferencesContainer>));

        // don't allow onError to be called - would call infinite-loop/recursion
        reportedError.verifyNoError();
    }

    describe('interactivity', () => {
        it('can get preference when no cookie defined', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.remove('preferences');

            const result = accessor.getPreference('anything');

            expect(result).toBeFalsy();
        });

        it('can get preference when cookie is empty', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.set('preferences', { });

            const result = accessor.getPreference('anything');

            expect(result).toBeFalsy();
        });

        it('can get preference when cookie populated', async () => {
            const cookies = new Cookies();
            cookies.set('preferences', { anything: 'else' });
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);

            const result = accessor.getPreference('anything');

            expect(result).toEqual('else');
        });

        it('can create cookie with preference', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.remove('preferences');

            await act(async () => {
                accessor.upsertPreference('anything', 'else');
            });

            const cookie = context.cookies.get('preferences');
            expect(cookie).toEqual({ anything: 'else' });
        });

        it('can replace preference in cookie', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.set('preferences', { anything: 'else' });

            await act(async () => {
                accessor.upsertPreference('anything', 'ELSE');
            });

            const cookie = context.cookies.get('preferences');
            expect(cookie).toEqual({ anything: 'ELSE' });
        });

        it('can remove preference from cookie', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.set('preferences', { anything: 'else' });

            await act(async () => {
                accessor.upsertPreference('anything', null);
            });

            const cookie = context.cookies.get('preferences');
            expect(cookie).toEqual({ });
        });

        it('can replace preference with different type of object', async () => {
            const accessor: IPreferences = {
                getPreference: null,
                upsertPreference: null,
            };
            await renderComponent(accessor);
            context.cookies.set('preferences', { anything: 'else' });

            await act(async () => {
                accessor.upsertPreference('anything', [ 1, 2, 3 ]);
            });

            const cookie = context.cookies.get('preferences');
            expect(cookie).toEqual({ anything: [ 1, 2, 3 ] });
        });
    });

    function PreferencesContainerAccessor({ exposeVia }) {
        const { getPreference, upsertPreference } = usePreferences();

        exposeVia.getPreference = getPreference;
        exposeVia.upsertPreference = upsertPreference;

        return (<div>Rendered</div>);
    }
});
