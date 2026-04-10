import {
    api,
    appProps as appPropsFunc,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { repeat, createTemporaryId } from '../../helpers/projection';
import {
    CreateSeasonDialog,
    ICreateSeasonDialogProps,
} from './CreateSeasonDialog';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ActionResultDto } from '../../interfaces/models/dtos/ActionResultDto';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { ProposalResultDto } from '../../interfaces/models/dtos/Season/Creation/ProposalResultDto';
import { ProposalRequestDto } from '../../interfaces/models/dtos/Season/Creation/ProposalRequestDto';
import { EditGameDto } from '../../interfaces/models/dtos/Game/EditGameDto';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { IAppContainerProps } from '../common/AppContainer';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { DivisionTemplateDto } from '../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { teamBuilder } from '../../helpers/builders/teams';
import {
    divisionBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { ISeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi';
import { IGameApi } from '../../interfaces/apis/IGameApi';

describe('CreateSeasonDialog', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let closed: boolean;
    let compatibilityResponses: {
        [seasonId: string]: IClientActionResultDto<
            ActionResultDto<TemplateDto>[]
        >;
    };
    let allDataReloaded: boolean;
    let apiResponse: IClientActionResultDto<ProposalResultDto> | null;
    let proposalRequest: ProposalRequestDto | null;
    let updatedFixtures: EditGameDto[];
    let updateFixtureApiResponse:
        | ((fixture: EditGameDto) => Promise<IClientActionResultDto<GameDto>>)
        | null;
    let divisionReloaded: boolean;

    const templateApi = api<ISeasonTemplateApi>({
        async getCompatibility(seasonId: string) {
            return compatibilityResponses[seasonId] || { success: false };
        },
        async propose(request: ProposalRequestDto) {
            proposalRequest = request;
            return (
                apiResponse || {
                    success: false,
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            );
        },
    });
    const gameApi = api<IGameApi>({
        async update(fixture: EditGameDto) {
            updatedFixtures.push(fixture);
            return updateFixtureApiResponse
                ? await updateFixtureApiResponse(fixture)
                : { success: true };
        },
    });

    async function reloadAll() {
        allDataReloaded = true;
    }

    async function onReloadDivision(_?: boolean) {
        divisionReloaded = true;
        return null;
    }

    async function onClose() {
        closed = true;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedFixtures = [];
        divisionReloaded = false;
        updateFixtureApiResponse = null;
        proposalRequest = null;
        apiResponse = null;
        allDataReloaded = false;
        reportedError = new ErrorState();
        compatibilityResponses = {};
        closed = false;
    });

    function appProps(props: Partial<IAppContainerProps>, re?: ErrorState) {
        return appPropsFunc(
            {
                ...props,
                reloadAll,
            },
            re ?? reportedError,
        );
    }

    async function renderComponent(
        appContainerProps: IAppContainerProps,
        divisionDataProps: Partial<IDivisionDataContainerProps> | null,
        props: Partial<ICreateSeasonDialogProps>,
    ) {
        const ddProps: IDivisionDataContainerProps = {
            name: '',
            onReloadDivision,
            setDivisionData: noop,
            ...divisionDataProps,
        };
        context = await renderApp(
            iocProps({ templateApi, gameApi }),
            brandingProps(),
            appContainerProps,
            <DivisionDataContainer {...ddProps}>
                <CreateSeasonDialog
                    {...{
                        seasonId: '',
                        onClose,
                        ...props,
                    }}
                />
            </DivisionDataContainer>,
        );
    }

    function addCompatibleResponse(seasonId: string, templateId: string) {
        const response = getCompatibleResponse(seasonId, templateId);
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function addIncompatibleResponse(seasonId: string, templateId: string) {
        const response = getCompatibleResponse(seasonId, templateId);
        response.result![0].success = false;
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function getCompatibleResponse(_: string, templateId: string) {
        const template: TemplateDto = Object.assign(
            getEmptyTemplate(templateId, 2),
            {
                name: 'TEMPLATE',
                templateHealth: {
                    checks: {},
                    errors: [],
                    warnings: [],
                    messages: [],
                },
            },
        );

        return {
            success: true,
            result: [
                {
                    success: true,
                    result: template,
                    errors: [],
                    warnings: [],
                    messages: [],
                },
            ],
        };
    }

    function setApiResponse(success: boolean, resultProps?: object) {
        apiResponse = {
            success: success,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: Object.assign(
                {
                    proposalHealth: {
                        checks: {},
                        errors: [],
                        warnings: [],
                        messages: [],
                    },
                },
                resultProps,
            ),
        };
    }

    function getEmptyTemplate(
        templateId: string,
        noOfDivisions: number,
    ): TemplateDto {
        return {
            name: 'EMPTY',
            id: templateId,
            sharedAddresses: [],
            divisions: repeat(noOfDivisions, () => {
                return {
                    sharedAddresses: [],
                    dates: [],
                };
            }),
        };
    }

    function getSeason(
        seasonId?: string,
        divisionId?: string,
        anotherDivisionId?: string,
    ) {
        let builder = seasonBuilder('SEASON', seasonId);

        if (divisionId) {
            builder = builder.withDivision(divisionId);
        }

        if (anotherDivisionId) {
            builder = builder.withDivision(anotherDivisionId);
        }

        return builder.build();
    }

    function team(name: string): TeamDto {
        return teamBuilder(name).build();
    }

    describe('renders', () => {
        // 2-assign placeholders tests are in AssignPlaceholder.test.js
        // 3-review tests are in ReviewProposalHealth.test.js
        // 4-review proposals tests are in ReviewProposalsFloatingDialog.test.js

        describe('5- confirm save', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const anotherDivisionId = createTemporaryId();
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();

            it('prompt before starting save', async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [
                            divisionBuilder('DIVISION 1', divisionId).build(),
                            divisionBuilder(
                                'ANOTHER DIVISION',
                                anotherDivisionId,
                            ).build(),
                        ],
                        seasons: [
                            getSeason(seasonId, divisionId, anotherDivisionId),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        id: divisionId,
                    },
                    {
                        seasonId: seasonId,
                    },
                );
                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('home'),
                                                    team('away'),
                                                ),
                                        '1.1',
                                    )
                                    .withFixture(
                                        (f) =>
                                            f.playing(
                                                team('home'),
                                                team('away'),
                                            ),
                                        '1.2',
                                    ) // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('home'),
                                                    team('away'),
                                                ),
                                        '2.1',
                                    )
                                    .withFixture((f) =>
                                        f
                                            .proposal()
                                            .bye(
                                                teamBuilder('anywhere').build(),
                                            ),
                                    ) // excluded as awayTeam == undefined
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('home'),
                                                    team('away'),
                                                ),
                                        '2.3',
                                    )
                                    .build(),
                            ],
                        },
                    ],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });
                await context.button('Next').click(); // (1) pick -> (2) assign placeholders
                await context.button('Next').click(); // (2) assign placeholders -> (3) review
                await context.button('Next').click(); // (3) review -> (4) review-proposals
                reportedError.verifyNoError();

                await context
                    .required('div')
                    .button('Save all fixtures')
                    .click(); // (4) review-proposals -> (5) confirm-save

                expect(context.optional('div.modal')).toBeTruthy();
                expect(context.optional('div.position-fixed')).toBeFalsy();
                expect(context.text()).toContain(
                    'Press Next to save all 3 fixtures across 2 divisions',
                );
            });
        });
    });

    describe('interactivity', () => {
        describe('1- pick', () => {
            const seasonId = createTemporaryId();
            const division = divisionBuilder('DIVISION 1').build();
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, createTemporaryId())
                .build();

            it('prevents proposal of fixtures for incompatible template', async () => {
                addIncompatibleResponse(seasonId, createTemporaryId());
                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [getSeason(seasonId)],
                        teams: [team1, team2],
                    }),
                    null,
                    {
                        seasonId: seasonId,
                    },
                );
                await context.required('.dropdown-menu').select('🚫 TEMPLATE');
                reportedError.verifyNoError();

                await context.button('Next').click();

                reportedError.verifyNoError();
                context.prompts.alertWasShown(
                    'This template is not compatible with this season, pick another template',
                );
                expect(proposalRequest).toBeNull();
            });

            it('cannot navigate back', async () => {
                const templateId = createTemporaryId();
                setApiResponse(true, { id: templateId });

                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [],
                    }),
                    null,
                    {
                        seasonId: createTemporaryId(),
                    },
                );

                expect(context.button('Back').enabled()).toEqual(false);
            });

            it('moves to (2) assign-placeholders', async () => {
                const templateId = createTemporaryId();
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [division],
                        seasons: [getSeason(seasonId, division.id)],
                        teams: [team1, team2],
                    }),
                    null,
                    {
                        seasonId: seasonId,
                    },
                );
                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true);

                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(context.all('h6 + ul').length).toEqual(1);
            });
        });

        describe('2- assign placeholders', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const division: DivisionDto = divisionBuilder('DIVISION 1').build();
            const anotherDivision: DivisionDto =
                divisionBuilder('ANOTHER DIVISION').build();
            const team1: TeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .address('TEAM 1')
                .build();
            const team2: TeamDto = teamBuilder('TEAM 2')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team3: TeamDto = teamBuilder('TEAM 3')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team4: TeamDto = teamBuilder('TEAM 4')
                .address('TEAM 4')
                .forSeason(seasonId, division)
                .build();

            beforeEach(async () => {
                const response: IClientActionResultDto<
                    ActionResultDto<TemplateDto>[]
                > = addCompatibleResponse(seasonId, templateId);
                const template: TemplateDto = response.result![0].result!;
                const anotherDivisionTemplate: DivisionTemplateDto =
                    template.divisions![0];
                const division1Template: DivisionTemplateDto =
                    template.divisions![1];
                template.sharedAddresses = [['A', 'B']];
                anotherDivisionTemplate.sharedAddresses = [['A', 'C']];
                anotherDivisionTemplate.dates = [
                    { fixtures: [{ home: 'A', away: 'C' }, { home: 'D' }] },
                ];
                division1Template.sharedAddresses = [['E', 'F']];
                division1Template.dates = [
                    {
                        fixtures: [
                            { home: 'B', away: 'F' },
                            { home: 'G', away: 'H' },
                        ],
                    },
                ];

                await renderComponent(
                    appProps({
                        divisions: [division, anotherDivision],
                        seasons: [
                            getSeason(
                                seasonId,
                                division.id,
                                anotherDivision.id,
                            ),
                        ],
                        teams: [team1, team2, team3, team4],
                    }),
                    null,
                    {
                        seasonId: seasonId,
                    },
                );

                await context.required('.dropdown-menu').select('TEMPLATE');

                await context.button('Next').click();
            });

            it('can navigate forwards to (3) review', async () => {
                await context.button('Next').click();

                expect(proposalRequest).toEqual({
                    seasonId: seasonId,
                    templateId: templateId,
                    placeholderMappings: {},
                });
            });

            it('can navigate backwards to (1) pick', async () => {
                await context.button('Back').click();

                const templateSelection = context.required('.dropdown-menu');
                expect(
                    templateSelection
                        .all('.dropdown-item')
                        .map((li) => li.text()),
                ).toEqual(['TEMPLATE']);
            });
        });

        describe('3- review', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const team1: TeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: TeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, divisionId)
                .build();
            let divisionDataSetTo: DivisionDataDto | undefined;

            beforeEach(async () => {
                divisionDataSetTo = undefined;

                addCompatibleResponse(seasonId, templateId);

                await renderComponent(
                    appProps({
                        divisions: [
                            divisionBuilder('DIVISION', divisionId).build(),
                        ],
                        seasons: [getSeason(seasonId, divisionId)],
                        teams: [team1, team2],
                    }),
                    {
                        id: divisionId,
                        setDivisionData: async (d?: DivisionDataDto) => {
                            divisionDataSetTo = d;
                        },
                    },
                    {
                        seasonId: seasonId,
                    },
                );
                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();

                setApiResponse(true, {
                    divisions: [
                        {
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            sharedAddresses: [],
                        },
                    ],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 1),
                });

                await context.button('Next').click();
                await context.button('Next').click();
            });

            it('can navigate back to (2) assign placeholders', async () => {
                await context.button('Back').click();

                reportedError.verifyNoError();
            });

            it('can navigate to (4) review-proposals', async () => {
                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(divisionDataSetTo).toEqual({
                    id: divisionId,
                    name: 'PROPOSED DIVISION',
                    sharedAddresses: [],
                });
                expect(context.required('div').className()).toContain(
                    'position-fixed',
                );
            });
        });

        describe('4- review proposals', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const anotherDivisionId = createTemporaryId();
            const team1: TeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: TeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();

            beforeEach(async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [
                            divisionBuilder('DIVISION 1', divisionId).build(),
                            divisionBuilder(
                                'ANOTHER DIVISION',
                                anotherDivisionId,
                            ).build(),
                        ],
                        seasons: [
                            getSeason(seasonId, divisionId, anotherDivisionId),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        id: divisionId,
                    },
                    {
                        seasonId: seasonId,
                    },
                );

                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 1.1 '),
                                                    team('AWAY 1.1'),
                                                ),
                                        '1.1',
                                    )
                                    .withFixture(
                                        (f) =>
                                            f.playing(
                                                team('home'),
                                                team('away'),
                                            ),
                                        '1.2',
                                    ) // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 2.1 '),
                                                    team('AWAY 2.1'),
                                                ),
                                        '2.1',
                                    )
                                    .withFixture((f) => f.proposal()) // excluded as awayTeam == undefined
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 2.3 '),
                                                    team('AWAY 2.3'),
                                                ),
                                        '2.3',
                                    )
                                    .build(),
                            ],
                        },
                    ],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await context.button('Next').click();
                await context.button('Next').click();
                await context.button('Next').click();
                reportedError.verifyNoError();
            });

            it('can navigate back to (3) review', async () => {
                await context.button('Back').click();

                expect(context.optional('div.modal')).toBeTruthy();
                expect(context.optional('div.position-fixed')).toBeFalsy();
                expect(context.text()).toContain(
                    'Press Next to review the fixtures in the divisions before saving',
                );
            });

            it('can navigate forward to (5) confirm-save', async () => {
                await context.button('Save all fixtures').click();

                expect(context.optional('div.modal')).toBeTruthy();
                expect(context.optional('div.position-fixed')).toBeFalsy();
                expect(context.text()).toContain('Press Next to save all');
            });
        });

        describe('5- confirm save', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const anotherDivisionId = createTemporaryId();
            const team1: TeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: TeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();
            let divisionDataSetTo: DivisionDataDto | undefined;

            beforeEach(async () => {
                divisionDataSetTo = undefined;

                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [
                            divisionBuilder('DIVISION 1', divisionId).build(),
                            divisionBuilder(
                                'ANOTHER DIVISION',
                                anotherDivisionId,
                            ).build(),
                        ],
                        seasons: [
                            getSeason(seasonId, divisionId, anotherDivisionId),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        id: divisionId,
                        setDivisionData: async (d?: DivisionDataDto) => {
                            divisionDataSetTo = d;
                        },
                    },
                    {
                        seasonId: seasonId,
                    },
                );

                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 1.1 '),
                                                    team('AWAY 1.1'),
                                                ),
                                        '1.1',
                                    )
                                    .withFixture(
                                        (f) =>
                                            f.playing(
                                                team('home'),
                                                team('away'),
                                            ),
                                        '1.2',
                                    ) // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 2.1 '),
                                                    team('AWAY 2.1'),
                                                ),
                                        '2.1',
                                    )
                                    .withFixture((f) => f.proposal()) // excluded as awayTeam == undefined
                                    .withFixture(
                                        (f) =>
                                            f
                                                .proposal()
                                                .playing(
                                                    team('HOME 2.3 '),
                                                    team('AWAY 2.3'),
                                                ),
                                        '2.3',
                                    )
                                    .build(),
                            ],
                        },
                    ],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await context.button('Next').click();
                await context.button('Next').click();
                await context.button('Next').click();
                reportedError.verifyNoError();
                await context
                    .required('div')
                    .button('Save all fixtures')
                    .click();
            });

            it('can navigate back to review-proposals', async () => {
                await context.button('Back').click();

                expect(context.optional('div.modal')).toBeFalsy();
                expect(context.optional('div.position-fixed')).toBeTruthy();
            });

            it('reloads division after all fixtures saved and closes dialog', async () => {
                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeUndefined();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(true);
            });

            it('reports any errors during save and does not close dialog', async () => {
                updateFixtureApiResponse = async () => {
                    return {
                        success: false,
                        errors: ['SOME ERROR'],
                        warnings: [],
                        messages: [],
                    };
                };

                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeUndefined();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.text()).toContain(
                    'Some (3) fixtures could not be saved',
                );
            });

            it('reports any exceptions during save and does not close dialog', async () => {
                updateFixtureApiResponse = () => {
                    throw new Error('SOME EXCEPTION');
                };

                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeUndefined();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.text()).toContain(
                    'Some (3) fixtures could not be saved',
                );
            });
        });

        describe('general', () => {
            it('can close the dialog', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                let divisionDataResetTo: DivisionDataDto | undefined;
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [],
                        teams: [],
                    }),
                    {
                        setDivisionData: async (d?: DivisionDataDto) => {
                            divisionDataResetTo = d;
                        },
                    },
                    {
                        seasonId: seasonId,
                    },
                );
                reportedError.verifyNoError();

                await context.button('Close').click();

                reportedError.verifyNoError();
                expect(divisionDataResetTo).toBeUndefined();
                expect(closed).toEqual(true);
            });
        });
    });
});
