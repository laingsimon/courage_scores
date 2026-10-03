import {
    api,
    appProps as appPropsFunc,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests.tsx';
import { repeat, createTemporaryId } from '../../helpers/projection.ts';
import {
    CreateSeasonDialog,
    ICreateSeasonDialogProps,
} from './CreateSeasonDialog.tsx';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer.tsx';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ActionResultDto } from '../../interfaces/models/dtos/ActionResultDto.ts';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto.ts';
import { ProposalResultDto } from '../../interfaces/models/dtos/Season/Creation/ProposalResultDto.ts';
import { ProposalRequestDto } from '../../interfaces/models/dtos/Season/Creation/ProposalRequestDto.ts';
import { EditGameDto } from '../../interfaces/models/dtos/Game/EditGameDto.ts';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto.ts';
import { IAppContainerProps } from '../common/AppContainer.tsx';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto.ts';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto.ts';
import { teamBuilder } from '../../helpers/builders/teams.ts';
import {
    divisionBuilder,
    fixtureDateBuilder,
    IDivisionFixtureBuilder,
    INoteBuilder,
} from '../../helpers/builders/divisions.ts';
import { seasonBuilder } from '../../helpers/builders/seasons.ts';
import { ISeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi.ts';
import { IGameApi } from '../../interfaces/apis/IGameApi.ts';
import { INoteApi } from '../../interfaces/apis/INoteApi.ts';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';

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
    let updatedNotes: FixtureDateNoteDto[];
    let updateFixtureApiResponse:
        | ((fixture: EditGameDto) => Promise<IClientActionResultDto<GameDto>>)
        | null;
    let updateNoteApiResponse:
        | ((
              fixture: FixtureDateNoteDto,
          ) => Promise<IClientActionResultDto<FixtureDateNoteDto>>)
        | null;
    let divisionReloaded: boolean;
    let divisionDataSetTo: DivisionDataDto | undefined;

    const templateApi = api<ISeasonTemplateApi>({
        async getCompatibility(seasonId: string) {
            return compatibilityResponses[seasonId] || { success: false };
        },
        async propose(request: ProposalRequestDto) {
            proposalRequest = request;
            return (
                apiResponse || {
                    success: false,
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
    const noteApi = api<INoteApi>({
        async upsert(id: string, note: FixtureDateNoteDto) {
            updatedNotes.push(note);
            return updateNoteApiResponse
                ? await updateNoteApiResponse(note)
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

    async function setDivisionData(d?: DivisionDataDto) {
        divisionDataSetTo = d;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        divisionDataSetTo = undefined;
        updatedFixtures = [];
        updatedNotes = [];
        divisionReloaded = false;
        updateFixtureApiResponse = null;
        updateNoteApiResponse = null;
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
        props: Partial<ICreateSeasonDialogProps>,
        divisionDataProps?: Partial<IDivisionDataContainerProps>,
    ) {
        const ddProps: IDivisionDataContainerProps = {
            name: '',
            onReloadDivision,
            setDivisionData,
            ...divisionDataProps,
        };
        context = await renderApp(
            iocProps({ templateApi, gameApi, noteApi }),
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
                },
            },
        );

        return {
            success: true,
            result: [
                {
                    success: true,
                    result: template,
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

    function getSeason(s?: string, d?: DivisionDto, ad?: DivisionDto) {
        let builder = seasonBuilder('SEASON', s);
        builder = d ? builder.withDivision(d) : builder;
        builder = ad ? builder.withDivision(ad) : builder;

        return builder.build();
    }

    function team(name: string): TeamDto {
        return teamBuilder(name).build();
    }

    function homeAwayFixture(f: IDivisionFixtureBuilder) {
        return f.playing(team('home'), team('away'));
    }

    function homeAwayProposal(f: IDivisionFixtureBuilder) {
        return f.proposal().playing(team('home'), team('away'));
    }

    function byeProposal(f: IDivisionFixtureBuilder) {
        return f.proposal().bye(teamBuilder('anywhere').build());
    }

    function homeAwayProposalN(d: number, n: number) {
        const suffix = `${d}.${n}`;

        return (f: IDivisionFixtureBuilder) =>
            f
                .proposal()
                .playing(team(`HOME ${suffix} `), team('AWAY ${suffix}'));
    }

    function existingNote(b: INoteBuilder) {
        return b.note('existing note').updated('some time');
    }

    describe('renders', () => {
        // 2-assign placeholders tests are in AssignPlaceholder.test.js
        // 3-review tests are in ReviewProposalHealth.test.js
        // 4-review proposals tests are in ReviewProposalsFloatingDialog.test.js

        describe('5- confirm save', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const division = divisionBuilder('DIVISION 1').build();
            const anotherDivision = divisionBuilder('ANOTHER DIVISION').build();
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivision)
                .build();

            it('prompt before starting save', async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [division, anotherDivision],
                        seasons: [
                            getSeason(seasonId, division, anotherDivision),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        seasonId: seasonId,
                    },
                    {
                        id: division.id,
                    },
                );
                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            ...division,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposal, '1.1')
                                    .withNote((b) => b.note('proposed note'))
                                    .withNote(existingNote)
                                    .withFixture(homeAwayFixture, '1.2') // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            ...anotherDivision,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposal, '2.1')
                                    .withFixture(byeProposal) // excluded as awayTeam == undefined
                                    .withFixture(homeAwayProposal, '2.3')
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
                    'Press Next to save all 3 fixtures & 1 notes across 2 divisions',
                );
            });
        });
    });

    describe('interactivity', () => {
        const seasonId = createTemporaryId();
        const division = divisionBuilder('DIVISION 1').build();
        const anotherDivision = divisionBuilder('ANOTHER DIVISION').build();
        const team1 = teamBuilder('TEAM 1')
            .forSeason(seasonId, division)
            .build();
        const team2 = teamBuilder('TEAM 2')
            .address('TEAM 2 ADDRESS')
            .forSeason(seasonId, anotherDivision.id)
            .build();
        const templateId = createTemporaryId();

        describe('1- pick', () => {
            it('prevents proposal of fixtures for incompatible template', async () => {
                addIncompatibleResponse(seasonId, createTemporaryId());
                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [getSeason(seasonId)],
                        teams: [team1, team2],
                    }),
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
                setApiResponse(true, { id: templateId });

                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [],
                    }),
                    {
                        seasonId: createTemporaryId(),
                    },
                );

                expect(context.button('Back').enabled()).toEqual(false);
            });

            it('moves to (2) assign-placeholders', async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [division],
                        seasons: [getSeason(seasonId, division)],
                        teams: [team1, team2],
                    }),
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
            const team3 = teamBuilder('TEAM 3')
                .address(team2.address)
                .forSeason(seasonId, anotherDivision)
                .build();
            const team4 = teamBuilder('TEAM 4')
                .address('TEAM 4')
                .forSeason(seasonId, division)
                .build();

            beforeEach(async () => {
                const response = addCompatibleResponse(seasonId, templateId);
                const template = response.result![0].result!;
                const anotherDivisionTemplate = template.divisions![0];
                const division1Template = template.divisions![1];
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
                            getSeason(seasonId, division, anotherDivision),
                        ],
                        teams: [team1, team2, team3, team4],
                    }),
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
            beforeEach(async () => {
                addCompatibleResponse(seasonId, templateId);

                await renderComponent(
                    appProps({
                        divisions: [division],
                        seasons: [getSeason(seasonId, division)],
                        teams: [team1, team2],
                    }),
                    {
                        seasonId: seasonId,
                    },
                    {
                        id: division.id,
                    },
                );
                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();

                setApiResponse(true, {
                    divisions: [
                        {
                            id: division.id,
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
                    id: division.id,
                    name: 'PROPOSED DIVISION',
                    sharedAddresses: [],
                });
                expect(context.required('div').className()).toContain(
                    'position-fixed',
                );
            });
        });

        describe('4- review proposals', () => {
            beforeEach(async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [division, anotherDivision],
                        seasons: [
                            getSeason(seasonId, division, anotherDivision),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        seasonId: seasonId,
                    },
                    {
                        id: division.id,
                    },
                );

                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            ...division,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposalN(1, 1), '1.1')
                                    .withFixture(homeAwayFixture, '1.2') // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            ...anotherDivision,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposalN(2, 1), '2.1')
                                    .withFixture((f) => f.proposal()) // excluded as awayTeam == undefined
                                    .withFixture(homeAwayProposalN(2, 3), '2.3')
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
            beforeEach(async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [division, anotherDivision],
                        seasons: [
                            getSeason(seasonId, division, anotherDivision),
                        ],
                        teams: [team1, team2],
                    }),
                    {
                        seasonId: seasonId,
                    },
                    {
                        id: division.id,
                    },
                );

                await context.required('.dropdown-menu').select('TEMPLATE');
                reportedError.verifyNoError();
                setApiResponse(true, {
                    divisions: [
                        {
                            ...division,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposalN(1, 1), '1.1')
                                    .withNote((b) => b.note('proposed note'))
                                    .withNote(existingNote) // excluded as not a proposal
                                    .withFixture(homeAwayFixture, '1.2') // excluded as not a proposal
                                    .build(),
                            ],
                        },
                        {
                            ...anotherDivision,
                            fixtures: [
                                fixtureDateBuilder('2023-01-01')
                                    .withFixture(homeAwayProposalN(2, 1), '2.1')
                                    .withFixture((f) => f.proposal()) // excluded as awayTeam == undefined
                                    .withFixture(homeAwayProposalN(2, 3), '2.3')
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

            it('reports any fixture errors during save and does not close dialog', async () => {
                updateFixtureApiResponse = async () => {
                    return {
                        success: false,
                        errors: ['SOME ERROR'],
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
                    'Some (3) fixtures or notes could not be saved',
                );
            });

            it('reports any note errors during save and does not close dialog', async () => {
                updateNoteApiResponse = async () => {
                    return {
                        success: false,
                        errors: ['SOME ERROR'],
                    };
                };

                await context.button('Next').click();

                reportedError.verifyNoError();
                expect(updatedNotes.length).toEqual(1);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeUndefined();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.text()).toContain(
                    'Some (1) fixtures or notes could not be saved',
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
                    'Some (3) fixtures or notes could not be saved',
                );
            });
        });

        describe('general', () => {
            it('can close the dialog', async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(
                    appProps({
                        divisions: [],
                        seasons: [],
                        teams: [],
                    }),
                    {
                        seasonId: seasonId,
                    },
                );
                reportedError.verifyNoError();

                await context.button('Close').click();

                reportedError.verifyNoError();
                expect(divisionDataSetTo).toBeUndefined();
                expect(closed).toEqual(true);
            });
        });
    });
});
