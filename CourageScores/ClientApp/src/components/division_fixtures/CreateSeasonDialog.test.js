// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import React from "react";
import {CreateSeasonDialog} from "./CreateSeasonDialog";
import {DivisionDataContainer} from "../DivisionDataContainer";

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

    describe('renders', () => {
        describe('1- pick', () => {
            it('when no templates returned', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: []
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                expect(reportedError).toBeNull();
                const onlyMenuItem = context.container.querySelector('.dropdown-item');
                expect(onlyMenuItem).toBeFalsy();
            });

            it('compatible template in dropdown', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: createTemporaryId(),
                            name: 'TEMPLATE',
                            templateHealth: {},
                        }
                    }]
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                expect(reportedError).toBeNull();
                const menu = context.container.querySelector('.dropdown-menu');
                const items = Array.from(menu.querySelectorAll('.dropdown-item'));
                expect(items.map(i => i.textContent)).toEqual(['TEMPLATE']);
            });

            it('incompatible template in dropdown', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: false,
                        result: {
                            id: createTemporaryId(),
                            name: 'TEMPLATE',
                            templateHealth: {},
                        }
                    }]
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                expect(reportedError).toBeNull();
                const menu = context.container.querySelector('.dropdown-menu');
                const items = Array.from(menu.querySelectorAll('.dropdown-item'));
                expect(items.map(i => i.textContent)).toEqual(['🚫 TEMPLATE']);
            });

            it('cannot navigate back', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };

                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                const back = findButton(context.container, 'Back');
                expect(back.disabled).toEqual(true);
            });
        });

        describe('2- review', () => {
            it('proposal result when proposal fails', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: false,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        }
                    }
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('h4').textContent).toEqual('⚠ There was an issue proposing fixtures');
                expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual(['ERROR']);
                expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual(['WARNING']);
                expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual(['MESSAGE']);
                expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeFalsy();
            });

            it('proposal result when proposal succeeds', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        }
                    }
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('h4').textContent).toEqual('✔ Fixtures have been proposed');
                expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual(['ERROR']);
                expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual(['WARNING']);
                expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual(['MESSAGE']);
                expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
            });
        });

        describe('3- review-proposals', () => {
            it('all divisions in floating dialog', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                const floatingDialog = context.container.querySelector('div');
                expect(floatingDialog.className).toContain('position-fixed');
                expect(floatingDialog.textContent).toContain('Review the fixtures in the divisions');
                const options = Array.from(floatingDialog.querySelectorAll('.dropdown-menu .dropdown-item'));
                expect(options.map(li => li.textContent)).toEqual(['ANOTHER DIVISION', 'DIVISION 1']);
            });
        });

        describe('4- confirm save', () => {
            it('prompt before starting save', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    awayTeam: {},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    awayTeam: {},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    awayTeam: {},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));

                expect(context.container.querySelector('div.modal')).toBeTruthy();
                expect(context.container.querySelector('div.position-fixed')).toBeFalsy();
                expect(context.container.textContent).toContain('Press Next to save all 3 fixtures across 2 divisions');
            });
        });
    });

    describe('interactivity', () => {
        describe('1- pick', () => {
            it('shows details of incompatible template', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: false,
                        result: {
                            id: createTemporaryId(),
                            name: 'TEMPLATE',
                            templateHealth: {},
                        },
                        errors: ['ERROR'],
                        warnings: ['WARNING'],
                        messages: ['MESSAGE'],
                    }]
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '🚫 TEMPLATE');

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('h4').textContent).toEqual('🚫 Incompatible with this season');
                expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual(['ERROR']);
                expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual(['WARNING']);
                expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual(['MESSAGE']);
                expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeFalsy();
            });

            it('shows details of compatible template', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: createTemporaryId(),
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: ['ERROR'],
                        warnings: ['WARNING'],
                        messages: ['MESSAGE'],
                    }]
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('h4').textContent).toEqual('✔ Compatible with this season');
                expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual(['ERROR']);
                expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual(['WARNING']);
                expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual(['MESSAGE']);
                expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
            });

            it('prevents proposal of fixtures for incompatible template', async () => {
                const seasonId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: false,
                        result: {
                            id: createTemporaryId(),
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
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

            it('proposes fixtures for template', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
                }, null, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        }
                    }
                };

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(proposalRequest).toEqual({
                    seasonId: seasonId,
                    templateId: templateId,
                });
            });
        });

        describe('2- review', () => {
            it('can navigate back to pick', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
                }, {
                    setDivisionData: () => {
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        }
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container, 'Back'));

                expect(reportedError).toBeNull();
                expect(findButton(context.container, 'Back').disabled).toEqual(true);
                expect(context.container.querySelector('.dropdown-menu')).toBeTruthy();
            });

            it('can navigate to review-proposals', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(divisionDataSetTo).toEqual({
                    id: divisionId,
                    name: 'PROPOSED DIVISION',
                });
                expect(context.container.querySelector('div').className).toContain('position-fixed');
            });
        });

        describe('3- review-proposals', () => {
            it('can switch division', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                const floatingDialog = context.container.querySelector('div');

                await doSelectOption(floatingDialog.querySelector('.dropdown-menu'), 'ANOTHER DIVISION');

                expect(divisionDataSetTo).toEqual({
                    id: anotherDivisionId,
                    name: 'ANOTHER DIVISION',
                });
            });

            it('can navigate back to review', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();

                await doClick(findButton(context.container.querySelector('div'), 'Back'));

                expect(context.container.querySelector('div.modal')).toBeTruthy();
                expect(context.container.querySelector('div.position-fixed')).toBeFalsy();
            });
        });

        describe('4- confirm save', () => {
            it('can navigate back to review-proposals', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
                }, {
                    id: divisionId, setDivisionData: (d) => {
                        divisionDataSetTo = d;
                    }
                }, {
                    seasonId: seasonId,
                });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');
                expect(reportedError).toBeNull();
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: []
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: []
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));

                await doClick(findButton(context.container, 'Back'));

                expect(context.container.querySelector('div.modal')).toBeFalsy();
                expect(context.container.querySelector('div.position-fixed')).toBeTruthy();
            });

            it('reloads division after all fixtures saved and closes dialog', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                let divisionReloaded;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
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
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 1.1 '},
                                    awayTeam: {name: 'AWAY 1.1'},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.1 '},
                                    awayTeam: {name: 'AWAY 2.1'},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.3 '},
                                    awayTeam: {name: 'AWAY 2.3'},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));

                await doClick(findButton(context.container, 'Next'));

                expect(reportedError).toBeNull();
                expect(updatedFixtures.length).toEqual(3);
                expect(divisionReloaded).toEqual(true);
                expect(divisionDataSetTo).toBeNull();
                expect(allDataReloaded).toEqual(true);
                expect(closed).toEqual(true);
            });

            it('reports any errors during save and does not close dialog', async () => {
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                let divisionReloaded;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
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
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 1.1 '},
                                    awayTeam: {name: 'AWAY 1.1'},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.1 '},
                                    awayTeam: {name: 'AWAY 2.1'},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.3 '},
                                    awayTeam: {name: 'AWAY 2.3'},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
                updateFixtureApiResponse = () => {
                    return {
                        success: false,
                        errors: ['SOME ERROR'],
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
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                let divisionReloaded;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
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
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 1.1 '},
                                    awayTeam: {name: 'AWAY 1.1'},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.1 '},
                                    awayTeam: {name: 'AWAY 2.1'},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.3 '},
                                    awayTeam: {name: 'AWAY 2.3'},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
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
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                let divisionReloaded;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
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
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 1.1 '},
                                    awayTeam: {name: 'AWAY 1.1'},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.1 '},
                                    awayTeam: {name: 'AWAY 2.1'},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.3 '},
                                    awayTeam: {name: 'AWAY 2.3'},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
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
                const seasonId = createTemporaryId();
                const templateId = createTemporaryId();
                const divisionId = createTemporaryId();
                const anotherDivisionId = createTemporaryId();
                let divisionDataSetTo;
                let divisionReloaded;
                let abort = true;
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: [{
                        id: divisionId,
                        name: 'DIVISION 1',
                    }, {
                        id: anotherDivisionId,
                        name: 'ANOTHER DIVISION',
                    }]
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
                apiResponse = {
                    success: true,
                    errors: ['ERROR'],
                    warnings: ['WARNING'],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                        divisions: [{
                            id: divisionId,
                            name: 'PROPOSED DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '1.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 1.1 '},
                                    awayTeam: {name: 'AWAY 1.1'},
                                }, {
                                    id: '1.2',
                                    proposal: false, // excluded as not a proposal
                                    awayTeam: {},
                                }],
                            }]
                        }, {
                            id: anotherDivisionId,
                            name: 'ANOTHER DIVISION',
                            fixtures: [{
                                date: '2023-01-01',
                                fixtures: [{
                                    id: '2.1',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.1 '},
                                    awayTeam: {name: 'AWAY 2.1'},
                                }, {
                                    id: createTemporaryId(),
                                    proposal: true, // excluded as awayTeam == undefined
                                }, {
                                    id: '2.3',
                                    proposal: true,
                                    homeTeam: {name: 'HOME 2.3 '},
                                    awayTeam: {name: 'AWAY 2.3'},
                                }],
                            }]
                        }],
                    }
                };
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container, 'Next'));
                expect(reportedError).toBeNull();
                await doClick(findButton(context.container.querySelector('div'), 'Save all fixtures'));
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
                compatibilityResponses[seasonId] = {
                    success: true,
                    result: [{
                        success: true,
                        result: {
                            id: templateId,
                            name: 'TEMPLATE',
                            templateHealth: {
                                checks: {},
                                errors: [],
                                warnings: [],
                                messages: [],
                            },
                        },
                        errors: [],
                        warnings: [],
                        messages: [],
                    }],
                };
                await renderComponent({
                    divisions: []
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