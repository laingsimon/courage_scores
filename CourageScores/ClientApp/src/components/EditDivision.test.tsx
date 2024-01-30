import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../helpers/tests";
import React from "react";
import {EditDivision, IEditDivisionProps} from "./EditDivision";
import {divisionBuilder} from "../helpers/builders/divisions";
import {IEditDivisionDto} from "../interfaces/models/dtos/IEditDivisionDto";
import {IDivisionDto} from "../interfaces/models/dtos/IDivisionDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";
import {IDivisionDataDto} from "../interfaces/models/dtos/Division/IDivisionDataDto";
import {IDivisionApi} from "../interfaces/apis/DivisionApi";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditDivision', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: boolean;
    let saveError: IClientActionResultDto<IDivisionDto>;
    let updatedDivision: IEditDivisionDto;
    let alert: string;
    let confirm: string;
    let confirmResponse: boolean;
    let apiResponse: IClientActionResultDto<IDivisionDto>;
    let deletedId: string;
    let updatedData: IDivisionDataDto;
    const divisionApi = api<IDivisionApi>({
        update: (data: IEditDivisionDto) => {
            updatedDivision = data;
            return apiResponse;
        },
        delete: (id: string) => {
            deletedId = id;
            return apiResponse;
        }
    });

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
        updatedDivision = null;
        deletedId = null;
        updatedData = null;
        apiResponse = {
            success: true,
        };
    });

    async function onClose() {
        closed = true;
    }

    async function onSave() {
        saved = true;
    }

    async function setSaveError(err: IClientActionResultDto<IDivisionDto>) {
        saveError = err;
    }

    async function onUpdateData(update: IDivisionDataDto) {
        updatedData = update;
    }

    async function renderComponent(props: IEditDivisionProps) {
        context = await renderApp(
            iocProps({divisionApi}),
            brandingProps(),
            appProps({}, reportedError),
            (<EditDivision {...props} />));
    }

    it('updates division name', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);

        await doChange(context.container, 'input[name="name"]', 'NEW DIVISION NAME', context.user);

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedData.id).toEqual(division.id);
        expect(updatedData.name).toEqual('NEW DIVISION NAME');
    });

    it('prevents save when division name is empty', async () => {
        const division = divisionBuilder('').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });

        await doClick(findButton(context.container, 'Update division'));

        expect(alert).toEqual('Enter a division name');
        expect(saved).toEqual(false);
    });

    it('saves division updates', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container, 'Update division'));

        expect(reportedError.hasError()).toEqual(false);
        expect(alert).toBeNull();
        expect(saved).toEqual(true);
        expect(updatedDivision).not.toBeNull();
    });

    it('reports saveError if an error during save', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Update division'));

        expect(reportedError.hasError()).toEqual(false);
        expect(saveError).toEqual(apiResponse);
    });

    it('confirms if division should be deleted', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container, 'Delete division'));

        expect(confirm).toEqual('Are you sure you want to delete the DIVISION division?');
        expect(saved).toEqual(false);
    });

    it('deletes division', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete division'));

        expect(reportedError.hasError()).toEqual(false);
        expect(deletedId).toEqual(division.id);
    });

    it('reports saveError if division cannot be deleted', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Delete division'));

        expect(reportedError.hasError()).toEqual(false);
        expect(deletedId).toEqual(division.id);
        expect(saveError).toEqual(apiResponse);
    });

    it('navigates to home when division deleted', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        expect(reportedError.hasError()).toEqual(false);
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete division'));

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});