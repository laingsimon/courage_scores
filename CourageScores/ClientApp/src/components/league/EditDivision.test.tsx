import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { EditDivision, IEditDivisionProps } from './EditDivision';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { EditDivisionDto } from '../../interfaces/models/dtos/EditDivisionDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { IDivisionApi } from '../../interfaces/apis/IDivisionApi';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('EditDivision', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: boolean;
    let saveError: IClientActionResultDto<DivisionDto> | null;
    let updatedDivision: EditDivisionDto | null;
    let apiResponse: IClientActionResultDto<DivisionDto>;
    let deletedId: string | null;
    let updatedData: DivisionDataDto | null;
    const divisionApi = api<IDivisionApi>({
        update: async (data: EditDivisionDto) => {
            updatedDivision = data;
            return apiResponse;
        },
        delete: async (id: string) => {
            deletedId = id;
            return apiResponse;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saved = false;
        saveError = null;
        updatedDivision = null;
        deletedId = null;
        updatedData = null;
        apiResponse = {
            success: true,
        };
    });

    async function onClose() {}

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
            iocProps({ divisionApi }),
            brandingProps(),
            appProps({}, reportedError),
            <EditDivision {...props} />,
        );
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

        await context.input('name').change('NEW DIVISION NAME');

        reportedError.verifyNoError();
        expect(updatedData!.id).toEqual(division.id);
        expect(updatedData!.name).toEqual('NEW DIVISION NAME');
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

        await context.button('Update division').click();

        context.prompts.alertWasShown('Enter a division name');
        expect(saved).toEqual(false);
    });

    it('updates superleague property', async () => {
        const division = divisionBuilder('DIVISION').build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        reportedError.verifyNoError();

        await context.required('input[name="superleague"]').click();

        reportedError.verifyNoError();
        expect(updatedData!.superleague).toEqual(true);
    });

    it('saves division updates', async () => {
        const division = divisionBuilder('DIVISION')
            .updated('2024-01-01')
            .build();
        await renderComponent({
            data: division,
            onUpdateData,
            onSave,
            onClose,
            setSaveError,
        });
        reportedError.verifyNoError();

        await context.button('Update division').click();

        reportedError.verifyNoError();
        context.prompts.noAlerts();
        expect(saved).toEqual(true);
        expect(updatedDivision).not.toBeNull();
        expect(updatedDivision!.lastUpdated).toEqual(division.updated);
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
            success: false,
        };

        await context.button('Update division').click();

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
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the DIVISION division?',
            true,
        );

        await context.button('Delete division').click();

        context.prompts.confirmWasShown(
            'Are you sure you want to delete the DIVISION division?',
        );
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
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the DIVISION division?',
            true,
        );

        await context.button('Delete division').click();

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
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the DIVISION division?',
            true,
        );
        apiResponse = {
            success: false,
        };

        await context.button('Delete division').click();

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
        context.prompts.respondToConfirm(
            'Are you sure you want to delete the DIVISION division?',
            true,
        );

        await context.button('Delete division').click();

        expect(mockedUsedNavigate).toHaveBeenCalledWith('https://localhost');
    });
});
