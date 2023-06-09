// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doChange, renderApp, doClick} from "../../../helpers/tests";
import {GameDetails} from "./GameDetails";

describe('GameDetails', () => {
    let context;
    let reportedError;
    let updatedFixtureData;
    const setFixtureData = (newFixtureData) => {
        updatedFixtureData = newFixtureData;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(saving, access, fixtureData) {
        reportedError = null;
        updatedFixtureData = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: null
            },
            (<GameDetails
                saving={saving}
                access={access}
                fixtureData={fixtureData}
                setFixtureData={setFixtureData} />));
    }

    describe('when not logged in', () => {
        it('when postponed = false and isKnockout=true', async () => {
            const fixtureData = {
                isKnockout: true,
                postponed: false,
                address: 'ADDRESS',
                home: {
                    name: 'HOME'
                },
                away: {
                    name: 'AWAY',
                }
            };

            await renderComponent(false, '', fixtureData);

            const component = context.container;
            expect(component.textContent).toContain('Qualifier at: ADDRESS');
        });

        it('when postponed=true and isKnockout=false', async () => {
            const fixtureData = {
                isKnockout: false,
                postponed: true,
                address: 'ADDRESS',
                home: {
                    name: 'HOME'
                },
                away: {
                    name: 'AWAY',
                }
            };

            await renderComponent(false, '', fixtureData);

            const component = context.container;
            expect(component.textContent).toContain('Playing at: ADDRESSPostponed');
        });

        it('when postponed=true and isKnockout=true', async () => {
            const fixtureData = {
                isKnockout: true,
                postponed: true,
                address: 'ADDRESS',
                home: {
                    name: 'HOME'
                },
                away: {
                    name: 'AWAY',
                }
            };

            await renderComponent(false, '', fixtureData);

            const component = context.container;
            expect(component.textContent).toContain('Qualifier at: ADDRESSPostponed');
        });

        it('when home is unset', async () => {
            const fixtureData = {
                isKnockout: true,
                postponed: true,
                address: 'ADDRESS',
                home: null,
                away: {
                    name: 'AWAY',
                }
            };

            await renderComponent(false, '', fixtureData);

            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeFalsy();
        });

        it('when away is unset', async () => {
            const fixtureData = {
                isKnockout: true,
                postponed: true,
                address: 'ADDRESS',
                home: {
                    name: 'HOME',
                },
                away: null
            };

            await renderComponent(false, '', fixtureData);

            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeFalsy();
        });

        it('when home and away are set', async () => {
            const fixtureData = {
                isKnockout: true,
                postponed: true,
                address: 'ADDRESS',
                home: {
                    name: 'HOME',
                },
                away: {
                    name: 'AWAY',
                }
            };

            await renderComponent(false, '', fixtureData);

            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeTruthy();
            expect(shareButton.textContent).toEqual('🔗');
        });
    });

    describe('when an admin', () => {
        describe('renders', () => {
            it('date', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);

                const input = context.container.querySelector('input[name="date"]');
                expect(input).toBeTruthy();
                expect(input.value).toEqual('2023-04-01');
            });

            it('address', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);

                const input = context.container.querySelector('input[name="address"]');
                expect(input).toBeTruthy();
                expect(input.value).toEqual('ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: true,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);

                const input = context.container.querySelector('input[name="postponed"]');
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('isKnockout', async () => {
                const fixtureData = {
                    isKnockout: true,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);

                const input = context.container.querySelector('input[name="isKnockout"]');
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('accoladesCount', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: true,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: true
                };

                await renderComponent(false, 'admin', fixtureData);

                const input = context.container.querySelector('input[name="accoladesCount"]');
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });
        });

        describe('changes', () => {
            it('date', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);
                await doChange(context.container, 'input[name="date"]', '2023-05-01', context.user);

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.date).toEqual('2023-05-01');
            });

            it('address', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);
                await doChange(context.container, 'input[name="address"]', 'NEW ADDRESS', context.user);

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.address).toEqual('NEW ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: true,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);
                await doClick(context.container, 'input[name="postponed"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.postponed).toEqual(false);
            });

            it('isKnockout', async () => {
                const fixtureData = {
                    isKnockout: true,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: false
                };

                await renderComponent(false, 'admin', fixtureData);
                await doClick(context.container, 'input[name="isKnockout"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.isKnockout).toEqual(false);
            });

            it('accoladesCount', async () => {
                const fixtureData = {
                    isKnockout: false,
                    postponed: false,
                    address: 'ADDRESS',
                    home: {
                        name: 'HOME'
                    },
                    away: {
                        name: 'AWAY',
                    },
                    date: '2023-04-01T20:30:00',
                    accoladesCount: true
                };

                await renderComponent(false, 'admin', fixtureData);
                await doClick(context.container, 'input[name="accoladesCount"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.accoladesCount).toEqual(false);
            });
        });
    });
});