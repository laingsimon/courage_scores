import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {EditTeamDetails, IEditTeamDetailsProps} from "./EditTeamDetails";
import {ITeamDto} from "../../interfaces/serverSide/Team/ITeamDto";
import {IEditTeamDto} from "../../interfaces/serverSide/Team/IEditTeamDto";
import {IDivisionDto} from "../../interfaces/serverSide/IDivisionDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {ITeamApi} from "../../api/team";
import {teamBuilder} from "../../helpers/builders/teams";
import {divisionBuilder} from "../../helpers/builders/divisions";

describe('EditTeamDetails', () => {
    let context: TestContext;
    let updatedTeam: {team: IEditTeamDto, lastUpdated?: string};
    let apiResponse: IClientActionResultDto<ITeamDto>;
    let saved: boolean;
    let change: {name: string, value: string};
    let canceled: boolean;

    const teamApi = api<ITeamApi>({
        update: async (team: IEditTeamDto, lastUpdated?: string) => {
            updatedTeam = {team, lastUpdated};
            return apiResponse || {success: true, result: team};
        }
    });

    async function onSaved() {
        saved = true;
    }

    async function onChange(name: string, value: string) {
        change = {name, value};
    }

    async function onCancel() {
        canceled = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        updatedTeam = null;
        saved = false;
        change = null;
        canceled = false;
    });

    async function renderComponent(props: IEditTeamDetailsProps, divisions: IDivisionDto[]) {
        context = await renderApp(
            iocProps({teamApi}),
            brandingProps(),
            appProps({divisions}),
            (<EditTeamDetails {...props} onSaved={onSaved} onChange={onChange} onCancel={onCancel}/>));
    }

    describe('renders', () => {
        it('name', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division]);

            const nameGroup = context.container.querySelector('div.input-group:nth-child(2)');
            expect(nameGroup).toBeTruthy();
            expect(nameGroup.textContent).toContain('Name');
            const input = nameGroup.querySelector('input');
            expect(input).toBeTruthy();
            expect(input.value).toEqual('TEAM');
        });

        it('address', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division]);

            const addressGroup = context.container.querySelector('div.input-group:nth-child(3)');
            expect(addressGroup).toBeTruthy();
            expect(addressGroup.textContent).toContain('Address');
            const input = addressGroup.querySelector('input');
            expect(input).toBeTruthy();
            expect(input.value).toEqual('ADDRESS');
        });

        it('division', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').newDivisionId(division.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division]);

            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const selectedDivision = divisionGroup.querySelector('.dropdown-menu .active');
            expect(selectedDivision).toBeTruthy();
            expect(selectedDivision.textContent).toEqual('DIVISION');
        });

        it('new division', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').newDivisionId(otherDivision.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division, otherDivision]);

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
            const division = divisionBuilder('DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').newDivisionId(division.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division]);
            const nameGroup = context.container.querySelector('div.input-group:nth-child(2)');

            await doChange(nameGroup, 'input', 'NEW', context.user);

            expect(change).toBeTruthy();
            expect(change.name).toEqual('name');
            expect(change.value).toEqual('NEW');
        });

        it('address can be changed', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').newDivisionId(division.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division]);
            const addressGroup = context.container.querySelector('div.input-group:nth-child(3)');

            await doChange(addressGroup, 'input', 'NEW', context.user);

            expect(change).toBeTruthy();
            expect(change.name).toEqual('address');
            expect(change.value).toEqual('NEW');
        });

        it('division can be changed', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            await renderComponent({
                team: teamBuilder('TEAM').address('ADDRESS').newDivisionId(division.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division, otherDivision]);
            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');

            await doSelectOption(divisionGroup.querySelector('.dropdown-menu'), 'OTHER DIVISION');

            expect(change).toBeTruthy();
            expect(change.name).toEqual('newDivisionId');
            expect(change.value).toEqual(otherDivision.id);
        });

        it('division cannot be changed when new team', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();

            await renderComponent({
                team: teamBuilder('TEAM').noId().address('ADDRESS').newDivisionId(division.id).build(),
                divisionId: division.id,
                seasonId: createTemporaryId(),
            } as any, [division, otherDivision]);

            const divisionGroup = context.container.querySelector('div.input-group:nth-child(4)');
            const dropdown = divisionGroup.querySelector('button.dropdown-toggle') as HTMLButtonElement;
            expect(dropdown).toBeTruthy();
            expect(dropdown.disabled).toEqual(true);
            expect(dropdown.textContent).toEqual('DIVISION');
        });

        it('prevents save when no name', async () => {
            const division = divisionBuilder('DIVISION').build();
            const team = teamBuilder('')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent({
                team: {
                    id: team.id,
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            } as any, [division]);
            let alert: string;
            window.alert = (message) => {
                alert = message
            };

            await doClick(findButton(context.container, 'Save team'));

            expect(saved).toEqual(false);
            expect(alert).toEqual('You must enter a team name');
        });

        it('can save team changes', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .updated('2023-07-01T00:00:00')
                .build();
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
            } as any, [division, otherDivision]);

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
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .season(createTemporaryId())
                .division(division)
                .build();
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            } as any, [division, otherDivision]);

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
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            } as any, [division, otherDivision]);
            apiResponse = {success: false} as any;

            await doClick(findButton(context.container, 'Add team'));

            expect(saved).toEqual(false);
            expect(updatedTeam).not.toBeNull();
            expect(change).toEqual(null);
            expect(context.container.textContent).toContain('Could not save team details');
        });

        it('can close error dialog after save failure', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            } as any, [division, otherDivision]);
            apiResponse = {success: false} as any;
            await doClick(findButton(context.container, 'Add team'));
            expect(context.container.textContent).toContain('Could not save team details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save team details');
        });

        it('can cancel', async () => {
            const division = divisionBuilder('DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .season(createTemporaryId())
                .division(division)
                .build();
            await renderComponent({
                team: {
                    name: team.name,
                    address: team.address,
                    newDivisionId: division.id,
                },
                divisionId: team.divisionId,
                seasonId: team.seasonId,
            } as any, [division]);

            await doClick(findButton(context.container, 'Cancel'));

            expect(canceled).toEqual(true);
        });
    });
});