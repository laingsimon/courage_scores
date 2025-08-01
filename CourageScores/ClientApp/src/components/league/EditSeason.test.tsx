import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
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
import { DivisionDataSeasonDto } from '../../interfaces/models/dtos/Division/DivisionDataSeasonDto';

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
    const seasonApi = api<ISeasonApi>({
        update: async (
            data: EditSeasonDto,
        ): Promise<IClientActionResultDto<SeasonDto>> => {
            updatedSeason = data;
            return apiResponse;
        },
        delete: async (
            id: string,
        ): Promise<IClientActionResultDto<SeasonDto>> => {
            deletedId = id;
            return apiResponse;
        },
    });

    async function onClose() {
        closed = true;
    }

    async function onSave() {
        saved = true;
    }

    async function setSaveError(err: IClientActionResultDto<SeasonDto>) {
        saveError = err;
    }

    async function onUpdateData(_: EditSeasonDto) {}

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saved = false;
        saveError = null;
        updatedSeason = null;
        deletedId = null;
        apiResponse = {
            success: true,
        };
    });

    async function renderComponent(
        props: IEditSeasonProps,
        seasons: SeasonDto[],
        divisions: DivisionDto[],
    ) {
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
            <EditSeason {...props} />,
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
        let updatedData: EditSeasonDto;
        await renderComponent(
            {
                data: season,
                onUpdateData: async (update: EditSeasonDto) => {
                    updatedData = update;
                },
                setSaveError,
                onClose,
                onSave,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await doChange(
            context.container,
            'input[name="name"]',
            'NEW SEASON NAME',
            context.user,
        );

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.name).toEqual('NEW SEASON NAME');
    });

    it('updates season dates', async () => {
        let updatedData: EditSeasonDto;
        await renderComponent(
            {
                data: season,
                onUpdateData: async (update: EditSeasonDto) => {
                    updatedData = update;
                },
                setSaveError,
                onClose,
                onSave,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await doChange(
            context.container,
            'input[name="startDate"]',
            '2023-06-01',
            context.user,
        );
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.startDate).toEqual('2023-06-01');

        await doChange(
            context.container,
            'input[name="endDate"]',
            '2023-09-01',
            context.user,
        );
        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.endDate).toEqual('2023-09-01');
    });

    it('can select a division', async () => {
        let updatedData: EditSeasonDto;
        await renderComponent(
            {
                data: season,
                onUpdateData: async (update: EditSeasonDto) => {
                    updatedData = update;
                },
                setSaveError,
                onClose,
                onSave,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        const divisionOptions = Array.from(
            context.container.querySelectorAll('.list-group-item'),
        );
        const unselectedDivision = divisionOptions.filter(
            (d) => d.className.indexOf('active') === -1,
        )[0];
        expect(unselectedDivision.textContent).toEqual(division2.name);
        await doClick(unselectedDivision);

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.divisionIds).toEqual([division1.id, division2.id]);
    });

    it('can unselect a division', async () => {
        let updatedData: EditSeasonDto;
        await renderComponent(
            {
                data: season,
                onUpdateData: async (update: EditSeasonDto) => {
                    updatedData = update;
                },
                setSaveError,
                onClose,
                onSave,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        const divisionOptions = Array.from(
            context.container.querySelectorAll('.list-group-item'),
        );
        const selectedDivision = divisionOptions.filter(
            (d) => d.className.indexOf('active') !== -1,
        )[0];
        expect(selectedDivision.textContent).toEqual(division1.name);
        await doClick(selectedDivision);

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(season.id);
        expect(updatedData!.divisionIds).toEqual([]);
    });

    it('updates copy teams from when no id', async () => {
        const seasonWithoutId: EditSeasonDto = Object.assign({}, season);
        seasonWithoutId.id = undefined;
        const otherSeason = seasonBuilder('OTHER SEASON').build();
        let updatedData: EditSeasonDto;
        await renderComponent(
            {
                data: seasonWithoutId as EditSeasonDto & DivisionDataSeasonDto,
                onUpdateData: async (update: EditSeasonDto) => {
                    updatedData = update;
                },
                setSaveError,
                onClose,
                onSave,
            },
            [otherSeason],
            divisions,
        );
        reportedError.verifyNoError();

        await doSelectOption(
            context.container.querySelector('.dropdown-menu'),
            'OTHER SEASON',
        );

        reportedError.verifyNoError();
        expect(updatedData!.copyTeamsFromSeasonId).toEqual(otherSeason.id);
    });

    it('prevents save when season name is empty', async () => {
        const seasonWithoutName = Object.assign({}, season);
        seasonWithoutName.name = '';
        await renderComponent(
            {
                data: seasonWithoutName,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [seasonWithoutName],
            divisions,
        );

        await doClick(findButton(context.container, 'Update season'));

        context.prompts.alertWasShown('Enter a season name');
        expect(saved).toEqual(false);
    });

    it('saves season updates', async () => {
        await renderComponent(
            {
                data: season,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();

        await doClick(findButton(context.container, 'Update season'));

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
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        apiResponse = {
            success: false,
        };

        await doClick(findButton(context.container, 'Update season'));

        reportedError.verifyNoError();
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if season should be deleted', async () => {
        await renderComponent(
            {
                data: season,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );

        await doClick(findButton(context.container, 'Delete season'));

        context.prompts.confirmWasShown(
            'Are you sure you want to delete the SEASON season?',
        );
        expect(saved).toEqual(false);
    });

    it('deletes season', async () => {
        await renderComponent(
            {
                data: season,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );

        await doClick(findButton(context.container, 'Delete season'));

        reportedError.verifyNoError();
        expect(deletedId).toEqual(season.id);
    });

    it('reports saveError if season cannot be deleted', async () => {
        await renderComponent(
            {
                data: season,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
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

        await doClick(findButton(context.container, 'Delete season'));

        reportedError.verifyNoError();
        expect(deletedId).toEqual(season.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when season deleted', async () => {
        await renderComponent(
            {
                data: season,
                setSaveError,
                onClose,
                onSave,
                onUpdateData,
            },
            [season],
            divisions,
        );
        reportedError.verifyNoError();
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the SEASON season?',
            true,
        );

        await doClick(findButton(context.container, 'Delete season'));

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});
