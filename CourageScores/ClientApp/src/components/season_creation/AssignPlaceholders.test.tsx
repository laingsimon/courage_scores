import {
    appProps,
    brandingProps,
    cleanUp,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    AssignPlaceholders,
    IAssignPlaceholdersProps,
    IPlaceholderMappings,
} from './AssignPlaceholders';
import { IAppContainerProps } from '../common/AppContainer';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { teamBuilder } from '../../helpers/builders/teams';
import { createTemporaryId } from '../../helpers/projection';

describe('AssignPlaceholders', () => {
    let context: TestContext;
    let placeholderMappings: IPlaceholderMappings | null;

    async function setPlaceholderMappings(value: IPlaceholderMappings) {
        placeholderMappings = value;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        placeholderMappings = null;
    });

    async function renderComponent(
        appContainerProps: IAppContainerProps,
        props: IAssignPlaceholdersProps,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appContainerProps,
            <AssignPlaceholders {...props} />,
        );
    }

    describe('renders', () => {
        const division1: DivisionDto = divisionBuilder('DIVISION 1').build();
        const division2: DivisionDto = divisionBuilder('DIVISION 2').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division2)
            .withDivision(division1)
            .build();
        const teamA: TeamDto = teamBuilder('TEAM A')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamAA: TeamDto = teamBuilder('TEAM AA')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamB: TeamDto = teamBuilder('TEAM B')
            .address('ADDRESS B')
            .forSeason(season, division2, [])
            .build();
        const teamC: TeamDto = teamBuilder('TEAM C')
            .address('ADDRESS C')
            .forSeason(season, division1, [])
            .build();
        const template: TemplateDto = {
            id: createTemporaryId(),
            name: 'TEMPLATE 1',
            sharedAddresses: [],
            divisions: [
                {
                    sharedAddresses: [],
                    dates: [
                        {
                            fixtures: [{ home: 'C', away: 'B' }, { home: 'A' }],
                        },
                    ],
                },
                {
                    sharedAddresses: [],
                    dates: [
                        {
                            fixtures: [{ home: 'D' }],
                        },
                    ],
                },
            ],
        };

        it('divisions in order', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamB],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            expect(context.all('h6').map((d) => d.text())).toEqual([
                'DIVISION 1',
                'DIVISION 2',
            ]);
        });

        it('placeholders appropriate to each division in order', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamB],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div2 = context.required('div > div > div:nth-child(2)');
            expect(div1.all('ul > li > span').map((li) => li.text())).toEqual([
                'A',
                'B',
                'C',
            ]);
            expect(div2.all('ul > li > span').map((li) => li.text())).toEqual([
                'D',
            ]);
        });

        it('template shared address placeholders', async () => {
            const templateWithSharedAddresses: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE 2',
                sharedAddresses: [['A', 'D']],
                divisions: [
                    {
                        sharedAddresses: [],
                        dates: [
                            {
                                fixtures: [
                                    { home: 'C', away: 'B' },
                                    { home: 'A' },
                                ],
                            },
                        ],
                    },
                    {
                        sharedAddresses: [],
                        dates: [
                            {
                                fixtures: [{ home: 'D' }],
                            },
                        ],
                    },
                ],
            };
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamB],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];
            expect(placeholderA.text()).toContain(
                'Reserved for use by team with shared address across divisions',
            );
            expect(placeholderA.required('span').className()).toContain(
                'bg-warning',
            );
        });

        it('division shared address placeholders', async () => {
            const templateWithSharedAddresses: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE 3',
                sharedAddresses: [],
                divisions: [
                    {
                        sharedAddresses: [['B', 'C']],
                        dates: [
                            {
                                fixtures: [
                                    { home: 'C', away: 'B' },
                                    { home: 'A' },
                                ],
                            },
                        ],
                    },
                    {
                        sharedAddresses: [],
                        dates: [
                            {
                                fixtures: [{ home: 'D' }],
                            },
                        ],
                    },
                ],
            };
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamB, teamAA, teamC],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderB = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'B',
            )[0];
            expect(placeholderB.required('span').className()).toContain(
                'bg-secondary text-light',
            );
            expect(
                placeholderB.all('.dropdown-item').map((i) => i.text()),
            ).toEqual([
                '⚙ Automatically assign',
                'TEAM A',
                'TEAM AA',
                'TEAM C (has unique address)',
            ]);
        });

        it('teams appropriate to each division in order', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamC, teamA, teamB],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];
            expect(
                placeholderA
                    .all('.dropdown-menu .dropdown-item')
                    .map((li) => li.text()),
            ).toEqual(['🎲 Randomly assign', 'TEAM A', 'TEAM C']);
        });

        it('teams with shared addresses in dropdown', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamAA],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];
            expect(
                placeholderA
                    .all('.dropdown-menu .dropdown-item')
                    .map((li) => li.text()),
            ).toEqual([
                '🎲 Randomly assign',
                '🚫 TEAM A (has shared address)',
                '🚫 TEAM AA (has shared address)',
            ]);
        });

        it('teams with deleted seasons are excluded from dropdown', async () => {
            const deletedTeamD: TeamDto = teamBuilder('TEAM D')
                .address('ADDRESS D')
                .forSeason(season, division1, [], true)
                .build();
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [deletedTeamD],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];
            expect(
                placeholderA
                    .all('.dropdown-menu .dropdown-item')
                    .map((li) => li.text()),
            ).not.toContain('TEAM D');
        });
    });

    describe('interactivity', () => {
        const division1: DivisionDto = divisionBuilder('DIVISION 1').build();
        const division2: DivisionDto = divisionBuilder('DIVISION 2').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division2)
            .withDivision(division1)
            .build();
        const teamA: TeamDto = teamBuilder('TEAM A')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamAA: TeamDto = teamBuilder('TEAM AA')
            .address('ADDRESS A')
            .forSeason(season, division1, [])
            .build();
        const teamC: TeamDto = teamBuilder('TEAM C')
            .address('ADDRESS C')
            .forSeason(season, division1, [])
            .build();
        const template: TemplateDto = {
            id: createTemporaryId(),
            name: 'TEMPLATE 3',
            sharedAddresses: [],
            divisions: [
                {
                    sharedAddresses: [],
                    dates: [
                        {
                            fixtures: [{ home: 'C', away: 'B' }, { home: 'A' }],
                        },
                    ],
                },
                {
                    sharedAddresses: [],
                    dates: [
                        {
                            fixtures: [{ home: 'D' }],
                        },
                    ],
                },
            ],
        };

        it('can assign team for placeholder', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamC],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];

            await placeholderA.required('.dropdown-menu').select('TEAM A');

            expect(placeholderMappings).toEqual({
                A: teamA.id,
            });
        });

        it('can unassign team for placeholder', async () => {
            await renderComponent(
                appProps({
                    divisions: [division2, division1],
                    seasons: [season],
                    teams: [teamA, teamC],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: template },
                    placeholderMappings: {
                        A: teamA.id,
                    },
                    setPlaceholderMappings,
                },
            );

            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderA = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'A',
            )[0];

            await placeholderA
                .required('.dropdown-menu')
                .select('🎲 Randomly assign');

            expect(placeholderMappings).toEqual({});
        });

        it('can assign two teams to shared address placeholder', async () => {
            const templateWithSharedAddresses: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE 3',
                sharedAddresses: [],
                divisions: [
                    {
                        sharedAddresses: [['B', 'C']],
                        dates: [
                            {
                                fixtures: [
                                    { home: 'C', away: 'B' },
                                    { home: 'A' },
                                ],
                            },
                        ],
                    },
                    {
                        sharedAddresses: [],
                        dates: [
                            {
                                fixtures: [{ home: 'D' }],
                            },
                        ],
                    },
                ],
            };
            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                    seasons: [season],
                    teams: [teamA, teamAA],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {},
                    setPlaceholderMappings,
                },
            );
            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderB = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'B',
            )[0];

            await placeholderB.required('.dropdown-menu').select('TEAM AA');

            expect(placeholderMappings).toEqual({
                B: teamAA.id,
                C: teamA.id,
            });
        });

        it('can unassign two teams to shared address placeholder', async () => {
            const templateWithSharedAddresses: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE 3',
                sharedAddresses: [],
                divisions: [
                    {
                        sharedAddresses: [['B', 'C']],
                        dates: [
                            {
                                fixtures: [
                                    { home: 'C', away: 'B' },
                                    { home: 'A' },
                                ],
                            },
                        ],
                    },
                    {
                        sharedAddresses: [],
                        dates: [
                            {
                                fixtures: [{ home: 'D' }],
                            },
                        ],
                    },
                ],
            };
            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                    seasons: [season],
                    teams: [teamA, teamAA],
                }),
                {
                    seasonId: season.id,
                    selectedTemplate: { result: templateWithSharedAddresses },
                    placeholderMappings: {
                        B: teamAA.id,
                        C: teamA.id,
                    },
                    setPlaceholderMappings,
                },
            );
            const div1 = context.required('div > div > div:nth-child(1)');
            const div1Placeholders = div1.all('ul > li');
            const placeholderB = div1Placeholders.filter(
                (p: IComponent) => p.required('span').text() === 'B',
            )[0];

            await placeholderB
                .required('.dropdown-menu')
                .select('⚙ Automatically assign');

            expect(placeholderMappings).toEqual({});
        });
    });
});
