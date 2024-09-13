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
} from "../../helpers/tests";
import {EditDivision, IEditDivisionProps} from "./EditDivision";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {EditDivisionDto} from "../../interfaces/models/dtos/EditDivisionDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditDivision', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: boolean;
    let saveError: IClientActionResultDto<DivisionDto>;
    let updatedDivision: EditDivisionDto;
    let alert: string;
    let confirm: string;
    let confirmResponse: boolean;
    let apiResponse: IClientActionResultDto<DivisionDto>;
    let deletedId: string;
    let updatedData: DivisionDataDto;
    const divisionApi = api<IDivisionApi>({
        update: async (data: EditDivisionDto) => {
            updatedDivision = data;
            return apiResponse;
        },
        delete: async (id: string) => {
            deletedId = id;
            return apiResponse;
        }
    });

    afterEach(async () => {
        await cleanUp(context);
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

    async function setSaveError(err: IClientActionResultDto<DivisionDto>) {
        saveError = err;
    }

    async function onUpdateData(update: DivisionDataDto) {
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
        reportedError.verifyNoError();

        await doChange(context.container, 'input[name="name"]', 'NEW DIVISION NAME', context.user);

        reportedError.verifyNoError();
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
        const division = divisionBuilder('DIVISION').updated('2024-01-01').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        reportedError.verifyNoError();

        await doClick(findButton(context.container, 'Update division'));

        reportedError.verifyNoError();
        expect(alert).toBeNull();
        expect(saved).toEqual(true);
        expect(updatedDivision).not.toBeNull();
        expect(updatedDivision.lastUpdated).toEqual(division.updated);
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
        reportedError.verifyNoError();
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Update division'));

        reportedError.verifyNoError();
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
        reportedError.verifyNoError();

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
        reportedError.verifyNoError();
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete division'));

        reportedError.verifyNoError();
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
        reportedError.verifyNoError();
        confirmResponse = true;
        apiResponse = {
            success: false
        };

        await doClick(findButton(context.container, 'Delete division'));

        reportedError.verifyNoError();
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
        reportedError.verifyNoError();
        confirmResponse = true;

        await doClick(findButton(context.container, 'Delete division'));

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});