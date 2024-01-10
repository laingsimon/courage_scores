// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp, doClick, findButton} from "../../../helpers/tests";
import React from "react";
import {ReviewProposalsFloatingDialog} from "./ReviewProposalsFloatingDialog";
import {divisionBuilder, teamBuilder} from "../../../helpers/builders";
import {toDictionary} from "../../../helpers/collections";
import {createTemporaryId} from "../../../helpers/projection";

describe('ReviewProposalsFloatingDialog', () => {
    let context;
    let reportedError;
    let next;
    let previous;
    let visibleDivision;

    function onPrevious() {
        previous = true;
    }
    function onNext() {
        next = true;
    }
    function changeVisibleDivision(division) {
        visibleDivision = division;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        previous = false;
        next = false;
        visibleDivision = null;
    });

    async function renderComponent(appProps, props) {
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
                ...appProps
            },
            (<ReviewProposalsFloatingDialog
                {...props}
                onPrevious={onPrevious}
                onNext={onNext}
                changeVisibleDivision={changeVisibleDivision} />));
    }

    function getProposalResult(divisions) {
        return {
            divisions: divisions.map(d => {
                return {
                    id: d.id
                };
            }),
            template: {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: divisions.map(() => {
                    return {
                        sharedAddresses: [],
                        dates: [],
                    };
                }),
            },
            placeholderMappings: {},
        }
    }

    describe('renders', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const division3 = divisionBuilder('DIVISION 3').build();
        const teamA = teamBuilder('TEAM A').build();
        const teamB = teamBuilder('TEAM B').build();
        const teamC = teamBuilder('TEAM C').build();
        const teamD = teamBuilder('TEAM D').build();

        it('all proposed divisions in dropdown in order', async () => {
            await renderComponent({
                divisions: [ division1, division2, division3 ],
            }, {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id
            });

            const divisionDropdown = context.container.querySelector('.dropdown-menu');
            const divisionItems = Array.from(divisionDropdown.querySelectorAll('.dropdown-item'));
            expect(divisionItems.map(li => li.textContent)).toEqual([ 'DIVISION 1', 'DIVISION 2' ]);
        });

        it('placeholder mappings', async () => {
            const proposalResult = getProposalResult([division2, division1]);
            proposalResult.template.sharedAddresses = [ [ 'A', 'B' ] ];
            proposalResult.template.divisions[0].sharedAddresses = [ [ 'B', 'C' ] ];
            proposalResult.template.divisions[0].dates = [{
                fixtures: [
                    { home: 'A' },
                    { home: 'C', away: 'D' },
                    { home: 'B' },
                ]
            }];
            proposalResult.placeholderMappings = {
                'A': teamA,
                'B': teamB,
                'C': teamC,
                'D': teamD,
            };

            await renderComponent({
                divisions: [ division1, division2 ],
            }, {
                proposalResult,
                selectedDivisionId: division1.id
            });

            const placeholderItems = toDictionary(
                Array.from(context.container.querySelectorAll('ul li')),
                li => li.querySelector('span').textContent);
            expect(Object.keys(placeholderItems)).toEqual(['A', 'B', 'C', 'D']);
            expect(placeholderItems['A'].textContent).toEqual('A → TEAM A');
            expect(placeholderItems['B'].textContent).toEqual('B → TEAM B');
            expect(placeholderItems['C'].textContent).toEqual('C → TEAM C');
            expect(placeholderItems['D'].textContent).toEqual('D → TEAM D');

            expect(placeholderItems['A'].querySelector('span').className).toContain('bg-warning');
            expect(placeholderItems['B'].querySelector('span').className).toContain('bg-warning bg-secondary text-light');
            expect(placeholderItems['C'].querySelector('span').className).toContain('bg-secondary text-light');
            expect(placeholderItems['D'].querySelector('span').className).not.toContain('bg-');
        });

        it('link to template', async () => {
            const proposalResult = getProposalResult([division1]);
            const templateId = proposalResult.template.id;

            await renderComponent({
                divisions: [ division1 ],
            }, {
                proposalResult,
                selectedDivisionId: division1.id
            });

            const linkToTemplate = context.container.querySelector('p a');
            expect(linkToTemplate.textContent).toEqual('TEMPLATE');
            expect(linkToTemplate.href).toEqual('http://localhost/admin/templates/?select=' + templateId);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();

        it('can change division', async () => {
            await renderComponent({
                divisions: [ division1, division2 ],
            }, {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'DIVISION 2');

            expect(visibleDivision).toEqual(division2.id);
        });

        it('can navigate back', async () => {
            await renderComponent({
                divisions: [ division1, division2 ],
            }, {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id
            });

            await doClick(findButton(context.container, 'Back'));

            expect(previous).toEqual(true);
        });

        it('can navigate forward', async () => {
            await renderComponent({
                divisions: [ division1, division2 ],
            }, {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id
            });

            await doClick(findButton(context.container, 'Save all fixtures'));

            expect(next).toEqual(true);
        });
    });
});