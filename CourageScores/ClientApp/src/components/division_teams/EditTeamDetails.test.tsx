import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import { EditTeamDetails, IEditTeamDetailsProps } from './EditTeamDetails';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { EditTeamDto } from '../../interfaces/models/dtos/Team/EditTeamDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { teamBuilder } from '../../helpers/builders/teams';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { ITeamApi } from '../../interfaces/apis/ITeamApi';

describe('EditTeamDetails', () => {
    let context: TestContext;
    let updatedTeam: EditTeamDto | null;
    let apiResponse: IClientActionResultDto<TeamDto> | null;
    let saved: boolean;
    let change: { name: string; value: string } | null;
    let canceled: boolean;

    const teamApi = api<ITeamApi>({
        update: async (
            team: EditTeamDto,
        ): Promise<IClientActionResultDto<TeamDto>> => {
            updatedTeam = team;
            return apiResponse || { success: true, result: team as TeamDto };
        },
    });

    async function onSaved() {
        saved = true;
    }

    async function onChange(name: string, value: string) {
        change = { name, value };
    }

    async function onCancel() {
        canceled = true;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedTeam = null;
        apiResponse = null;
        saved = false;
        change = null;
        canceled = false;
    });

    async function renderComponent(
        props: IEditTeamDetailsProps,
        divisions: DivisionDto[],
    ) {
        context = await renderApp(
            iocProps({ teamApi }),
            brandingProps(),
            appProps({ divisions }),
            <EditTeamDetails {...props} />,
        );
    }

    describe('renders', () => {
        it('name', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM').address('ADDRESS').build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            const nameGroup = context.required('div.input-group:nth-child(2)');
            expect(nameGroup).toBeTruthy();
            expect(nameGroup.text()).toContain('Name');
            const input = nameGroup.required('input');
            expect(input).toBeTruthy();
            expect(input.value()).toEqual('TEAM');
        });

        it('address', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM').address('ADDRESS').build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            const addressGroup = context.required(
                'div.input-group:nth-child(3)',
            );
            expect(addressGroup).toBeTruthy();
            expect(addressGroup.text()).toContain('Address');
            const input = addressGroup.required('input');
            expect(input).toBeTruthy();
            expect(input.value()).toEqual('ADDRESS');
        });

        it('division', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .address('ADDRESS')
                        .newDivisionId(division.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            const divisionGroup = context.required(
                'div.input-group:nth-child(4)',
            );
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.text()).toContain('Division');
            const selectedDivision = divisionGroup.required(
                '.dropdown-menu .active',
            );
            expect(selectedDivision).toBeTruthy();
            expect(selectedDivision.text()).toEqual('DIVISION');
        });

        it('new division', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .address('ADDRESS')
                        .newDivisionId(otherDivision.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );

            const divisionGroup = context.required(
                'div.input-group:nth-child(4)',
            );
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.text()).toContain('Division');
            const selectedDivision = divisionGroup.required(
                '.btn-group .dropdown-item.active',
            );
            expect(selectedDivision).toBeTruthy();
            expect(selectedDivision.text()).toEqual('OTHER DIVISION');
        });
    });

    describe('interactivity', () => {
        it('name can be changed', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .address('ADDRESS')
                        .newDivisionId(division.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            await context
                .required('div.input-group:nth-child(2) input')
                .change('NEW');

            expect(change).toBeTruthy();
            expect(change!.name).toEqual('name');
            expect(change!.value).toEqual('NEW');
        });

        it('address can be changed', async () => {
            const division = divisionBuilder('DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .address('ADDRESS')
                        .newDivisionId(division.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            await context
                .required('div.input-group:nth-child(3) input')
                .change('NEW');

            expect(change).toBeTruthy();
            expect(change!.name).toEqual('address');
            expect(change!.value).toEqual('NEW');
        });

        it('division can be changed', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .address('ADDRESS')
                        .newDivisionId(division.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );
            const divisionGroup = context.required(
                'div.input-group:nth-child(4)',
            );

            await divisionGroup
                .required('.dropdown-menu')
                .select('OTHER DIVISION');

            expect(change).toBeTruthy();
            expect(change!.name).toEqual('newDivisionId');
            expect(change!.value).toEqual(otherDivision.id);
        });

        it('division cannot be changed when new team', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();

            await renderComponent(
                {
                    team: teamBuilder('TEAM')
                        .noId()
                        .address('ADDRESS')
                        .newDivisionId(division.id)
                        .build(),
                    divisionId: division.id,
                    seasonId: createTemporaryId(),
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );

            const divisionGroup = context.required(
                'div.input-group:nth-child(4)',
            );
            const dropdown = divisionGroup.required('button.dropdown-toggle');
            expect(dropdown).toBeTruthy();
            expect(dropdown.enabled()).toEqual(false);
            expect(dropdown.text()).toEqual('DIVISION');
        });

        it('prevents save when no name', async () => {
            const division = divisionBuilder('DIVISION').build();
            const team = teamBuilder('')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent(
                {
                    team: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                        newDivisionId: division.id,
                    },
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            await context.button('Save team').click();

            expect(saved).toEqual(false);
            context.prompts.alertWasShown('You must enter a team name');
        });

        it('can save team changes', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const updated = '2023-07-01T00:00:00';
            const team: EditTeamDto = teamBuilder('TEAM')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent(
                {
                    team: teamBuilder(team.name, team.id)
                        .address(team.address)
                        .newDivisionId(otherDivision.id)
                        .build(),
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                    lastUpdated: updated,
                },
                [division, otherDivision],
            );

            await context.button('Save team').click();

            expect(saved).toEqual(true);
            expect(updatedTeam!.lastUpdated).toEqual(updated);
            expect(updatedTeam).toEqual({
                id: team.id,
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: otherDivision.id,
                lastUpdated: updated,
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
            await renderComponent(
                {
                    team: {
                        name: team.name,
                        address: team.address,
                        newDivisionId: division.id,
                    },
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );

            await context.button('Add team').click();

            expect(saved).toEqual(true);
            expect(updatedTeam!.lastUpdated).toBeFalsy();
            expect(updatedTeam).toEqual({
                name: team.name,
                address: team.address,
                divisionId: team.divisionId,
                seasonId: team.seasonId,
                newDivisionId: division.id,
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
            await renderComponent(
                {
                    team: {
                        name: team.name,
                        address: team.address,
                        newDivisionId: division.id,
                    },
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );
            apiResponse = { success: false };

            await context.button('Add team').click();

            expect(saved).toEqual(false);
            expect(updatedTeam).not.toBeNull();
            expect(change).toEqual(null);
            expect(context.text()).toContain('Could not save team details');
        });

        it('can close error dialog after save failure', async () => {
            const division = divisionBuilder('DIVISION').build();
            const otherDivision = divisionBuilder('OTHER DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .division(division)
                .season(createTemporaryId())
                .build();
            await renderComponent(
                {
                    team: {
                        name: team.name,
                        address: team.address,
                        newDivisionId: division.id,
                    },
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division, otherDivision],
            );
            apiResponse = { success: false };
            await context.button('Add team').click();
            expect(context.text()).toContain('Could not save team details');

            await context.button('Close').click();

            expect(context.text()).not.toContain('Could not save team details');
        });

        it('can cancel', async () => {
            const division = divisionBuilder('DIVISION').build();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .season(createTemporaryId())
                .division(division)
                .build();
            await renderComponent(
                {
                    team: {
                        name: team.name,
                        address: team.address,
                        newDivisionId: division.id,
                    },
                    divisionId: team.divisionId!,
                    seasonId: team.seasonId!,
                    onSaved,
                    onChange,
                    onCancel,
                },
                [division],
            );

            await context.button('Cancel').click();

            expect(canceled).toEqual(true);
        });
    });
});
