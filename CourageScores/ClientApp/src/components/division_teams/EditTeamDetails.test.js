// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange, findButton} from "../../tests/helpers";
import React from "react";
import {createTemporaryId} from "../../Utilities";
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
        update: async (team) => {
            updatedTeam = team;
            return apiResponse || { success: true };
        }
    };

    async function onSaved() {
        saved = true;
    }
    async function onChange(name, value) {
        change = { name, value };
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
            {
                teamApi
            },
            {
                divisions,
                onError: (err) => {
                    reportedError = err;
                },
            },
            (<EditTeamDetails {...props} onSaved={onSaved} onChange={onChange} onCancel={onCancel} />));
    }

    describe('renders', () => {
        it('name', async () => {
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            await renderComponent({
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: null,
            }, [ division ]);

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: null,
            }, [ division ]);

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: division.id,
            }, [ division ]);

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: otherDivision.id,
            }, [ division, otherDivision ]);

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: division.id,
            }, [ division ]);
            const nameGroup = context.container.querySelector('div.input-group:nth-child(2)');

            doChange(nameGroup, 'input', 'NEW');

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: division.id,
            }, [ division ]);
            const addressGroup = context.container.querySelector('div.input-group:nth-child(3)');

            doChange(addressGroup, 'input', 'NEW');

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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: division.id,
            }, [ division, otherDivision ]);
            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');

            await doClick(divisionGroup, '.dropdown-item:not(.active)');

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
                id: null,
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
                newDivisionId: division.id,
            }, [ division, otherDivision ]);

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
                id: team.id,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id,
            }, [ division ]);
            let alert;
            window.alert = (message) => { alert = message };

            const saveButton = findButton(context.container, 'Save team');
            await doClick(saveButton);

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
            }
            await renderComponent({
                id: team.id,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: otherDivision.id,
            }, [ division, otherDivision ]);

            const saveButton = findButton(context.container, 'Save team');
            await doClick(saveButton);

            expect(saved).toEqual(true);
            expect(updatedTeam).toEqual({
                id: team.id,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: otherDivision.id
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
                id: createTemporaryId(),
                name: 'TEAM',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: createTemporaryId(),
            }
            await renderComponent({
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id,
            }, [ division, otherDivision ]);

            const saveButton = findButton(context.container, 'Add team');
            await doClick(saveButton);

            expect(saved).toEqual(true);
            expect(updatedTeam).toEqual({
                id: undefined,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id
            });
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
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id,
            }, [ division ]);

            const cancelButton = findButton(context.container, 'Cancel');
            await doClick(cancelButton);

            expect(canceled).toEqual(true);
        });
    });
});