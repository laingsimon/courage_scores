// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, renderApp} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {EditTeamDetails} from "./EditTeamDetails";

describe('EditTeamDetails', () => {
    let context;
    let reportedError;
    let updatedTeam;
    let apiResponse;
    let saved;
    let change;
    let canceled;

    const teamApi = {
        update: async (team, lastUpdated) => {
            updatedTeam = {team, lastUpdated};
            return apiResponse || {success: true, result: team};
        }
    };

    async function onSaved() {
        saved = true;
    }

    async function onChange(name, value) {
        change = {name, value};
    }

    async function onCancel() {
        canceled = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisions) {
        reportedError = null;
        updatedTeam = null;
        saved = false;
        change = null;
        canceled = false;
        context = await renderApp(
            {teamApi},
            {name: 'Courage Scores'},
            {
                divisions,
                onError: (err) => {
                    reportedError = err;
                },
            },
            (<EditTeamDetails {...props} onSaved={onSaved} onChange={onChange} onCancel={onCancel}/>));
    }

    describe('renders', () => {
        it('name', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: null,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division]);

            const nameGroup = context.container.querySelector('div.input-group:nth-child(2)');
            expect(nameGroup).toBeTruthy();
            expect(nameGroup.textContent).toContain('Name');
            const input = nameGroup.querySelector('input');
            expect(input).toBeTruthy();
            expect(input.value).toEqual('TEAM');
        });

        it('address', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: null,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division]);

            const addressGroup = context.container.querySelector('div.input-group:nth-child(3)');
            expect(addressGroup).toBeTruthy();
            expect(addressGroup.textContent).toContain('Address');
            const input = addressGroup.querySelector('input');
            expect(input).toBeTruthy();
            expect(input.value).toEqual('ADDRESS');
        });

        it('division', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: division.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division]);

            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const selectedDivision = divisionGroup.querySelector('.dropdown-menu .active');
            expect(selectedDivision).toBeTruthy();
            expect(selectedDivision.textContent).toEqual('DIVISION');
        });

        it('new division', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: otherDivision.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division, otherDivision]);

            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const selectedDivision = divisionGroup.querySelector('.btn-group .dropdown-item.active');
            expect(selectedDivision).toBeTruthy();
            expect(selectedDivision.textContent).toEqual('OTHER DIVISION');
        });
    });

    describe('interactivity', () => {
        it('name can be changed', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: division.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division]);
            const nameGroup = context.container.querySelector('div.input-group:nth-child(2)');

            await doChange(nameGroup, 'input', 'NEW', context.user);

            expect(change).toBeTruthy();
            expect(change.name).toEqual('name');
            expect(change.value).toEqual('NEW');
        });

        it('address can be changed', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: division.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division]);
            const addressGroup = context.container.querySelector('div.input-group:nth-child(3)');

            await doChange(addressGroup, 'input', 'NEW', context.user);

            expect(change).toBeTruthy();
            expect(change.name).toEqual('address');
            expect(change.value).toEqual('NEW');
        });

        it('division can be changed', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };
            await renderComponent({
                team: {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: division.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division, otherDivision]);
            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');

            await doSelectOption(divisionGroup.querySelector('.dropdown-menu'), 'OTHER DIVISION');

            expect(change).toBeTruthy();
            expect(change.name).toEqual('newDivisionId');
            expect(change.value).toEqual(otherDivision.id);
        });

        it('division cannot be changed when new team', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };

            await renderComponent({
                team: {
                    name: 'TEAM',
                    address: 'ADDRESS',
                    newDivisionId: division.id,
                },
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }, [division, otherDivision]);

            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');
            const dropdown = divisionGroup.querySelector('button.dropdown-toggle');
            expect(dropdown).toBeTruthy();
            expect(dropdown.disabled).toEqual(true);
            expect(dropdown.textContent).toEqual('DIVISION');
        });

        it('prevents save when no name', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const team = {
                id: createTemporaryId(),
                name: '',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }
            await renderComponent({
                team: {
                    id: team.id,
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            }, [division]);
            let alert;
            window.alert = (message) => {
                alert = message
            };

            await doClick(findButton(context.container, 'Save team'));

            expect(saved).toEqual(false);
            expect(alert).toEqual('You must enter a team name');
        });

        it('can save team changes', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                updated: '2023-07-01T00:00:00',
            }
            await renderComponent({
                team: {
                    id: team.id,
                    name: team.name,
                    address: team.address,
                    updated: team.updated,
                    newDivisionId: otherDivision.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            }, [division, otherDivision]);

            await doClick(findButton(context.container, 'Save team'));

            expect(saved).toEqual(true);
            expect(updatedTeam.lastUpdated).toEqual('2023-07-01T00:00:00');
            expect(updatedTeam.team).toEqual({
                id: team.id,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: otherDivision.id,
            });
        });

        it('can create team', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };
            const team = {
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            }, [division, otherDivision]);

            await doClick(findButton(context.container, 'Add team'));

            expect(saved).toEqual(true);
            expect(updatedTeam.lastUpdated).toBeFalsy();
            expect(updatedTeam.team).toEqual({
                id: undefined,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id
            });
        });

        it('shows an error if unable to save', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const otherDivision = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION',
            };
            const team = {
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            }, [division, otherDivision]);
            apiResponse = {success: false};

            await doClick(findButton(context.container, 'Add team'));

            expect(saved).toEqual(false);
            expect(updatedTeam).not.toBeNull();
            expect(change).toEqual(null);
            expect(context.container.textContent).toContain('Could not save team details');
        });

        it('can cancel', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            }, [division]);

            await doClick(findButton(context.container, 'Cancel'));

            expect(canceled).toEqual(true);
        });
    });
});