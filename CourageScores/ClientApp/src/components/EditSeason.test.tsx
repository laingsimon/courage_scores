import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../helpers/tests";
import React from "react";
import {EditSeason, IEditSeasonProps} from "./EditSeason";
import {IEditSeasonDto} from "../interfaces/models/dtos/Season/IEditSeasonDto";
import {ISeasonDto} from "../interfaces/models/dtos/Season/ISeasonDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";
import {IDivisionDto} from "../interfaces/models/dtos/IDivisionDto";
import {divisionBuilder} from "../helpers/builders/divisions";
import {seasonBuilder} from "../helpers/builders/seasons";
import {ISeasonApi} from "../interfaces/apis/ISeasonApi";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditSeason', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: boolean;
    let saveError: IClientActionResultDto<ISeasonDto>;
    let updatedSeason: IEditSeasonDto;
    let alert: string;
    let confirm: string;
    let confirmResponse: boolean;
    let apiResponse: IClientActionResultDto<ISeasonDto>;
    let deletedId: string;
    const seasonApi = api<ISeasonApi>({
        update: async (data: IEditSeasonDto): Promise<IClientActionResultDto<ISeasonDto>> => {
            updatedSeason = data;
            return apiResponse;
        },
        delete: async (id: string): Promise<IClientActionResultDto<ISeasonDto>> => {
            deletedId = id;
            return apiResponse;
        }
    });

    async function onClose() {
        closed = true;
    }

    async function onSave() {
        saved = true;
    }

    async function setSaveError(err: IClientActionResultDto<ISeasonDto>) {
        saveError = err;
    }

    async function onUpdateData(_: IEditSeasonDto) {

    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        window.alert = (message) => {
            alert = message
        };
        window.confirm = (message) => {
            confirm = message;
            return confirmResponse
        };
        alert = null;
        confirm = null;
        saved = false;
        confirmResponse = false;
        saveError = null;
        updatedSeason = null;
        deletedId = null;
        apiResponse = {
            success: true,
        };
    });

    async function renderComponent(props: IEditSeasonProps, seasons: ISeasonDto[], divisions: IDivisionDto[]) {
        context = await renderApp(
            iocProps({seasonApi}),
            brandingProps(),
            appProps({
                seasons,
                divisions
            }, reportedError),
            (<EditSeason {...props} />));
    }

    const division1 = divisionBuilder('DIVISION 1').build();
    const division2 = divisionBuilder('DIVISION 2').build();
    const season = seasonBuilder('SEASON')
        .starting('2023-01-01T00:00:00')
        .ending('2023-05-01T00:00:00')
        .withDivision(division1)
        .withDivisionId(division1)
        .build();
    const divisions = [division1, division2];

    it('updates season name', async () => {
        let updatedData: IEditSeasonDto;
        await renderComponent({
            data: season,
            onUpdateData: async (update: IEditSeasonDto) => {
                updatedData = update;
            },
            setSaveError,
            onClose,
            onSave,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        await doChange(context.container, 'input[name="name"]', 'NEW SEASON NAME', context.user);

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.name).toEqual('NEW SEASON NAME');
    });

    it('updates season dates', async () => {
        let updatedData: IEditSeasonDto;
        await renderComponent({
            data: season,
            onUpdateData: async (update: IEditSeasonDto) => {
                updatedData = update;
            },
            setSaveError,
            onClose,
            onSave,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        await doChange(context.container, 'input[name="startDate"]', '2023-06-01', context.user);
        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.startDate).toEqual('2023-06-01');

        await doChange(context.container, 'input[name="endDate"]', '2023-09-01', context.user);
        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.endDate).toEqual('2023-09-01');
    });

    it('can select a division', async () => {
        let updatedData: IEditSeasonDto;
        await renderComponent({
            data: season,
            onUpdateData: async (update: IEditSeasonDto) => {
                updatedData = update;
            },
            setSaveError,
            onClose,
            onSave,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        const divisionOptions = Array.from(context.container.querySelectorAll('.list-group-item'));
        const unselectedDivision = divisionOptions.filter(d => d.className.indexOf('active') === -1)[0];
        expect(unselectedDivision.textContent).toEqual(division2.name);
        await doClick(unselectedDivision);

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.divisionIds).toEqual([division1.id, division2.id]);
    });

    it('can unselect a division', async () => {
        let updatedData: IEditSeasonDto;
        await renderComponent({
            data: season,
            onUpdateData: async (update: IEditSeasonDto) => {
                updatedData = update;
            },
            setSaveError,
            onClose,
            onSave,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        const divisionOptions = Array.from(context.container.querySelectorAll('.list-group-item'));
        const selectedDivision = divisionOptions.filter(d => d.className.indexOf('active') !== -1)[0];
        expect(selectedDivision.textContent).toEqual(division1.name);
        await doClick(selectedDivision);

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(season.id);
        expect(updatedData.divisionIds).toEqual([]);
    });

    it('updates copy teams from when no id', async () => {
        const seasonWithoutId = Object.assign({}, season);
        seasonWithoutId.id = null;
        const otherSeason = seasonBuilder('OTHER SEASON').build();
        let updatedData: IEditSeasonDto;
        await renderComponent({
            data: seasonWithoutId,
            onUpdateData: async (update: IEditSeasonDto) => {
                updatedData = update;
            },
            setSaveError,
            onClose,
            onSave,
        }, [otherSeason], divisions);
        expect(reportedError.hasError()).toEqual(false);

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'OTHER SEASON');

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.copyTeamsFromSeasonId).toEqual(otherSeason.id);
    });

    it('prevents save when season name is empty', async () => {
        const seasonWithoutName = Object.assign({}, season);
        seasonWithoutName.name = '';
        await renderComponent({
            data: seasonWithoutName,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [seasonWithoutName], divisions);

        await doClick(findButton(context.container, 'Update season'));

        expect(alert).toEqual('Enter a season name');
        expect(saved).toEqual(false);
    });

    it('saves season updates', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container, 'Update season'));

        expect(reportedError.hasError()).toEqual(false);
        expect(alert).toBeNull();
        expect(saved).toEqual(true);
        expect(updatedSeason).not.toBeNull();
    });

    it('reports saveError if an error during save', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Update season'));

        expect(reportedError.hasError()).toEqual(false);
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if season should be deleted', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container, 'Delete season'));

        expect(confirm).toEqual('Are you sure you want to delete the SEASON season?');
        expect(saved).toEqual(false);
    });

    it('deletes season', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete season'));

        expect(reportedError.hasError()).toEqual(false);
        expect(deletedId).toEqual(season.id);
    });

    it('reports saveError if season cannot be deleted', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Delete season'));

        expect(reportedError.hasError()).toEqual(false);
        expect(deletedId).toEqual(season.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when season deleted', async () => {
        await renderComponent({
            data: season,
            setSaveError,
            onClose,
            onSave,
            onUpdateData,
        }, [season], divisions);
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete season'));

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});