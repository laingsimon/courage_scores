import {ISaygLoadingContainerProps, SaygLoadingContainer} from "./SaygLoadingContainer";
import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange, doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {createTemporaryId} from "../../helpers/projection";
import {
    CHECKOUT_1_DART,
    CHECKOUT_2_DART,
    CHECKOUT_3_DART,
    DELETE_SCORE_BUTTON,
    ENTER_SCORE_BUTTON
} from "../../helpers/constants";
import {checkoutWith, enterScores, keyPad, playsFirst} from "../../helpers/sayg";

describe('SaygIntegrationTest', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygData: { [key: string]: RecordedScoreAsYouGoDto };
    let apiResultFunc: ((data: UpdateRecordedScoreAsYouGoDto) => IClientActionResultDto<RecordedScoreAsYouGoDto>);

    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            return saygData[id];
        },
        upsert: async (data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            if (!data.id) {
                data.id = createTemporaryId();
            }
            saygData[data.id] = data as RecordedScoreAsYouGoDto;
            return apiResultFunc(data);
        },
        delete: async (id: string): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            delete saygData[id];
            return {
                success: true,
            };
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saygData = {};
        apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto) => {
            return {
                result: data,
                success: true,
            } as IClientActionResultDto<RecordedScoreAsYouGoDto>
        };
    });

    async function renderComponent(props: ISaygLoadingContainerProps, account?: UserDto) {
        context = await renderApp(
            iocProps({ saygApi }),
            brandingProps(),
            appProps({account}, reportedError),
            <SaygLoadingContainer {...props} />);
    }

    function assertWaitingForScoreFor(side: string) {
        const element = context.container.querySelector('div[datatype="current-player"]');
        expect(element.textContent).toContain(side);
    }

    describe('when unstarted', () => {
        let sayg: UpdateRecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .opponentName('OPPONENT')
                .scores(0, 0)
                .numberOfLegs(5)
                .startingScore(501)
                .addTo(saygData)
                .build();

            apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto): IClientActionResultDto<RecordedScoreAsYouGoDto> => {
                sayg = data;
                return {
                    result: data,
                    success: true,
                } as IClientActionResultDto<RecordedScoreAsYouGoDto>
            };
        });

        it('can load two player details', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            expect(context.container.textContent).toContain('CONTENDER');
            expect(context.container.textContent).toContain('OPPONENT');
        });

        it('can load single player details', async () => {
            sayg.opponentName = null;

            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            expect(context.container.textContent).toContain('CONTENDER');
        });

        it('asks who should start', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            expect(context.container.textContent).toContain('Who plays first?');
            const buttons = Array.from(context.container.querySelectorAll('div[datatype="bull-up"] button.btn-primary'));
            expect(buttons.map(b => b.textContent)).toEqual([
                '🎯CONTENDER',
                '🎯OPPONENT'
            ]);
            await playsFirst(context, 'CONTENDER');
            expect(sayg.legs[0].playerSequence).toEqual([
                { text: 'CONTENDER', value: 'home' },
                { text: 'OPPONENT', value: 'away' } ]);
        });

        it('does not ask who should start for single-player matches', async () => {
            sayg.opponentName = null;

            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            expect(context.container.textContent).not.toContain('Who plays first?');
        });

        it('shows first home score in the player score card as entered', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            await playsFirst(context, 'CONTENDER');
            await keyPad(context, [ '1', '2', '0' ]);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            expect(previousScores.length).toEqual(1);
            expect(Array.from(Array.from(previousScores[0].querySelectorAll('div')).map(d => d.textContent))).toEqual(['120', '381', '3', '', '']);
        });

        it('shows first away score in the player score card as entered', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            await playsFirst(context, 'CONTENDER');
            await keyPad(context, [ '1', '2', '0', ENTER_SCORE_BUTTON ]); // home
            await keyPad(context, [ '2', '6', ENTER_SCORE_BUTTON ]); // away

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            expect(previousScores.length).toEqual(1);
            expect(Array.from(Array.from(previousScores[0].querySelectorAll('div')).map(d => d.textContent))).toEqual(['120', '381', '3', '26', '475']);
        });

        it('allows first score to be recorded via key pad', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            await playsFirst(context, 'CONTENDER');
            await keyPad(context, [ '1', '2', '0', ENTER_SCORE_BUTTON ]);

            expect(sayg.legs[0].home.throws).toEqual([{
                score: 120,
                bust: false,
                noOfDarts: 3
            }]);
        });

        it('switches to second player after first', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            await playsFirst(context, 'CONTENDER');
            await enterScores(context, [
                120, // 120 (381)
                120, // 240 (261)
                120, // 360 (141)
                121, // 481 (20)
                20, // 501 (0)
            ], [ 10, 10, 10, 10 ]);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[0].winner).toEqual('home');
            expect(sayg.legs[1].currentThrow).toEqual('away');
        });

        it('does switch to second player if single player', async () => {
            sayg.opponentName = null;
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            await enterScores(context, [
                120, // 120 (381)
                120, // 240 (261)
                120, // 360 (141)
                121, // 481 (20)
                20, // 501 (0)
            ], [ ]);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[0].winner).toEqual('home');
            expect(sayg.legs[1].currentThrow).toEqual('home');
        });
    });

    describe('when incomplete', () => {
        let sayg: UpdateRecordedScoreAsYouGoDto;

        const checkoutScores: number[] = [
            120, // 120 (381)
            120, // 240 (261)
            120, // 360 (141)
            121, // 481 (20)
            20, // 501 (0)
        ];
        const nonCheckoutScores: number[] = [ 10, 10, 10, 10 ];

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .opponentName('OPPONENT')
                .numberOfLegs(5)
                .startingScore(501)
                .scores(0, 0)
                .withLeg(0, (l: ILegBuilder) => l
                    .playerSequence('away', 'home')
                    .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .startingScore(501)
                    .currentThrow('away'))
                .addTo(saygData)
                .build();

            apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto): IClientActionResultDto<RecordedScoreAsYouGoDto> => {
                sayg = data;
                return {
                    result: data,
                    success: true,
                } as IClientActionResultDto<RecordedScoreAsYouGoDto>
            };
        });

        it('can load details', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            assertWaitingForScoreFor('OPPONENT');
        });

        it('records a checkout with 1 dart', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await checkoutWith(context, CHECKOUT_1_DART);

            expect(sayg.legs[0].winner).toEqual('away');
            expect(sayg.legs[1].currentThrow).toEqual('home');
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(1);
        });

        it('records a checkout with 2 darts', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[0].winner).toEqual('away');
            expect(sayg.legs[1].currentThrow).toEqual('home');
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(1);
        });

        it('records a checkout with 3 darts', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await checkoutWith(context, CHECKOUT_3_DART);

            expect(sayg.legs[0].winner).toEqual('away');
            expect(sayg.legs[1].currentThrow).toEqual('home');
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(1);
        });

        it('can close the checkout dialog', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await doClick(findButton(context.container, 'Close'));

            expect(sayg.legs[0].currentThrow).toEqual('away');
            expect(sayg.legs[0].away.throws.reduce((total, thr) => total + thr.score, 0)).toEqual(481);
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(0);
        });

        it('can close the checkout dialog and re-checkout', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await doClick(findButton(context.container, 'Close'));
            await keyPad(context, [ '2', '0', ENTER_SCORE_BUTTON ]);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[1].currentThrow).toEqual('home');
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(1);
        });

        it('asks who should start final leg', async () => {
            sayg.numberOfLegs = 3;

            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores); // leg1: opponent starts & wins
            await checkoutWith(context, CHECKOUT_3_DART); // leg1: opponent checks out with 3 darts
            expect(sayg.homeScore).toEqual(0);
            expect(sayg.awayScore).toEqual(1);
            await enterScores(context, checkoutScores, nonCheckoutScores); // leg2: contender starts & wins
            await checkoutWith(context, CHECKOUT_3_DART); // leg2: contender checks out with 3 darts
            expect(sayg.homeScore).toEqual(1);
            expect(sayg.awayScore).toEqual(1);

            expect(context.container.textContent).toContain('Who won the bull?');
            const buttons = Array.from(context.container.querySelectorAll('div[datatype="bull-up"] button.btn-primary'));
            expect(buttons.map(b => b.textContent)).toEqual([
                '🎯CONTENDER',
                '🎯OPPONENT'
            ]);
        });

        it('records who plays the final leg after up for the bull', async () => {
            sayg.numberOfLegs = 3;

            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });

            // opponent first
            await enterScores(context, checkoutScores, nonCheckoutScores); // leg1: opponent starts & wins
            await checkoutWith(context, CHECKOUT_3_DART); // leg1: opponent checks out with 3 darts
            await enterScores(context, checkoutScores, nonCheckoutScores); // leg2: contender starts & wins
            await checkoutWith(context, CHECKOUT_3_DART); // leg2: contender checks out with 3 darts
            await playsFirst(context, 'CONTENDER');

            expect(sayg.legs[2].currentThrow).toEqual('home'); // contender plays first in the 3rd leg
        });
    });

    describe('when completed', () => {
        let sayg: UpdateRecordedScoreAsYouGoDto;

        function buildLeg(l: ILegBuilder, startingWith: string, winner: string): ILegBuilder {
            const second = startingWith === 'home' ? 'away' : 'home';

            return l.playerSequence(startingWith, second)
                .home((c: ILegCompetitorScoreBuilder) => c
                    .score(winner === 'home' ? 501 : 300)
                    .noOfDarts(15)
                    .withThrow(winner === 'home' ? 100 : 1, false, 3)
                    .withThrow(winner === 'home' ? 100 : 2, false, 3)
                    .withThrow(winner === 'home' ? 100 : 3, false, 3)
                    .withThrow(winner === 'home' ? 100 : 4, false, 3)
                    .withThrow(winner === 'home' ? 101 : 5, false, 3))
                .away((c: ILegCompetitorScoreBuilder) => c
                    .score(winner === 'away' ? 501 : 300)
                    .noOfDarts(15)
                    .withThrow(winner === 'away' ? 100 : 6, false, 3)
                    .withThrow(winner === 'away' ? 100 : 7, false, 3)
                    .withThrow(winner === 'away' ? 100 : 8, false, 3)
                    .withThrow(winner === 'away' ? 100 : 9, false, 3)
                    .withThrow(winner === 'away' ? 101 : 10, false, 3))
                .startingScore(501)
                .winner(winner)
        }

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .opponentName('OPPONENT')
                .numberOfLegs(5)
                .startingScore(501)
                .scores(1, 3)
                .withLeg(0, (l: ILegBuilder) => buildLeg(l, 'home', 'home'))
                .withLeg(1, (l: ILegBuilder) => buildLeg(l, 'away', 'away'))
                .withLeg(2, (l: ILegBuilder) => buildLeg(l, 'home', 'away'))
                .withLeg(2, (l: ILegBuilder) => buildLeg(l, 'away', 'away'))
                .addTo(saygData)
                .build();

            apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto): IClientActionResultDto<RecordedScoreAsYouGoDto> => {
                sayg = data;
                return {
                    result: data,
                    success: true,
                } as IClientActionResultDto<RecordedScoreAsYouGoDto>
            };
        });

        it('presents statistics for two player', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            expect(context.container.textContent).toContain('Match statistics');
            const headerCells = Array.from(context.container.querySelectorAll('.table thead tr th'));
            expect(headerCells.map(th => th.textContent)).toEqual([ '', 'CONTENDER', 'OPPONENT' ]);
            const rows = Array.from(context.container.querySelectorAll('.table tbody tr'));
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual([ 'Score', '1', '3']);
            expect(rows[1].textContent).toContain('Leg: 1Winner: CONTENDER');
            expect(rows[1].textContent).toContain('Checkout: 101');
            expect(rows[1].textContent).toContain('Remaining: 201');
            expect(rows[2].textContent).toContain('Leg: 2Winner: OPPONENT');
            expect(rows[2].textContent).toContain('Checkout: 101');
            expect(rows[2].textContent).toContain('Remaining: 201');
        });

        it('presents statistics for single player', async () => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .numberOfLegs(3)
                .startingScore(501)
                .scores(3)
                .withLeg(0, (l: ILegBuilder) => buildLeg(l, 'home', 'home'))
                .withLeg(1, (l: ILegBuilder) => buildLeg(l, 'home', 'home'))
                .withLeg(2, (l: ILegBuilder) => buildLeg(l, 'home', 'home'))
                .addTo(saygData)
                .build();
            await renderComponent({
                id: sayg.id,
                liveOptions: {}
            });

            expect(context.container.textContent).toContain('Match statistics');
            const headerRows = Array.from(context.container.querySelectorAll('.table thead tr'));
            expect(headerRows.length).toEqual(0);
            const rows = Array.from(context.container.querySelectorAll('.table tbody tr'));
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual([ 'Score', '3']);
            expect(rows[1].textContent).toContain('Leg: 1');
            expect(rows[1].textContent).toContain('Checkout: 101');
            expect(rows[2].textContent).toContain('Leg: 2');
            expect(rows[2].textContent).toContain('Checkout: 101');
        });

        describe('when permitted', () => {
            const account: UserDto = {
                givenName: '',
                emailAddress: '',
                name: '',
                access: {
                    recordScoresAsYouGo: true,
                },
            };
            let dialog: HTMLDivElement;

            beforeEach(async () => {
                await renderComponent({
                    id: sayg.id,
                    liveOptions: {}
                }, account);
                const rows = Array.from(context.container.querySelectorAll('.table tbody tr'));
                const firstLegRow = rows[1];
                await doClick(firstLegRow.querySelector('input[name="showThrows"]'));
                const throws = Array.from(firstLegRow.querySelectorAll('table.table-sm tbody tr'));
                const firstThrowCells = Array.from(throws[0].querySelectorAll('td'));
                await doClick(firstThrowCells[0]);
                dialog = context.container.querySelector('.modal-dialog');
                expect(dialog).not.toBeNull();
                expect(dialog.textContent).toContain('Edit throw 1 for CONTENDER');
            });

            it('can change number of darts', async () => {
                expect(sayg.legs[0].home.throws[0].noOfDarts).toEqual(3);

                await doChange(dialog, 'input[name="noOfDarts"]', '2', context.user);
                await doClick(findButton(dialog, 'Save changes'));

                expect(sayg.legs[0].home.throws[0].noOfDarts).toEqual(2);
            });

            it('can change score', async () => {
                expect(sayg.legs[0].home.throws[0].score).toEqual(100);

                await doChange(dialog, 'input[name="score"]', '99', context.user);
                await doClick(findButton(dialog, 'Save changes'));

                expect(sayg.legs[0].home.throws[0].score).toEqual(99);
            });

            it('can change bust', async () => {
                expect(sayg.legs[0].home.throws[0].bust).toEqual(false);

                await doClick(dialog, 'input[name="bust"]');
                await doClick(findButton(dialog, 'Save changes'));

                expect(sayg.legs[0].home.throws[0].bust).toEqual(true);
            });
        });

        describe('when not permitted', () => {
            const account: UserDto = {
                givenName: '',
                emailAddress: '',
                name: '',
                access: {
                    recordScoresAsYouGo: false,
                },
            };
            let firstThrowCells: HTMLTableCellElement[];

            beforeEach(async () => {
                await renderComponent({
                    id: sayg.id,
                    liveOptions: {}
                }, account);
                const rows = Array.from(context.container.querySelectorAll('.table tbody tr'));
                const firstLegRow = rows[1];
                await doClick(firstLegRow.querySelector('input[name="showThrows"]'));
                const throws = Array.from(firstLegRow.querySelectorAll('table.table-sm tbody tr'));
                firstThrowCells = Array.from(throws[0].querySelectorAll('td'));
            });

            it('cannot change throws', async () => {
                await doClick(firstThrowCells[0]);
                const dialog = context.container.querySelector('.modal-dialog');
                expect(dialog).toBeNull();
            });
        });
    });

    describe('corrections', () => {
        let sayg: UpdateRecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .opponentName('OPPONENT')
                .numberOfLegs(5)
                .startingScore(501)
                .scores(0, 0)
                .withLeg(0, (l: ILegBuilder) => l
                    .playerSequence('home', 'away')
                    .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .startingScore(501)
                    .currentThrow('home'))
                .addTo(saygData)
                .build();

            apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto): IClientActionResultDto<RecordedScoreAsYouGoDto> => {
                sayg = data;
                return {
                    result: data,
                    success: true,
                } as IClientActionResultDto<RecordedScoreAsYouGoDto>
            };
        });

        it('shows edited home score in the score card', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].home.throws[1].score).toEqual(101);
            expect(sayg.legs[0].home.score).toEqual(201);
            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(1)').textContent)).toEqual(['100', '101']); // home scores
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(2)').textContent)).toEqual(['401', '300']); // home remaining

            const secondHomeScore = previousScores[1].querySelector('div:first-child'); // home score
            await doClick(secondHomeScore);
            await keyPad(context, ['1', '2', '0']);

            expect(previousScores.map(ps => ps.querySelector('div:nth-child(1)').textContent)).toEqual(['100', '120']); // home scores
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(2)').textContent)).toEqual(['401', '281']); // home remaining
        });

        it('updates following score results as throw is edited', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].home.throws[1].score).toEqual(101);
            expect(sayg.legs[0].home.score).toEqual(201);
            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(1)').textContent)).toEqual(['100', '101']); // home scores
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(2)').textContent)).toEqual(['401', '300']); // home remaining

            const secondHomeScore = previousScores[0].querySelector('div:first-child'); // home score
            await doClick(secondHomeScore);
            await keyPad(context, ['8', '0']);

            expect(previousScores.map(ps => ps.querySelector('div:nth-child(1)').textContent)).toEqual(['80', '101']); // home scores
            expect(previousScores.map(ps => ps.querySelector('div:nth-child(2)').textContent)).toEqual(['421', '320']); // home remaining
        });

        it('can change a previous home score', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].home.throws[1].score).toEqual(101);
            expect(sayg.legs[0].home.score).toEqual(201);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondHomeScore = previousScores[1].querySelector('div:first-child'); // home score
            await doClick(secondHomeScore);
            await keyPad(context, ['1', '2', '0', ENTER_SCORE_BUTTON]);

            expect(sayg.legs[0].home.throws[1].score).toEqual(120);
            expect(sayg.legs[0].home.score).toEqual(220);
        });

        it('can change a previous away score', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].away.throws[1].score).toEqual(51);
            expect(sayg.legs[0].away.score).toEqual(101);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondAwayScore = previousScores[1].querySelector('div:last-child'); // away score
            await doClick(secondAwayScore);
            await keyPad(context, ['6', '2', ENTER_SCORE_BUTTON]);

            expect(sayg.legs[0].away.throws[1].score).toEqual(62);
            expect(sayg.legs[0].away.score).toEqual(112);
        });

        it('can cancel editing a previous home score', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].home.throws[1].score).toEqual(101);
            expect(sayg.legs[0].home.score).toEqual(201);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondHomeScore = previousScores[1].querySelector('div:first-child'); // home score
            await doClick(secondHomeScore);
            await doClick(secondHomeScore);

            expect(sayg.legs[0].home.throws[1].score).toEqual(101);
            expect(sayg.legs[0].home.score).toEqual(201);
        });

        it('can cancel editing a previous away score', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].away.throws[1].score).toEqual(51);
            expect(sayg.legs[0].away.score).toEqual(101);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondAwayScore = previousScores[1].querySelector('div:last-child'); // away score
            await doClick(secondAwayScore);
            await doClick(secondAwayScore);

            expect(sayg.legs[0].away.throws[1].score).toEqual(51);
            expect(sayg.legs[0].away.score).toEqual(101);
        });

        it('bust scores are excluded from total remaining score after edit', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context,
                [180, 180 /*=360*/, 180 /*=540*/, 30 /*=390*/],
                [50, 51, 20]);
            expect(sayg.legs[0].home.throws[2].score).toEqual(180);
            expect(sayg.legs[0].home.throws[2].bust).toEqual(true);
            expect(sayg.legs[0].home.throws[3].score).toEqual(30);
            expect(sayg.legs[0].home.throws[3].bust).toEqual(false);
            expect(sayg.legs[0].home.score).toEqual(390);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const lastHomeScore = previousScores[3].querySelector('div:first-child'); // home score
            await doClick(lastHomeScore);
            await keyPad(context, ['6', '2', ENTER_SCORE_BUTTON]);

            expect(sayg.legs[0].home.throws[3].score).toEqual(62);
            expect(sayg.legs[0].home.score).toEqual(422);
        });

        it('can edit a different previous score', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(context, [100, 101], [50, 51]);
            expect(sayg.legs[0].away.throws[1].score).toEqual(51);
            expect(sayg.legs[0].away.score).toEqual(101);

            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondHomeScore = previousScores[1].querySelector('div:first-child'); // home score
            const secondAwayScore = previousScores[1].querySelector('div:last-child'); // away score
            await doClick(secondHomeScore);
            await doClick(secondAwayScore);
            await keyPad(context, ['6', '2', ENTER_SCORE_BUTTON]);

            expect(sayg.legs[0].away.throws[1].score).toEqual(62);
            expect(sayg.legs[0].away.score).toEqual(112);
        });

        it('asks for checkout darts if correction results in a checkout', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(
                context,
                [100, 101, 100, 100, 10], // 411
                [51, 52, 53, 54]);
            const previousScores = Array.from(context.container.querySelectorAll('div[datatype="previous-scores"] > div'));
            const secondHomeScore = previousScores[4].querySelector('div:first-child'); // home score
            await doClick(secondHomeScore);
            await keyPad(context, ['1', '0', '0', ENTER_SCORE_BUTTON]);
            expect(sayg.legs[0].home.throws[4].score).toEqual(100);
            expect(sayg.legs[0].home.score).toEqual(501);
            expect(context.container.innerHTML).toContain('How many darts to checkout?');

            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[0].winner).toEqual('home');
        });

        it('can change home checkout for previous leg', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(
                context,
                [100, 101, 100, 100, 100], // 501
                [51, 52, 53, 54]);
            await checkoutWith(context, CHECKOUT_3_DART);
            expect(sayg.legs[0].home.throws[4].noOfDarts).toEqual(3);

            const changePrompt = context.container.querySelector('div[datatype="change-checkout"]');
            await doClick(findButton(changePrompt, 'Change'));
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(sayg.legs[0].winner).toEqual('home');
            expect(sayg.legs[0].home.throws[4].noOfDarts).toEqual(2);
        });

        it('cannot change checkout for previous leg after scores recorded', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(
                context,
                [100, 101, 100, 100, 100], // 501
                [51, 52, 53, 54]);
            await checkoutWith(context, CHECKOUT_3_DART);
            expect(sayg.legs[0].home.throws[4].noOfDarts).toEqual(3);

            await keyPad(context, [ '1' ]);

            const changePrompt = context.container.querySelector('div[datatype="change-checkout"]');
            expect(changePrompt).toEqual(null);
        });

        it('can change checkout for previous leg after score entered and then removed', async () => {
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                autoSave: true,
            });
            // contender first
            await enterScores(
                context,
                [100, 101, 100, 100, 100], // 501
                [51, 52, 53, 54]);
            await checkoutWith(context, CHECKOUT_3_DART);
            expect(sayg.legs[0].home.throws[4].noOfDarts).toEqual(3);

            await keyPad(context, [ '1' ]);
            await keyPad(context, [ DELETE_SCORE_BUTTON ]);

            const changePrompt = context.container.querySelector('div[datatype="change-checkout"]');
            expect(changePrompt).toBeTruthy();
        });
    });

    describe('events', () => {
        let sayg: UpdateRecordedScoreAsYouGoDto;

        const checkoutScores: number[] = [
            100, // 100 (401)
            100, // 200 (301)
            100, // 300 (201)
            100, // 400 (101)
            101, // 501 (0) // hi-check
        ];
        const nonCheckoutScores: number[] = [ 10, 10, 10, 10 ];

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('CONTENDER')
                .opponentName('OPPONENT')
                .numberOfLegs(5)
                .startingScore(501)
                .scores(0, 0)
                .withLeg(0, (l: ILegBuilder) => l
                    .playerSequence('home', 'away')
                    .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                    .startingScore(501)
                    .currentThrow('home'))
                .addTo(saygData)
                .build();

            apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto): IClientActionResultDto<RecordedScoreAsYouGoDto> => {
                sayg = data;
                return {
                    result: data,
                    success: true,
                } as IClientActionResultDto<RecordedScoreAsYouGoDto>
            };
        });

        it('reports a 180', async () => {
            const recorded180s: string[] = [];
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                async on180(sideName: string): Promise<any> {
                    recorded180s.push(sideName);
                },
            });

            // contender first
            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            expect(recorded180s).toEqual(['home']);
        });

        it('reports a hi-check', async () => {
            const recordedHiChecks: {sideName: string, score: number}[] = [];
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                async onHiCheck(sideName: string, score: number): Promise<any> {
                    recordedHiChecks.push({sideName, score});
                }
            });

            // contender first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(recordedHiChecks).toEqual([{sideName: 'home', score: 101}]);
        });

        it('reports a leg complete', async () => {
            let newScores: { homeScore: number, awayScore: number };
            await renderComponent({
                id: sayg.id,
                liveOptions: {},
                async onScoreChange(homeScore: number, awayScore: number): Promise<any> {
                    newScores = {
                        homeScore,
                        awayScore
                    };
                }
            });

            // contender first
            await enterScores(context, checkoutScores, nonCheckoutScores);
            await checkoutWith(context, CHECKOUT_2_DART);

            expect(newScores).toEqual({homeScore: 1, awayScore: 0});
        });
    });
});