import {
    cleanUp,
    doSelectOption,
    renderApp,
    doClick,
    findButton,
    iocProps,
    brandingProps,
    appProps, TestContext
} from "../../../helpers/tests";
import React from "react";
import {IReviewProposalsFloatingDialogProps, ReviewProposalsFloatingDialog} from "./ReviewProposalsFloatingDialog";
import {toDictionary} from "../../../helpers/collections";
import {createTemporaryId} from "../../../helpers/projection";
import {IAppContainerProps} from "../../../AppContainer";
import {IDivisionDto} from "../../../interfaces/models/dtos/IDivisionDto";
import {ITeamDto} from "../../../interfaces/models/dtos/Team/ITeamDto";
import {IProposalResultDto} from "../../../interfaces/models/dtos/Season/Creation/IProposalResultDto";
import {IDivisionDataDto} from "../../../interfaces/models/dtos/Division/IDivisionDataDto";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {teamBuilder} from "../../../helpers/builders/teams";

describe('ReviewProposalsFloatingDialog', () => {
    let context: TestContext;
    let next: boolean;
    let previous: boolean;
    let visibleDivision: string;

    async function onPrevious() {
        previous = true;
    }
    async function onNext() {
        next = true;
    }
    async function changeVisibleDivision(id: string) {
        visibleDivision = id;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        previous = false;
        next = false;
        visibleDivision = null;
    });

    async function renderComponent(appContainerProps: IAppContainerProps, props: IReviewProposalsFloatingDialogProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appContainerProps,
            (<ReviewProposalsFloatingDialog {...props} />));
    }

    function getProposalResult(divisions: IDivisionDto[]): IProposalResultDto {
        return {
            divisions: divisions.map((d: IDivisionDto): IDivisionDataDto => {
                return {
                    id: d.id,
                    name: d.name,
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
        const division1: IDivisionDto = divisionBuilder('DIVISION 1').build();
        const division2: IDivisionDto = divisionBuilder('DIVISION 2').build();
        const division3: IDivisionDto = divisionBuilder('DIVISION 3').build();
        const teamA: ITeamDto = teamBuilder('TEAM A').build();
        const teamB: ITeamDto = teamBuilder('TEAM B').build();
        const teamC: ITeamDto = teamBuilder('TEAM C').build();
        const teamD: ITeamDto = teamBuilder('TEAM D').build();

        it('all proposed divisions in dropdown in order', async () => {
            await renderComponent(appProps({
                divisions: [ division1, division2, division3 ],
            }), {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
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

            await renderComponent(appProps({
                divisions: [ division1, division2 ],
            }), {
                proposalResult,
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
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

            await renderComponent(appProps({
                divisions: [ division1 ],
            }), {
                proposalResult,
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
            });

            const linkToTemplate = context.container.querySelector('p a') as HTMLAnchorElement;
            expect(linkToTemplate.textContent).toEqual('TEMPLATE');
            expect(linkToTemplate.href).toEqual('http://localhost/admin/templates/?select=' + templateId);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();

        it('can change division', async () => {
            await renderComponent(appProps({
                divisions: [ division1, division2 ],
            }), {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'DIVISION 2');

            expect(visibleDivision).toEqual(division2.id);
        });

        it('can navigate back', async () => {
            await renderComponent(appProps({
                divisions: [ division1, division2 ],
            }), {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
            });

            await doClick(findButton(context.container, 'Back'));

            expect(previous).toEqual(true);
        });

        it('can navigate forward', async () => {
            await renderComponent(appProps({
                divisions: [ division1, division2 ],
            }), {
                proposalResult: getProposalResult([division2, division1]),
                selectedDivisionId: division1.id,
                changeVisibleDivision,
                onNext,
                onPrevious,
            });

            await doClick(findButton(context.container, 'Save all fixtures'));

            expect(next).toEqual(true);
        });
    });
});