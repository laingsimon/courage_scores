// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick, findButton} from "../../../helpers/tests";
import {createTemporaryId} from "../../../helpers/projection";
import {MergeHiCheckAnd180s} from "./MergeHiCheckAnd180s";

describe('MergeHiCheckAnd180s', () => {
    let context;
    let reportedError;
    let updatedData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(data, fixtureData) {
        reportedError = null;
        updatedData = null;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<MergeHiCheckAnd180s
                data={data}
                fixtureData={fixtureData}
                setFixtureData={(data) => updatedData = data} />),
            null,
            null,
            'tbody');
    }

    describe('one eighties', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                        }],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const homeSubmission = oneEightiesCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from HOME');
                const oneEighties = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual([ 'NAME' ]);
            });

            it('when away submissions not merged', async () => {
                const data = {
                    homeSubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                        }],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const awaySubmission = oneEightiesCell.querySelector('div > div:nth-child(1)');
                expect(awaySubmission).toBeTruthy();
                expect(awaySubmission.textContent).toContain('from AWAY');
                const oneEighties = Array.from(awaySubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual([ 'NAME' ]);
            });

            it('when home and away submissions not present', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const submissions = oneEightiesCell.querySelectorAll('div');
                expect(submissions.length).toEqual(0);
            });

            it('when submissions merged', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'HOME NAME',
                        }],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'AWAY NAME',
                        }],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [{
                        id: createTemporaryId(),
                        name: 'MERGED'
                    }],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const submissions = oneEightiesCell.querySelectorAll('div');
                expect(submissions.length).toEqual(0);
            });

            it('when no home submission', async () => {
                const data = {
                    homeSubmission: null,
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                        }],
                        over100Checkouts: [],
                    },
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(1);
            });

            it('when no away submission', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                        }],
                        over100Checkouts: [],
                    },
                    awaySubmission: null,
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(1);
            });

            it('when no submissions', async () => {
                const data = {
                    homeSubmission: null,
                    awaySubmission: null,
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(0);
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = {
                    id: createTemporaryId(),
                    name: 'NAME',
                };
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [player],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };
                await renderComponent(data, fixtureData);
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                const submission = oneEightiesCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = {
                    id: createTemporaryId(),
                    name: 'NAME',
                };
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [player],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };
                await renderComponent(data, fixtureData);
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                const submission = oneEightiesCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });
        });
    });

    describe('hi-checks', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                            notes: '120',
                        }],
                    },
                    awaySubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const homeSubmission = hiChecksCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from HOME');
                const hiChecks = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual([ 'NAME (120)' ]);
            });

            it('when away submissions not merged', async () => {
                const data = {
                    homeSubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                            notes: '120',
                        }],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const homeSubmission = hiChecksCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from AWAY');
                const hiChecks = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual([ 'NAME (120)' ]);
            });

            it('when home and away submissions not present', async () => {
                const data = {
                    homeSubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const submissions = hiChecksCell.querySelectorAll('div > div');
                expect(submissions.length).toEqual(0);
            });

            it('when submissions merged', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'HOME NAME',
                            notes: '120',
                        }],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'AWAY NAME',
                            notes: '120',
                        }],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [{
                        id: createTemporaryId(),
                        name: 'MERGED',
                        notes: '120',
                    }],
                };

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const submissions = hiChecksCell.querySelectorAll('div > div');
                expect(submissions.length).toEqual(0);
            });

            it('when no home submission', async () => {
                const data = {
                    homeSubmission: null,
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                            notes: '100',
                        }],
                    },
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(1);
            });

            it('when no away submission', async () => {
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [{
                            id: createTemporaryId(),
                            name: 'NAME',
                            notes: 100,
                        }],
                    },
                    awaySubmission: null,
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(1);
            });

            it('when no submissions', async () => {
                const data = {
                    homeSubmission: null,
                    awaySubmission: null,
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(0);
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = {
                    id: createTemporaryId(),
                    name: 'NAME',
                    notes: '120',
                };
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [player],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };
                await renderComponent(data, fixtureData);
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                const submission = hiChecksCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = {
                    id: createTemporaryId(),
                    name: 'NAME',
                    notes: '120',
                };
                const data = {
                    homeSubmission: {
                        editor: 'HOME',
                        oneEighties: [],
                        over100Checkouts: [],
                    },
                    awaySubmission: {
                        editor: 'AWAY',
                        oneEighties: [],
                        over100Checkouts: [player],
                    }
                };
                const fixtureData = {
                    oneEighties: [],
                    over100Checkouts: [],
                };
                await renderComponent(data, fixtureData);
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                const submission = hiChecksCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });
        });
    })
});