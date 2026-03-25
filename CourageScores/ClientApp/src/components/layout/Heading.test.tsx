import {
    appProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { Heading } from './Heading';
import { IBuild } from '../common/IBuild';
import { IBrandingContainerProps } from '../common/BrandingContainer';
import { renderDate } from '../../helpers/rendering';

describe('Heading', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        build: IBuild,
        branding: IBrandingContainerProps,
    ) {
        context = await renderApp(
            iocProps(),
            branding,
            appProps({ build }),
            <Heading />,
        );
    }

    describe('renders', () => {
        const emptyBuild: IBuild = {
            branch: '',
            date: '',
            version: '',
        };

        it('branded email', async () => {
            await renderComponent(emptyBuild, {
                email: 'someone@somewhere.com',
                name: 'name',
            });

            const emailLink = context.required('a[href^=mailto]');
            expect(emailLink.element<HTMLAnchorElement>().href).toEqual(
                'mailto:someone@somewhere.com',
            );
            expect(emailLink.text()).toContain('someone@somewhere.com');
        });

        it('branded facebook', async () => {
            await renderComponent(emptyBuild, {
                facebook: 'CourageScores',
                name: 'name',
            });

            const facebookLink = context.required(
                'a[href^="https://www.facebook.com"]',
            );
            expect(facebookLink.element<HTMLAnchorElement>().href).toEqual(
                'https://www.facebook.com/CourageScores',
            );
        });

        it('branded twitter', async () => {
            await renderComponent(emptyBuild, {
                twitter: 'CourageScores',
                name: 'name',
            });

            const twitterLink = context.required(
                'a[href^="https://twitter.com"]',
            );
            expect(twitterLink.element<HTMLAnchorElement>().href).toEqual(
                'https://twitter.com/CourageScores',
            );
        });

        it('branded name', async () => {
            await renderComponent(emptyBuild, {
                name: 'Courage Scores',
            });

            const heading = context.required('h1.heading');
            expect(heading.text()).toEqual('Courage Scores');
        });

        it('when on release branch', async () => {
            await renderComponent(
                {
                    branch: 'release',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08Z',
                },
                { name: '' },
            );

            expect(context.optional('span.bg-warning')).toBeFalsy();
        });

        it('when on other branch', async () => {
            await renderComponent(
                {
                    branch: 'main',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08Z',
                    prName: 'my PR title',
                },
                { name: '' },
            );

            const version = context.required('span.bg-warning');
            expect(version.text()).toEqual(`${renderDate('2023-04-05')}@07:07`);
        });

        it('when clicked', async () => {
            await renderComponent(
                {
                    branch: 'main',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08Z',
                    prName: 'my PR title',
                },
                { name: '' },
            );

            await context.required('span.bg-warning').click();

            context.prompts.alertWasShown(
                'Branch: main\nSHA: 01234567\nPR: my PR title',
            );
        });

        it('when undefined', async () => {
            await renderComponent(undefined!, undefined!);

            expect(context.optional('span.bg-warning')).toBeFalsy();
        });

        it('when no version', async () => {
            await renderComponent(
                {
                    branch: 'main',
                    date: '2023-04-05T06:07:08Z',
                },
                { name: '' },
            );

            expect(context.optional('span.bg-warning')).toBeFalsy();
        });

        it('when no branch', async () => {
            await renderComponent(
                {
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08Z',
                },
                { name: '' },
            );

            expect(context.optional('span.bg-warning')).toBeFalsy();
        });
    });
});
