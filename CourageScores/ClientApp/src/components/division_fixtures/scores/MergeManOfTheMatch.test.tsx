import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {IMergeManOfTheMatchProps, MergeManOfTheMatch} from "./MergeManOfTheMatch";
import {playerBuilder} from "../../../helpers/builders/players";
import {IGameDto} from "../../../interfaces/serverSide/Game/IGameDto";
import {ITeamPlayerDto} from "../../../interfaces/serverSide/Team/ITeamPlayerDto";

describe('MergeManOfTheMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: IGameDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
    });

    async function setData(data: IGameDto) {
        updatedData = data;
    }

    async function renderComponent(props: IMergeManOfTheMatchProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MergeManOfTheMatch {...props} />),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        const player: ITeamPlayerDto = playerBuilder('MOM').build();
        const allPlayers: ITeamPlayerDto[] = [player];

        it('when home merged', async () => {
            const data: IGameDto = {
                home: {
                    name: 'HOME',
                    manOfTheMatch: player.id,
                },
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Merged');
        });

        it('when away merged', async () => {
            const data: IGameDto = {
                home: { name: 'HOME' },
                away: {
                    name: 'AWAY',
                    manOfTheMatch: player.id,
                },
                homeSubmission: {
                    home: { name: 'HOME' },
                    away: { name: 'AWAY '},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Merged');
        });

        it('when nothing to merge for home', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Nothing to merge');
        });

        it('when nothing to merge for away', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Nothing to merge');
        });

        it('when home unmerged', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {
                        name: 'HOME',
                        manOfTheMatch: player.id
                    },
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Use MOM');
        });

        it('when away unmerged', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {
                        name: 'AWAY',
                        manOfTheMatch: player.id
                    },
                    address: '',
                },
                address: '',
            };

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Use MOM');
        });
    });

    describe('interactivity', () => {
        const player = playerBuilder('MOM').build();
        const allPlayers = [player];

        it('can change home man of match', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {
                        name: 'HOME',
                        manOfTheMatch: player.id
                    },
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                address: '',
            };
            await renderComponent({ data, allPlayers, setData });

            await doClick(findButton(context.container.querySelector('td:nth-child(1)'), 'Use MOM'));

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).not.toBeNull();
            expect(updatedData.home.manOfTheMatch).toEqual(player.id);
        });

        it('can change away man of match', async () => {
            const data: IGameDto = {
                home: {name: 'HOME'},
                away: {name: 'AWAY'},
                homeSubmission: {
                    home: {name: 'HOME'},
                    away: {name: 'AWAY'},
                    address: '',
                },
                awaySubmission: {
                    home: {name: 'HOME'},
                    away: {
                        name: 'AWAY',
                        manOfTheMatch: player.id
                    },
                    address: '',
                },
                address: '',
            };
            await renderComponent({ data, allPlayers, setData });

            await doClick(findButton(context.container.querySelector('td:nth-child(3)'), 'Use MOM'));

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).not.toBeNull();
            expect(updatedData.away.manOfTheMatch).toEqual(player.id);
        });
    })
});