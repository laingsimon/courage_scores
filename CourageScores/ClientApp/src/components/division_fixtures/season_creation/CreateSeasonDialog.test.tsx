// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp} from "../../../helpers/tests";
import {toMap} from "../../../helpers/collections";
import {repeat, createTemporaryId} from "../../../helpers/projection";
import React from "react";
import {CreateSeasonDialog} from "./CreateSeasonDialog";
import {DivisionDataContainer} from "../../DivisionDataContainer";
import {divisionBuilder, fixtureDateBuilder, seasonBuilder, teamBuilder} from "../../../helpers/builders";

describe('CreateSeasonDialog', () => {
    let context;
    let reportedError;
    let closed;
    let compatibilityResponses;
    let allDataReloaded;
    let apiResponse;
    let proposalRequest;
    let updatedFixtures;
    let updateFixtureApiResponse;

    const templateApi = {
        getCompatibility: (seasonId) => {
            return compatibilityResponses[seasonId] || {success: false};
        },
        propose: (request) => {
            proposalRequest = request;
            return apiResponse || {success: false, errors: [], warnings: [], messages: []};
        },
    };
    const gameApi = {
        update: async (fixture) => {
            updatedFixtures.push(fixture);
            return updateFixtureApiResponse
                ? await updateFixtureApiResponse(fixture)
                : {success: true};
        }
    };

    function onClose() {
        closed = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        updatedFixtures = [];
        updateFixtureApiResponse = null;
        proposalRequest = null;
        apiResponse = null;
        allDataReloaded = false;
        reportedError = null;
        compatibilityResponses = {};
        closed = false;
    });

    async function renderComponent(appProps, divisionDataProps, props) {
        context = await renderApp(
            {templateApi, gameApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                reloadAll: () => {
                    allDataReloaded = true;
                },
                ...appProps
            },
            (<DivisionDataContainer {...divisionDataProps}>
                <CreateSeasonDialog {...props} onClose={onClose}/>
            </DivisionDataContainer>));
    }

    function addCompatibleResponse(seasonId, templateId) {
        const response = getCompatibleResponse(seasonId, templateId);
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function addIncompatibleResponse(seasonId, templateId) {
        const response = getCompatibleResponse(seasonId, templateId);
        response.result[0].success = false;
        compatibilityResponses[seasonId] = response;
        return response;
    }

    function getCompatibleResponse(seasonId, templateId) {
        const template = Object.assign(
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

    function setApiResponse(success, resultProps) {
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

    function getEmptyTemplate(templateId, noOfDivisions) {
        return {
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

    function getSeason(seasonId, divisionId, anotherDivisionId) {
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
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();
            let divisionDataSetTo;

            it('prompt before starting save', async () => {
                divisionDataSetTo = null;

                addCompatibleResponse(seasonId, templateId);
                await renderComponent({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('home', 'away'), '1.1')
                                .withFixture(f => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('home', 'away'), '2.1')
                                .withFixture(f => f.proposal().bye('anywhere')) // excluded as awayTeam == undefined
                                .withFixture(f => f.proposal().playing('home', 'away'), '2.3')
                                .build()]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });
                await doClick(findButton(context.container, 'Next')); // (1) pick -> (2) assign placeholders
                await doClick(findButton(context.container, 'Next')); // (2) assign placeholders -> (3) review
                await doClick(findButton(context.container, 'Next')); // (3) review -> (4) review-proposals
                expect(reportedError).toBeNull();

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
            const division = divisionBuilder('DIVISION 1').build();
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, createTemporaryId())
                .build();

            it('prevents proposal of fixtures for incompatible template', async () => {
                addIncompatibleResponse(seasonId, createTemporaryId());
                await renderComponent({
                    divisions: [],
                    seasons: toMap([getSeason(seasonId)]),
                    teams: toMap([team1, team2]),
                }, null, {
                    seasonId: seasonId,
                });
                let alert;
                window.alert = (msg) => alert = msg;
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '🚫 TEMPLATE');
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(alert).toEqual('This template is not compatible with this season, pick another template');
                expect(proposalRequest).toBeNull();
            });

            it('cannot navigate back', async () => {
                const templateId = createTemporaryId();
                setApiResponse(true, { id: templateId });

                await renderComponent({
                    divisions: [], seasons: toMap([])
                }, null, {
                    seasonId: createTemporaryId(),
                });

                const back = findButton(context.container, 'Back');
                expect(back.disabled).toEqual(true);
            });

            it('moves to (2) assign-placeholders', async () => {
                const templateId = createTemporaryId();
                addCompatibleResponse(seasonId, templateId);
                await renderComponent({
                    divisions: [division],
                    seasons: toMap([getSeason(seasonId, division.id)]),
                    teams: toMap([team1, team2]),
                }, null, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                setApiResponse(true);

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                const placeholderLists = Array.from(context.container.querySelectorAll('h6 + ul'));
                expect(placeholderLists.length).toEqual(1);
            });
        });

        describe('2- assign placeholders', () => {
            const seasonId = createTemporaryId();
            const templateId = createTemporaryId();
            const division = divisionBuilder('DIVISION 1').build();
            const anotherDivision = divisionBuilder('ANOTHER DIVISION').build();
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, division)
                .address('TEAM 1')
                .build();
            const team2 = teamBuilder('TEAM 2')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team3 = teamBuilder('TEAM 3')
                .address('SHARED')
                .forSeason(seasonId, anotherDivision)
                .build();
            const team4 = teamBuilder('TEAM 4')
                .address('TEAM 4')
                .forSeason(seasonId, division)
                .build();

            beforeEach(async () => {
                const response = addCompatibleResponse(seasonId, templateId);
                const template = response.result[0].result;
                const anotherDivisionTemplate = template.divisions[0];
                const division1Template = template.divisions[1];
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

                await renderComponent({
                    divisions: [
                        division,
                        anotherDivision
                    ],
                    seasons: toMap([getSeason(seasonId, division.id, anotherDivision.id)]),
                    teams: toMap([team1, team2, team3, team4]),
                }, null, {
                    seasonId: seasonId,
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
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, divisionId)
                .build();
            let divisionDataSetTo;

            beforeEach(async () => {
                divisionDataSetTo = null;

                addCompatibleResponse(seasonId, templateId);

                await renderComponent({
                    divisions: [divisionBuilder('DIVISION', divisionId).build()],
                    seasons: toMap([getSeason(seasonId, divisionId)]),
                    teams: toMap([team1, team2]),
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();

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

                expect(reportedError).toBeNull();
            });

            it('can navigate to (4) review-proposals', async () => {
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
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
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();
            let divisionDataSetTo;
            let divisionReloaded;

            beforeEach(async () => {
                divisionDataSetTo = null;
                divisionReloaded = null;

                addCompatibleResponse(seasonId, templateId);
                await renderComponent({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                }, {
                    id: divisionId,
                    setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    },
                    onReloadDivision: () => {
                        divisionReloaded = true;
                    },
                }, {
                    seasonId: seasonId,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('HOME 1.1 ', 'AWAY 1.1'), '1.1')
                                .withFixture(f => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()
                        ]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('HOME 2.1 ', 'AWAY 2.1'), '2.1')
                                .withFixture(f => f.proposal()) // excluded as awayTeam == undefined
                                .withFixture(f => f.proposal().playing('HOME 2.3 ', 'AWAY 2.3'), '2.3')
                                .build()
                        ]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
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
            const team1 = teamBuilder('TEAM 1')
                .forSeason(seasonId, divisionId)
                .build();
            const team2 = teamBuilder('TEAM 2')
                .forSeason(seasonId, anotherDivisionId)
                .build();
            let divisionDataSetTo;
            let divisionReloaded;

            beforeEach(async () => {
                divisionDataSetTo = null;
                divisionReloaded = null;

                addCompatibleResponse(seasonId, templateId);
                await renderComponent({
                    divisions: [
                        divisionBuilder('DIVISION 1', divisionId).build(),
                        divisionBuilder('ANOTHER DIVISION', anotherDivisionId).build()
                    ],
                    seasons: toMap([
                        getSeason(seasonId, divisionId, anotherDivisionId)
                    ]),
                    teams: toMap([team1, team2]),
                }, {
                    id: divisionId,
                    setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    },
                    onReloadDivision: () => {
                        divisionReloaded = true;
                    },
                }, {
                    seasonId: seasonId,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                setApiResponse(true, {
                    divisions: [{
                        id: divisionId,
                        name: 'PROPOSED DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('HOME 1.1 ', 'AWAY 1.1'), '1.1')
                                .withFixture(f => f.playing('home', 'away'), '1.2') // excluded as not a proposal
                                .build()
                        ]
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                        fixtures: [
                            fixtureDateBuilder('2023-01-01')
                                .withFixture(f => f.proposal().playing('HOME 2.1 ', 'AWAY 2.1'), '2.1')
                                .withFixture(f => f.proposal()) // excluded as awayTeam == undefined
                                .withFixture(f => f.proposal().playing('HOME 2.3 ', 'AWAY 2.3'), '2.3')
                                .build()
                        ]
                    }],
                    placeholderMappings: {},
                    template: getEmptyTemplate(templateId, 2),
                });

                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
            });

            it('can navigate back to review-proposals', async () => {
                await doClick(findButton(context.container, 'Back'));

                expect(context.container.querySelector('div.modal')).toBeFalsy();
                expect(context.container.querySelector('div.position-fixed')).toBeTruthy();
            });

            it('reloads division after all fixtures saved and closes dialog', async () => {
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(true);
            });

            it('reports any errors during save and does not close dialog', async () => {
                updateFixtureApiResponse = () => {
                    return {
                        success: false,
                        errors: ['SOME ERROR'],
                        warnings: [],
                        messages: [],
                    };
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
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

                expect(reportedError).toBeNull();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(false);
                expect(context.container.textContent).toContain('Some (3) fixtures could not be saved');
            });

            it('can abort part way through a save', async () => {
                updateFixtureApiResponse = () => {
                    // abort after first fixture
                    doClick(findButton(context.container, 'Back'));
                    return {success: true};
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(updatedFixtures.length).toEqual(1);
                expect(divisionReloaded).toBeFalsy();
                expect(divisionDataSetTo).toBeFalsy();
                expect(allDataReloaded).toBeFalsy();
                expect(closed).toEqual(false);
                expect(context.container.textContent).toContain('Saving - PROPOSED DIVISION');
            });

            it('can resume after an abort', async () => {
                let abort = true;
                updateFixtureApiResponse = () => {
                    // abort after first fixture
                    if (abort) {
                        doClick(findButton(context.container, 'Back'));
                    }
                    return {success: true};
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                // resume
                abort = false;
                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
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
                let divisionDataResetTo;
                addCompatibleResponse(seasonId, templateId);
                await renderComponent({
                    divisions: [],
                    seasons: toMap([]),
                    teams: toMap([]),
                }, {
                    setDivisionData: (d) => {
                        divisionDataResetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container, 'Close'));

                expect(reportedError).toBeNull();
                expect(divisionDataResetTo).toEqual(null);
                expect(closed).toEqual(true);
            });
        });
    });
});