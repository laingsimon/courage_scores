import {
    cleanUp,
    renderApp,
    IComponent,
    iocProps,
    brandingProps,
    appProps,
    TestContext,
} from '../../helpers/tests';
import {
    IReviewProposalsFloatingDialogProps,
    ReviewProposalsFloatingDialog,
} from './ReviewProposalsFloatingDialog';
import { toDictionary } from '../../helpers/collections';
import { createTemporaryId } from '../../helpers/projection';
import { IAppContainerProps } from '../common/AppContainer';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { ProposalResultDto } from '../../interfaces/models/dtos/Season/Creation/ProposalResultDto';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { teamBuilder } from '../../helpers/builders/teams';

describe('ReviewProposalsFloatingDialog', () => {
    let context: TestContext;
    let next: boolean;
    let previous: boolean;
    let visibleDivision: string | null;

    async function onPrevious() {
        previous = true;
    }
    async function onNext() {
        next = true;
    }
    async function changeVisibleDivision(id: string) {
        visibleDivision = id;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        previous = false;
        next = false;
        visibleDivision = null;
    });

    async function renderComponent(
        appContainerProps: IAppContainerProps,
        props: IReviewProposalsFloatingDialogProps,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appContainerProps,
            <ReviewProposalsFloatingDialog {...props} />,
        );
    }

    function getProposalResult(divisions: DivisionDto[]): ProposalResultDto {
        return {
            divisions: divisions.map((d: DivisionDto): DivisionDataDto => {
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
        };
    }

    describe('renders', () => {
        const division1: DivisionDto = divisionBuilder('DIVISION 1').build();
        const division2: DivisionDto = divisionBuilder('DIVISION 2').build();
        const division3: DivisionDto = divisionBuilder('DIVISION 3').build();
        const teamA: TeamDto = teamBuilder('TEAM A').build();
        const teamB: TeamDto = teamBuilder('TEAM B').build();
        const teamC: TeamDto = teamBuilder('TEAM C').build();
        const teamD: TeamDto = teamBuilder('TEAM D').build();

        it('all proposed divisions in dropdown in order', async () => {
            await renderComponent(
                appProps({
                    divisions: [division1, division2, division3],
                }),
                {
                    proposalResult: getProposalResult([division2, division1]),
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            const divisionDropdown = context.required('.dropdown-menu');
            expect(
                divisionDropdown.all('.dropdown-item').map((li) => li.text()),
            ).toEqual(['DIVISION 1', 'DIVISION 2']);
        });

        it('placeholder mappings', async () => {
            const proposalResult = getProposalResult([division2, division1]);
            proposalResult.template!.sharedAddresses = [['A', 'B']];
            proposalResult.template!.divisions![0].sharedAddresses = [
                ['B', 'C'],
            ];
            proposalResult.template!.divisions![0].dates = [
                {
                    fixtures: [
                        { home: 'A' },
                        { home: 'C', away: 'D' },
                        { home: 'B' },
                    ],
                },
            ];
            proposalResult.placeholderMappings = {
                A: teamA,
                B: teamB,
                C: teamC,
                D: teamD,
            };

            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                }),
                {
                    proposalResult,
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            const placeholderItems = toDictionary(
                context.all('ul li'),
                (li: IComponent) => li.required('span').text(),
            );
            expect(Object.keys(placeholderItems)).toEqual(['A', 'B', 'C', 'D']);
            expect(placeholderItems['A'].text()).toEqual('A → TEAM A');
            expect(placeholderItems['B'].text()).toEqual('B → TEAM B');
            expect(placeholderItems['C'].text()).toEqual('C → TEAM C');
            expect(placeholderItems['D'].text()).toEqual('D → TEAM D');

            expect(
                placeholderItems['A'].required('span').className(),
            ).toContain('bg-warning');
            expect(
                placeholderItems['B'].required('span').className(),
            ).toContain('bg-warning bg-secondary text-light');
            expect(
                placeholderItems['C'].required('span').className(),
            ).toContain('bg-secondary text-light');
            expect(
                placeholderItems['D'].required('span').className(),
            ).not.toContain('bg-');
        });

        it('placeholder mappings when more placeholders in template than division', async () => {
            const proposalResult = getProposalResult([division2, division1]);
            proposalResult.template!.sharedAddresses = [['A', 'B']];
            proposalResult.template!.divisions![0].sharedAddresses = [
                ['B', 'C'],
            ];
            proposalResult.template!.divisions![0].dates = [
                {
                    fixtures: [
                        { home: 'A' },
                        { home: 'C', away: 'D' },
                        { home: 'B' },
                        { home: 'E', away: 'F' },
                    ],
                },
            ];
            proposalResult.placeholderMappings = {
                A: teamA,
                B: teamB,
                C: teamC,
                D: teamD,
            };

            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                }),
                {
                    proposalResult,
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            const placeholderItems = toDictionary(
                context.all('ul li'),
                (li: IComponent) => li.required('span').text(),
            );
            expect(Object.keys(placeholderItems)).toEqual(['A', 'B', 'C', 'D']);
            expect(placeholderItems['A'].text()).toEqual('A → TEAM A');
            expect(placeholderItems['B'].text()).toEqual('B → TEAM B');
            expect(placeholderItems['C'].text()).toEqual('C → TEAM C');
            expect(placeholderItems['D'].text()).toEqual('D → TEAM D');

            expect(
                placeholderItems['A'].required('span').className(),
            ).toContain('bg-warning');
            expect(
                placeholderItems['B'].required('span').className(),
            ).toContain('bg-warning bg-secondary text-light');
            expect(
                placeholderItems['C'].required('span').className(),
            ).toContain('bg-secondary text-light');
            expect(
                placeholderItems['D'].required('span').className(),
            ).not.toContain('bg-');
        });

        it('link to template', async () => {
            const proposalResult = getProposalResult([division1]);
            const templateId = proposalResult!.template!.id;

            await renderComponent(
                appProps({
                    divisions: [division1],
                }),
                {
                    proposalResult,
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            const linkToTemplate = context.required('p a');
            expect(linkToTemplate.text()).toEqual('TEMPLATE');
            expect(linkToTemplate.element<HTMLAnchorElement>().href).toEqual(
                'http://localhost/admin/templates/?select=' + templateId,
            );
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();

        it('can change division', async () => {
            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                }),
                {
                    proposalResult: getProposalResult([division2, division1]),
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            await context.required('.dropdown-menu').select('DIVISION 2');

            expect(visibleDivision).toEqual(division2.id);
        });

        it('can navigate back', async () => {
            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                }),
                {
                    proposalResult: getProposalResult([division2, division1]),
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            await context.button('Back').click();

            expect(previous).toEqual(true);
        });

        it('can navigate forward', async () => {
            await renderComponent(
                appProps({
                    divisions: [division1, division2],
                }),
                {
                    proposalResult: getProposalResult([division2, division1]),
                    selectedDivisionId: division1.id,
                    changeVisibleDivision,
                    onNext,
                    onPrevious,
                },
            );

            await context.button('Save all fixtures').click();

            expect(next).toEqual(true);
        });
    });
});
