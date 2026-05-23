import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { EditSeason, IEditSeasonProps } from './EditSeason';
import { EditSeasonDto } from '../../interfaces/models/dtos/Season/EditSeasonDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { ISeasonApi } from '../../interfaces/apis/ISeasonApi';
import { renderDate } from '../../helpers/rendering';
import { DivisionDataContainer } from './DivisionDataContainer';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditSeason', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: boolean;
    let saveError: IClientActionResultDto<SeasonDto> | null;
    let updatedSeason: EditSeasonDto | null;
    let apiResponse: IClientActionResultDto<SeasonDto>;
    let deletedId: string | null;
    let updatedData: EditSeasonDto | null;
    const seasonApi = api<ISeasonApi>({
        update: async (data: EditSeasonDto) => {
            updatedSeason = data;
            return apiResponse;
        },
        delete: async (id: string) => {
            deletedId = id;
            return apiResponse;
        },
    });

    async function onClose() {}

    async function onSave() {
        saved = true;
    }

    async function setSaveError(err: IClientActionResultDto<SeasonDto>) {
        saveError = err;
    }

    async function onUpdateData(data: EditSeasonDto) {
        updatedData = data;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saved = false;
        saveError = null;
        updatedSeason = null;
        deletedId = null;
        updatedData = null;
        apiResponse = {
            success: true,
        };
    });

    async function renderComponent(
        p: Partial<IEditSeasonProps>,
        seasons: SeasonDto[],
        divisions: DivisionDto[],
        fixtures?: DivisionFixtureDateDto[],
    ) {
        const props = {
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
            ...p,
        } as IEditSeasonProps;
        context = await renderApp(
            iocProps({ seasonApi }),
            brandingProps(),
            appProps(
                {
                    seasons,
                    divisions,
                },
                reportedError,
            ),
            <DivisionDataContainer
                onReloadDivision={noop}
                name="division"
                fixtures={fixtures}>
                <EditSeason {...props} />
            </DivisionDataContainer>,
        );
    }

    const division1 = divisionBuilder('DIVISION 1').build();
    const division2 = divisionBuilder('DIVISION 2').build();
    const season = seasonBuilder('SEASON')
        .starting('2023-01-01T00:00:00')
        .ending('2023-05-01T00:00:00')
        .withDivision(division1)
        .withDivisionId(division1)
        .updated('2024-01-01')
        .build();
    const divisions = [division1, division2];

    it('updates season name', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await context.input('name').change('NEW SEASON NAME');

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.name).toEqual('NEW SEASON NAME');
    });

    it('updates season dates', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await context.input('startDate').change('2023-06-01');
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.startDate).toEqual('2023-06-01');

        await context.input('endDate').change('2023-09-01');
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.endDate).toEqual('2023-09-01');
    });

    it('updates season fixture timings', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await context.input('fixtureStartTime').change('20:30');
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.fixtureStartTime).toEqual('20:30');

        await context.input('fixtureDuration').change('5');
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.fixtureDuration).toEqual(5);
    });

    it('can select a division', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        const divisionOptions = context.all('.list-group-item');
        const unselectedDivision = divisionOptions.filter(
            (d) => d.className().indexOf('active') === -1,
        )[0];
        expect(unselectedDivision.text()).toEqual(division2.name);
        await unselectedDivision.click();

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.divisionIds).toEqual([division1.id, division2.id]);
    });

    it('can unselect a division', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        const divisionOptions = context.all('.list-group-item');
        const selectedDivision = divisionOptions.filter(
            (d) => d.className().indexOf('active') !== -1,
        )[0];
        expect(selectedDivision.text()).toEqual(division1.name);
        await selectedDivision.click();

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.divisionIds).toEqual([]);
    });

    it('updates copy teams from when no id', async () => {
        const seasonWithoutId: EditSeasonDto = Object.assign({}, season);
        seasonWithoutId.id = undefined;
        const otherSeason = seasonBuilder('OTHER SEASON').build();
        await renderComponent(
            {
                data: seasonWithoutId as EditSeasonDto & SeasonDto,
            },
            [otherSeason],
            divisions,
        );
        reportedError.verifyNoError();

        await context.required('.dropdown-menu').select('OTHER SEASON');

        reportedError.verifyNoError();
        expect(updatedData!.copyTeamsFromSeasonId).toEqual(otherSeason.id);
    });

    it('prevents save when season name is empty', async () => {
        const seasonWithoutName = Object.assign({}, season);
        seasonWithoutName.name = '';
        await renderComponent(
            {
                data: seasonWithoutName,
            },
            [seasonWithoutName],
            divisions,
        );

        await context.button('Update season').click();

        context.prompts.alertWasShown('Enter a season name');
        expect(saved).toEqual(false);
    });

    it('prevents save when start date is after first fixture', async () => {
        const earliestFixtureDate = '2026-02-01';
        const startsAfterFirstFixture = { ...season, startDate: '2026-02-02' };
        const fixture = {
            date: earliestFixtureDate,
        } as DivisionFixtureDateDto;
        await renderComponent(
            {
                data: startsAfterFirstFixture,
            },
            [startsAfterFirstFixture],
            divisions,
            [fixture],
        );

        await context.button('Update season').click();

        context.prompts
            .alertWasShown(`Start date is after some fixtures in the season, this would prevent them from appearing on the fixture list.

Alter the date to ${renderDate(earliestFixtureDate)} so they are included`);
        expect(saved).toEqual(false);
    });

    it('prevents save when end date is before last fixture', async () => {
        const latestFixtureDate = '2026-02-02';
        const endsBeforeLastFixture = { ...season, endDate: '2026-02-01' };
        const fixture = {
            date: latestFixtureDate,
        } as DivisionFixtureDateDto;
        await renderComponent(
            {
                data: endsBeforeLastFixture,
            },
            [endsBeforeLastFixture],
            divisions,
            [fixture],
        );

        await context.button('Update season').click();

        context.prompts
            .alertWasShown(`End date is before some fixtures in the season, this would prevent them from appearing on the fixture list.

Alter the date to ${renderDate(latestFixtureDate)} so they are included`);
        expect(saved).toEqual(false);
    });

    it('saves season updates', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await context.button('Update season').click();

        reportedError.verifyNoError();
        context.prompts.noAlerts();
        expect(saved).toEqual(true);
        expect(updatedSeason).not.toBeNull();
        expect(updatedSeason!.lastUpdated).toEqual(season.updated);
    });

    it('reports saveError if an error during save', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        apiResponse = {
            success: false,
        };

        await context.button('Update season').click();

        reportedError.verifyNoError();
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if season should be deleted', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            false,
        );

        await context.button('Delete season').click();

        context.prompts.confirmWasShown(
            'Are you sure you want to delete the SEASON season?',
        );
        expect(saved).toEqual(false);
    });

    it('deletes season', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );

        await context.button('Delete season').click();

        reportedError.verifyNoError();
        expect(deletedId).toEqual(season.id);
    });

    it('reports saveError if season cannot be deleted', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );
        apiResponse = {
            success: false,
        };

        await context.button('Delete season').click();

        reportedError.verifyNoError();
        expect(deletedId).toEqual(season.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when season deleted', async () => {
        await renderComponent(
            {
                data: season,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );

        await context.button('Delete season').click();

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});
