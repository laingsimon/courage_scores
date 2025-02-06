import {
    appProps,
    brandingProps,
    cleanUp, doClick, findButton,
    iocProps, noop,
    renderApp, TestContext
} from "../../helpers/tests";
import {IToggleFavouriteTeamProps, ToggleFavouriteTeam} from "./ToggleFavouriteTeam";
import {IPreferenceData} from "./PreferencesContainer";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../league/DivisionDataContainer";

describe('ToggleFavouriteTeam', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
    });

    async function renderComponent(props: IToggleFavouriteTeamProps, favouritesEnabled: boolean, initialPreferences?: IPreferenceData) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<DivisionDataContainer onReloadDivision={noop}
                                    setDivisionData={noop}
                                    name="DIVISION"
                                    favouritesEnabled={favouritesEnabled}>
                <ToggleFavouriteTeam {...props} />
            </DivisionDataContainer>),
            undefined,
            undefined,
            undefined,
            initialPreferences);
    }

    describe('renders', () => {
        it('when team is a favourite', async () => {
            const teamId: string = createTemporaryId();

            await renderComponent({ teamId }, true, { favouriteTeamIds: [ teamId ]});

            expect(context.container.querySelector('button')!.className).not.toContain('opacity-25');
        });

        it('when team is not a favourite', async () => {
            const teamId: string = createTemporaryId();

            await renderComponent({ teamId }, true, { favouriteTeamIds: [ ]});

            expect(context.container.querySelector('button')!.className).toContain('opacity-25');
        });

        it('nothing when favourites not enabled', async () => {
            const teamId: string = createTemporaryId();

            await renderComponent({ teamId }, false);

            expect(context.container.querySelector('button')).toBeNull();
        });
    });

    describe('interactivity', () => {
        it('can add a team to being a favourite', async () => {
            const teamId: string = createTemporaryId();
            const otherTeamId: string = createTemporaryId();
            await renderComponent({ teamId }, true, { favouriteTeamIds: [ otherTeamId ]});

            await doClick(findButton(context.container, '⭐'));

            expect(context.cookies!.get('preferences')).toEqual({
                favouriteTeamIds: [ otherTeamId, teamId ],
            });
        });

        it('can remove a team from being a favourite', async () => {
            const teamId: string = createTemporaryId();
            const otherTeamId: string = createTemporaryId();
            await renderComponent({ teamId }, true, { favouriteTeamIds: [ otherTeamId, teamId ]});

            await doClick(findButton(context.container, '⭐'));

            expect(context.cookies!.get('preferences')).toEqual({
                favouriteTeamIds: [ otherTeamId ],
            });
        });
    });
});