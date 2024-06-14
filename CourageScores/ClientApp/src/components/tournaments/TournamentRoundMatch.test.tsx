import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp, TestContext
} from "../../helpers/tests";
import {any, toMap} from "../../helpers/collections";
import {ITournamentRoundMatchProps, TournamentRoundMatch} from "./TournamentRoundMatch";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {
    roundBuilder,
    sideBuilder,
    tournamentBuilder,
    tournamentMatchBuilder
} from "../../helpers/builders/tournaments";
import {playerBuilder} from "../../helpers/builders/players";
import {matchOptionsBuilder} from "../../helpers/builders/games";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";

describe('TournamentRoundMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedRound: TournamentRoundDto;
    let saygApiData: { [id: string]: RecordedScoreAsYouGoDto };
    const tournamentApi = api<ITournamentGameApi>({
    });
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null>  => {
            return saygApiData[id];
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        saygApiData = {};
        reportedError = new ErrorState();
        updatedRound = null;
    });

    async function setTournamentData() {
    }

    async function saveTournament(): Promise<TournamentGameDto> {
        return null;
    }

    async function onMatchOptionsChanged(_: GameMatchOptionDto) {
    }

    async function onChange(updated: TournamentRoundDto) {
        updatedRound = updated;
    }

    function setPreventScroll(_: boolean) {
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: ITournamentRoundMatchProps, account?: UserDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({
                account
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <TournamentRoundMatch {...props} />
            </TournamentContainer>),
            null,
            null,
            'tbody');
    }

    function assertDropdown(cell: Element, selected: string, optionsText: string[]) {
        const dropdownToggle = cell.querySelector('.dropdown-toggle');
        expect(dropdownToggle).toBeTruthy();
        expect(dropdownToggle.textContent).toEqual(selected);

        const options = Array.from(cell.querySelectorAll('.dropdown-item'));
        expect(options.map(o => o.textContent)).toEqual(optionsText);
    }

    function assertScore(cell: Element, expectedScore: string) {
        expect(cell.textContent).toEqual(expectedScore);
    }

    describe('renders', () => {
        const sideA: TournamentSideDto = sideBuilder('SIDE A').build();
        const sideB: TournamentSideDto = sideBuilder('SIDE B').build();
        const sideC: TournamentSideDto = sideBuilder('SIDE C').build();
        const sideD: TournamentSideDto = sideBuilder('SIDE D').build();
        const sideE: TournamentSideDto = sideBuilder('SIDE E').build();
        let returnFromExceptSelected: {};
        const exceptSelected = (side: TournamentSideDto, _: number, sideName: string) => {
            const exceptSides: TournamentSideDto[] = returnFromExceptSelected[sideName];
            if (!exceptSides) {
                return true;
            }
            return !any(exceptSides, (s: TournamentSideDto) => s.name === side.name);
        };

        beforeEach(() => {
            returnFromExceptSelected = {};
        });

        describe('when logged out', () => {
            const account = null;
            const defaultTournamentContainerProps: ITournamentContainerProps = {
                tournamentData: tournamentBuilder().build(),
                saveTournament,
                setTournamentData,
                preventScroll: false,
                setPreventScroll,
            };

            it('when has next round', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [match]
                    },
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('1');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('2');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('when has next round and no scores', async () => {
                const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('sideA winner', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 2).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: matchOptionsBuilder().numberOfLegs(5).build(),
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].className).toContain('bg-winner');
                expect(cells[1].className).toContain('bg-winner');
                expect(cells[3].className).not.toContain('bg-winner');
                expect(cells[4].className).not.toContain('bg-winner');
            });

            it('sideA outright winner shows 0 value score for sideB', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 0).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[1].textContent).toEqual('3');
                expect(cells[3].textContent).toEqual('0');
            });

            it('sideB winner', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 2).sideB(sideB, 3).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: matchOptionsBuilder().numberOfLegs(5).build(),
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].className).not.toContain('bg-winner');
                expect(cells[1].className).not.toContain('bg-winner');
                expect(cells[3].className).toContain('bg-winner');
                expect(cells[4].className).toContain('bg-winner');
            });

            it('sideB outright winner shows 0 value score for sideA', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 3).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[1].textContent).toEqual('0');
                expect(cells[3].textContent).toEqual('3');
            });

            it('when no next round', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('1');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('2');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('cannot open sayg if not exists', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).not.toContain('📊');
            });
        });

        describe('when logged in', () => {
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: {
                    manageTournaments: true,
                    recordScoresAsYouGo: true,
                }
            };
            const defaultTournamentContainerProps: ITournamentContainerProps = {
                tournamentData: tournamentBuilder().build(),
                saveTournament,
                setTournamentData,
                preventScroll: false,
                setPreventScroll,
            };

            it('when no next round', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                returnFromExceptSelected['sideA'] = [sideC, sideD];
                returnFromExceptSelected['sideB'] = [sideD, sideE];

                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertDropdown(cells[0], 'SIDE A', ['SIDE A', 'SIDE B', 'SIDE E']);
                assertScore(cells[1], '1');
                expect(cells[2].textContent).toEqual('vs');
                assertScore(cells[3], '2');
                assertDropdown(cells[4], 'SIDE B', ['SIDE A', 'SIDE B', 'SIDE C']);
            });

            it('can open match options', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[5].textContent).toContain('🛠');
            });

            it('sideA outright winner shows 0 value score for sideB', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 0).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertScore(cells[1], '3');
                assertScore(cells[3], '0');
            });

            it('sideB outright winner shows 0 value score for sideA', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 3).build();
                await renderComponent(defaultTournamentContainerProps, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                    onChange,
                    onMatchOptionsChanged,
                }, account);

                reportedError.verifyNoError();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertScore(cells[1], '0');
                assertScore(cells[3], '3');
            });
        });
    });

    describe('interactivity', () => {
        const playerSideA: TeamPlayerDto = playerBuilder('PLAYER SIDE A').build();
        const playerSideB: TeamPlayerDto = playerBuilder('PLAYER SIDE B').build();
        const sideA: TournamentSideDto = sideBuilder('SIDE A').withPlayer(playerSideA).build();
        const sideB: TournamentSideDto = sideBuilder('SIDE B').withPlayer(playerSideB).build();
        const sideC: TournamentSideDto = sideBuilder('SIDE C')
            .withPlayer(playerSideA)
            .withPlayer(playerSideB)
            .build();
        const sideD: TournamentSideDto = sideBuilder('SIDE D')
            .withPlayer(playerSideA)
            .withPlayer(playerSideB)
            .build();
        const sideE: TournamentSideDto = sideBuilder('SIDE E').build();
        let returnFromExceptSelected: {};
        const exceptSelected = (side: TournamentSideDto, _: number, sideName: string) => {
            const exceptSides: TournamentSideDto[] = returnFromExceptSelected[sideName];
            if (!exceptSides) {
                return true;
            }
            return !any(exceptSides, (s: TournamentSideDto) => s.name === side.name);
        };
        const account: UserDto = {
            givenName: '',
            emailAddress: '',
            name: '',
            access: {
                manageTournaments: true,
                recordScoresAsYouGo: true,
            }
        };
        const defaultTournamentContainerProps: ITournamentContainerProps = {
            tournamentData: tournamentBuilder().build(),
            saveTournament,
            setTournamentData,
            preventScroll: false,
            setPreventScroll,
        };

        beforeEach(() => {
            returnFromExceptSelected = {};
            console.log = noop;
        });

        it('can open match options dialog', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doClick(findButton(cells[5], '🛠'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit match options');
        });

        it('can close match options dialog', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[5], '🛠'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can change A side', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[0].querySelector('.dropdown-menu'), 'SIDE C');

            reportedError.verifyNoError();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {sideA: sideC})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can change B side', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[4].querySelector('.dropdown-menu'), 'SIDE C');

            reportedError.verifyNoError();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {sideB: sideC})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can remove a match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return true;
            };

            await doClick(findButton(cells[5], '🗑'));

            reportedError.verifyNoError();
            expect(confirm).toEqual('Are you sure you want to remove this match?');
            expect(updatedRound).toEqual({
                matches: [],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('does not remove a match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent(defaultTournamentContainerProps, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
                onChange,
                onMatchOptionsChanged,
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return false;
            };

            await doClick(findButton(cells[5], '🗑'));

            reportedError.verifyNoError();
            expect(confirm).toEqual('Are you sure you want to remove this match?');
            expect(updatedRound).toBeNull();
        });
    });
});