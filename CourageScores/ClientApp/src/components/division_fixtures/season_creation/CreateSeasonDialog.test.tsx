import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps, noop,
    renderApp, TestContext
} from "../../../helpers/tests";
import {toMap} from "../../../helpers/collections";
import {repeat, createTemporaryId} from "../../../helpers/projection";
import React from "react";
import {CreateSeasonDialog, ICreateSeasonDialogProps} from "./CreateSeasonDialog";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../../DivisionDataContainer";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {IActionResultDto} from "../../../interfaces/models/dtos/IActionResultDto";
import {ITemplateDto} from "../../../interfaces/models/dtos/Season/Creation/ITemplateDto";
import {IProposalResultDto} from "../../../interfaces/models/dtos/Season/Creation/IProposalResultDto";
import {IProposalRequestDto} from "../../../interfaces/models/dtos/Season/Creation/IProposalRequestDto";
import {IEditGameDto} from "../../../interfaces/models/dtos/Game/IEditGameDto";
import {IGameDto} from "../../../interfaces/models/dtos/Game/IGameDto";
import {IAppContainerProps} from "../../../AppContainer";
import {ITeamDto} from "../../../interfaces/models/dtos/Team/ITeamDto";
import {IDivisionDto} from "../../../interfaces/models/dtos/IDivisionDto";
import {IDivisionTemplateDto} from "../../../interfaces/models/dtos/Season/Creation/IDivisionTemplateDto";
import {IDivisionDataDto} from "../../../interfaces/models/dtos/Division/IDivisionDataDto";
import {teamBuilder} from "../../../helpers/builders/teams";
import {divisionBuilder, fixtureDateBuilder, IDivisionFixtureBuilder} from "../../../helpers/builders/divisions";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {ISeasonTemplateApi} from "../../../interfaces/apis/ISeasonTemplateApi";
import {IGameApi} from "../../../interfaces/apis/IGameApi";

describe('CreateSeasonDialog', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let closed: boolean;
    let compatibilityResponses: { [ seasonId: string]: IClientActionResultDto<IActionResultDto<ITemplateDto>[]> };
    let allDataReloaded: boolean;
    let apiResponse: IClientActionResultDto<IProposalResultDto>;
    let proposalRequest: IProposalRequestDto;
    let updatedFixtures: IEditGameDto[];
    let updateFixtureApiResponse: (fixture: IEditGameDto) => Promise<IClientActionResultDto<IGameDto>>;
    let divisionReloaded: boolean;

    const templateApi = api<ISeasonTemplateApi>({
        getCompatibility: (seasonId: string) => {
            return compatibilityResponses[seasonId] || {success: false};
        },
        propose: (request: IProposalRequestDto) => {
            proposalRequest = request;
            return apiResponse || {success: false, errors: [], warnings: [], messages: []};
        },
    });
    const gameApi = api<IGameApi>({
        update: async (fixture: IEditGameDto) => {
            updatedFixtures.push(fixture);
            return updateFixtureApiResponse
                ? await updateFixtureApiResponse(fixture)
                : {success: true};
        }
    });

    async function reloadAll() {
        allDataReloaded = true;
    }

    async function onReloadDivision() {
        divisionReloaded = true;
        return null;
    }

    async function onClose() {
        closed = true;
    }

    afterEach(() => {
        cleanUp(context);
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

    async function renderComponent(appContainerProps: IAppContainerProps, divisionDataProps: IDivisionDataContainerProps | null, props: ICreateSeasonDialogProps) {
        context = await renderApp(
            iocProps({templateApi, gameApi}),
            brandingProps(),
            appContainerProps,
            (<DivisionDataContainer {...divisionDataProps}>
                <CreateSeasonDialog {...props} />
            </DivisionDataContainer>));
    }

    function addCompatibleResponse(seasonId: string, templateId: string): IClientActionResultDto<IActionResultDto<ITemplateDto>[]> {
        const response: IClientActionResultDto<IActionResultDto<ITemplateDto>[]> = getCompatibleResponse(seasonId, templateId);
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function addIncompatibleResponse(seasonId: string, templateId: string): IClientActionResultDto<IActionResultDto<ITemplateDto>[]> {
        const response: IClientActionResultDto<IActionResultDto<ITemplateDto>[]> = getCompatibleResponse(seasonId, templateId);
        response.result[0].success = false;
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function getCompatibleResponse(_: string, templateId: string): IClientActionResultDto<IActionResultDto<ITemplateDto>[]> {
        const template: ITemplateDto = Object.assign(
            getEmptyTemplate(templateId, 2),
            {
                name: 'TEMPLATE',
                templateHealth: {
                    checks: {},
                    errors: [],
                    warnings: [],
                    messages: [],
                },
            });

        return {
            success: true,
            result: [{
                success: true,
                result: template,
                errors: [],
                warnings: [],
                messages: [],
            }],
        };
    }

    function setApiResponse(success: boolean, resultProps?: any) {
        apiResponse = {
            success: success,
            errors: ['ERROR'],
            warnings: ['WARNING'],
            messages: ['MESSAGE'],
            result: Object.assign({
                proposalHealth: {
                    checks: {},
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            }, resultProps),
        };
    }

    function getEmptyTemplate(templateId: string, noOfDivisions: number): ITemplateDto {
        return {
            name: 'EMPTY',
            id: templateId,
            sharedAddresses: [],
            divisions: repeat(noOfDivisions, () => {
                return {
                    sharedAddresses: [],
                    dates: [],
                }
            }),
        };
    }

    function getSeason(seasonId?: string, divisionId?: string, anotherDivisionId?: string) {
        let builder = seasonBuilder('SEASON', seasonId);

        if (divisionId) {
            builder = builder.withDivision(divisionId);
        }

        if (anotherDivisionId) {
            builder = builder.withDivision(anotherDivisionId);
        }

        return builder.build();
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
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();

            it('prompt before starting save', async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(appProps({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }, reportedError), {
                    id: divisionId,
                    name: '',
                    setDivisionData: noop,
                    onReloadDivision}, {
                    seasonId: seasonId,
                    onClose,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('home', 'away'), '1.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('home', 'away'), '2.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().bye('anywhere')) // excluded as awayTeam == undefined
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('home', 'away'), '2.3')
                                .build()]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });
                await doClick(findButton(context.container, 'Next')); // (1) pick -> (2) assign placeholders
                await doClick(findButton(context.container, 'Next')); // (2) assign placeholders -> (3) review
                await doClick(findButton(context.container, 'Next')); // (3) review -> (4) review-proposals
                expect(reportedError.hasError()).toEqual(false);

                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures')); // (4) review-proposals -> (5) confirm-save

                expect(context.container.querySelector('div.modal')).toBeTruthy();
                expect(context.container.querySelector('div.position-fixed')).toBeFalsy();
                expect(context.container.textContent).toContain('Press Next to save all 3 fixtures across 2 divisions');
            });
        });
    });

    describe('interactivity', () => {
        describe('1- pick', () => {
            const seasonId = createTemporaryId();
            const division: IDivisionDto = divisionBuilder('DIVISION 1').build();
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, createTemporaryId())
                .build();

            it('prevents proposal of fixtures for incompatible template', async () => {
                addIncompatibleResponse(seasonId, createTemporaryId());
                await renderComponent(appProps({
                    divisions: [],
                    seasons: toMap([getSeason(seasonId)]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }, reportedError), null, {
                    seasonId: seasonId,
                    onClose,
                });
                let alert: string;
                window.alert = (msg) => alert = msg;
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '🚫 TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(alert).toEqual('This template is not compatible with this season, pick another template');
                expect(proposalRequest).toBeNull();
            });

            it('cannot navigate back', async () => {
                const templateId = createTemporaryId();
                setApiResponse(true, { id: templateId });

                await renderComponent(appProps({
                    divisions: [],
                    seasons: toMap([]),
                    reloadAll,
                }, reportedError), null, {
                    seasonId: createTemporaryId(),
                    onClose,
                });

                const back = findButton(context.container, 'Back');
                expect(back.disabled).toEqual(true);
            });

            it('moves to (2) assign-placeholders', async () => {
                const templateId = createTemporaryId();
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: toMap([getSeason(seasonId, division.id)]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }, reportedError), null, {
                    seasonId: seasonId,
                    onClose,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);
                setApiResponse(true);

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                const placeholderLists = Array.from(context.container.querySelectorAll('h6 + ul'));
                expect(placeholderLists.length).toEqual(1);
            });
        });

        describe('2- assign placeholders', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const division: IDivisionDto = divisionBuilder('DIVISION 1').build();
            const anotherDivision: IDivisionDto = divisionBuilder('ANOTHER DIVISION').build();
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .address('TEAM 1')
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team3: ITeamDto = teamBuilder('TEAM 3')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team4: ITeamDto = teamBuilder('TEAM 4')
                .address('TEAM 4')
                .forSeason(seasonId, division)
                .build();

            beforeEach(async () => {
                const response: IClientActionResultDto<IActionResultDto<ITemplateDto>[]> = addCompatibleResponse(seasonId, templateId);
                const template: ITemplateDto = response.result[0].result;
                const anotherDivisionTemplate: IDivisionTemplateDto = template.divisions[0];
                const division1Template: IDivisionTemplateDto = template.divisions[1];
                template.sharedAddresses = [ [ 'A', 'B' ] ];
                anotherDivisionTemplate.sharedAddresses = [ [ 'A', 'C' ] ];
                anotherDivisionTemplate.dates = [
                    { fixtures: [
                            { home: 'A', away: 'C' },
                            { home: 'D', away: null },
                        ] }
                ];
                division1Template.sharedAddresses = [ [ 'E', 'F' ] ];
                division1Template.dates = [
                    { fixtures: [
                            { home: 'B', away: 'F' },
                            { home: 'G', away: 'H' },
                        ] }
                ];

                await renderComponent(appProps({
                    divisions: [
                        division,
                        anotherDivision
                    ],
                    seasons: toMap([getSeason(seasonId, division.id, anotherDivision.id)]),
                    teams: toMap([team1, team2, team3, team4]),
                    reloadAll,
                }), null, {
                    seasonId: seasonId,
                    onClose,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');

                await doClick(findButton(context.container, 'Next'));
            });

            it('can navigate forwards to (3) review', async () => {
                await doClick(findButton(context.container, 'Next'));

                expect(proposalRequest).toEqual({
                    seasonId: seasonId,
                    templateId: templateId,
                    placeholderMappings: {},
                });
            });

            it('can navigate backwards to (1) pick', async () => {
                await doClick(findButton(context.container, 'Back'));

                const templateSelection = context.container.querySelector('.dropdown-menu');
                expect(templateSelection).toBeTruthy();
                expect(Array.from(templateSelection.querySelectorAll('.dropdown-item')).map(li => li.textContent))
                    .toEqual([ 'TEMPLATE' ]);
            });
        });

        describe('3- review', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, divisionId)
                .build();
            let divisionDataSetTo: IDivisionDataDto;

            beforeEach(async () => {
                divisionDataSetTo = null;

                addCompatibleResponse(seasonId, templateId);

                await renderComponent(appProps({
                    divisions: [divisionBuilder('DIVISION', divisionId).build()],
                    seasons: toMap([getSeason(seasonId, divisionId)]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }), {
                    id: divisionId,
                    name: '',
                    setDivisionData: async (d) => {
                        divisionDataSetTo = d;
                    },
                    onReloadDivision,
                }, {
                    seasonId: seasonId,
                    onClose,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);

                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        sharedAddresses: [],
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 1),
                });

                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
            });

            it('can navigate back to (2) assign placeholders', async () => {
                await doClick(findButton(context.container, 'Back'));

                expect(reportedError.hasError()).toEqual(false);
            });

            it('can navigate to (4) review-proposals', async () => {
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(divisionDataSetTo).toEqual({
                    id: divisionId,
                    name: 'PROPOSED DIVISION',
                    sharedAddresses: [],
                });
                expect(context.container.querySelector('div').className).toContain('position-fixed');
            });
        });

        describe('4- review proposals', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const anotherDivisionId = createTemporaryId();
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();

            beforeEach(async () => {
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(appProps({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }), {
                    id: divisionId,
                    name: '',
                    setDivisionData: noop,
                    onReloadDivision,
                }, {
                    seasonId: seasonId,
                    onClose,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 1.1 ', 'AWAY 1.1'), '1.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()
                        ]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 2.1 ', 'AWAY 2.1'), '2.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal()) // excluded as awayTeam == undefined
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 2.3 ', 'AWAY 2.3'), '2.3')
                                .build()
                        ]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError.hasError()).toEqual(false);
            });

            it('can navigate back to (3) review', async () => {
                await doClick(findButton(context.container, 'Back'));

                expect(context.container.querySelector('div.modal')).toBeTruthy();
                expect(context.container.querySelector('div.position-fixed')).toBeFalsy();
                expect(context.container.textContent).toContain('Press Next to review the fixtures in the divisions before saving');
            });

            it('can navigate forward to (5) confirm-save', async () => {
                await doClick(findButton(context.container, 'Save all fixtures'));

                expect(context.container.querySelector('div.modal')).toBeTruthy();
                expect(context.container.querySelector('div.position-fixed')).toBeFalsy();
                expect(context.container.textContent).toContain('Press Next to save all');
            });
        })

        describe('5- confirm save', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const divisionId = createTemporaryId();
            const anotherDivisionId = createTemporaryId();
            const team1: ITeamDto = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2: ITeamDto = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();
            let divisionDataSetTo: IDivisionDataDto;

            beforeEach(async () => {
                divisionDataSetTo = null;

                addCompatibleResponse(seasonId, templateId);
                await renderComponent(appProps({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                    reloadAll,
                }), {
                    id: divisionId,
                    name: '',
                    setDivisionData: async (d) => {
                        divisionDataSetTo = d;
                    },
                    onReloadDivision,
                }, {
                    seasonId: seasonId,
                    onClose,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError.hasError()).toEqual(false);
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 1.1 ', 'AWAY 1.1'), '1.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()
                        ]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 2.1 ', 'AWAY 2.1'), '2.1')
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal()) // excluded as awayTeam == undefined
                                .withFixture((f: IDivisionFixtureBuilder) => f.proposal().playing('HOME 2.3 ', 'AWAY 2.3'), '2.3')
                                .build()
                        ]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError.hasError()).toEqual(false);
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
            });

            it('can navigate back to review-proposals', async () => {
                await doClick(findButton(context.container, 'Back'));

                expect(context.container.querySelector('div.modal')).toBeFalsy();
                expect(context.container.querySelector('div.position-fixed')).toBeTruthy();
            });

            it('reloads division after all fixtures saved and closes dialog', async () => {
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
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

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.container.textContent).toContain('Some (3) fixtures could not be saved');
            });

            it('reports any exceptions during save and does not close dialog', async () => {
                updateFixtureApiResponse = () => {
                    throw new Error('SOME EXCEPTION');
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.container.textContent).toContain('Some (3) fixtures could not be saved');
            });

            it('can abort part way through a save', async () => {
                updateFixtureApiResponse = async () => {
                    // abort after first fixture
                    // must not be awaited as otherwise the call completes after the act() has completed
                    // noinspection ES6MissingAwait
                    doClick(findButton(context.container, 'Back'));
                    return {success: true};
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedFixtures.length).toEqual(1);
                expect(divisionReloaded).toBeFalsy();
                expect(divisionDataSetTo).toBeFalsy();
                expect(allDataReloaded).toBeFalsy();
                expect(closed).toEqual(false);
                expect(context.container.textContent).toContain('Saving - PROPOSED DIVISION');
            });

            it('can resume after an abort', async () => {
                let abort = true;
                updateFixtureApiResponse = async () => {
                    // abort after first fixture
                    if (abort) {
                        // must not be awaited as otherwise the call completes after the act() has completed
                        // noinspection ES6MissingAwait
                        doClick(findButton(context.container, 'Back'));
                    }
                    return {success: true};
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError.hasError()).toEqual(false);

                // resume
                abort = false;
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(true);
            });
        });

        describe('general', () => {
            it('can close the dialog', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                let divisionDataResetTo: IDivisionDataDto;
                addCompatibleResponse(seasonId, templateId);
                await renderComponent(appProps({
                    divisions: [],
                    seasons: toMap([]),
                    teams: toMap([]),
                    reloadAll,
                }), {
                    id: null,
                    name: '',
                    onReloadDivision,
                    setDivisionData: async (d) => {
                        divisionDataResetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                    onClose,
                });
                expect(reportedError.hasError()).toEqual(false);

                await doClick(findButton(context.container, 'Close'));

                expect(reportedError.hasError()).toEqual(false);
                expect(divisionDataResetTo).toEqual(null);
                expect(closed).toEqual(true);
            });
        });
    });
});