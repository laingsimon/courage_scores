import {
    appProps,
    brandingProps,
    cleanUp, doClick,
    ErrorState, findButton,
    iocProps,
    renderApp, setFile,
    TestContext
} from "../../helpers/tests";
import {IPhotoManagerProps, PhotoManager} from "./PhotoManager";
import {IAppContainerProps} from "./AppContainer";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {PhotoReferenceDto} from "../../interfaces/models/dtos/PhotoReferenceDto";
import {renderDate} from "../../helpers/rendering";
import {createTemporaryId} from "../../helpers/projection";

describe('PhotoManager', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let upload: File;
    let uploadResult: boolean;
    let closed: boolean;
    let deleteId: string;
    let deleteResult: boolean;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        upload = null;
        uploadResult = true;
        closed = false;
        reportedError = new ErrorState();
        deleteId = null;
        deleteResult = true;
    });

    async function doUpload(file: File) {
        upload = file;
        return uploadResult;
    }

    async function doDelete(id: string) {
        deleteId = id;
        return deleteResult;
    }

    async function onClose() {
        closed = true;
    }

    async function setPhoto() {
        const file = 'a photo';
        await setFile(context.container, 'input[type="file"]', file, context.user);
    }

    async function renderComponent(appProps: IAppContainerProps, props: IPhotoManagerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps,
            (<PhotoManager {...props}/>));

        // don't allow onError to be called - would call infinite-loop/recursion
        reportedError.verifyNoError();
    }

    describe('renders', () => {
        const account: UserDto = {
            name: 'USER',
            givenName: '',
            emailAddress: '',
            access: {
                deleteAnyPhoto: true,
            }
        };
        const myPhoto: PhotoReferenceDto = {
            id: createTemporaryId(),
            contentType: 'image/png',
            author: account.name,
            created: '2023-01-01T04:05:06',
            fileSize: 1234,
        };
        const anotherPhoto: PhotoReferenceDto = {
            id: createTemporaryId(),
            contentType: 'image/png',
            author: 'OTHER USER',
            created: '2024-04-04T05:05:05',
            fileSize: 1234,
        };

        it('when an admin, shows all photos', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos.map(p => p.textContent)).toEqual([
                `${myPhoto.author} on ${renderDate(myPhoto.created)}1kb`,
                `${anotherPhoto.author} on ${renderDate(anotherPhoto.created)}1kb`
            ]);
        });

        it('when not an admin, shows own photo only', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: false,
                doUpload,
                onClose,
                doDelete,
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos.map(p => p.textContent)).toEqual([
                `${myPhoto.author} on ${renderDate(myPhoto.created)}1kb`,
            ]);
        });

        it('when no photos', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canViewAllPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos.map(p => p.textContent)).toEqual([]);
        });

        it('when permitted, the ability to upload', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: false,
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const fileUploadControl = context.container.querySelector('input[type="file"]');
            expect(fileUploadControl).toBeTruthy();
            const visibleUploadContainer = context.container.querySelector('div[datatype="upload-control"]');
            expect(visibleUploadContainer).toBeTruthy();
        });

        it('when not permitted, no ability to upload', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: false,
                canUploadPhotos: false,
                doUpload,
                onClose,
                doDelete,
            });

            const uploadButton = context.container.querySelector('.btn-primary');
            expect(uploadButton).toBeFalsy();
            const fileUploadControl = context.container.querySelector('input[type="file"]');
            expect(fileUploadControl).toBeFalsy();
            const visibleUploadContainer = context.container.querySelector('div[datatype="upload-control"]');
            expect(visibleUploadContainer).toBeFalsy();
        });

        it('when not permitted, no delete button', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: false,
                canUploadPhotos: false,
                doUpload,
                onClose,
                doDelete,
            });

            const deleteButtons = Array.from(context.container.querySelectorAll('.btn-danger'));
            expect(deleteButtons).toEqual([]);
        });

        it('when not permitted, delete button for own photo only', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: false,
                canUploadPhotos: false,
                canDeletePhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const deleteButtons = Array.from(context.container.querySelectorAll('.btn-danger'));
            expect(deleteButtons.length).toEqual(1);
        });

        it('when permitted, delete buttons for all photos', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto, anotherPhoto ],
                canViewAllPhotos: true,
                canUploadPhotos: false,
                canDeletePhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const deleteButtons = Array.from(context.container.querySelectorAll('.btn-danger'));
            expect(deleteButtons.length).toEqual(2);
        });
    });

    describe('interactivity', () => {
        const account: UserDto = {
            name: 'USER',
            givenName: '',
            emailAddress: '',
        };
        const myPhoto: PhotoReferenceDto = {
            id: createTemporaryId(),
            contentType: 'image/png',
            author: account.name,
            created: '2023-01-01T04:05:06',
            fileSize: 1234,
        };

        it('can view photo by clicking on item', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto ],
                canViewAllPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos[0].href).toEqual(`https://localhost:7247/api/Photo/${myPhoto.id}/`);
        });

        it('uploads when file selected', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            await setPhoto();

            expect(upload).not.toBeNull();
        });

        it('can select a file by clicking on the visible control', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            const visibleUploadContainer = context.container.querySelector('div[datatype="upload-control"]');
            expect(visibleUploadContainer).toBeTruthy();
            await doClick(visibleUploadContainer);

            // TODO: set the file via the browse-for-file dialog, which may not be possible in tests
            reportedError.verifyNoError();
        });

        it('closes dialog if upload handler returns true', async () => {
            uploadResult = true;

            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            await setPhoto();

            expect(upload).not.toBeNull();
            expect(closed).toEqual(true);
        });

        it('does not close if upload handler returns false', async () => {
            uploadResult = false;

            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            await setPhoto();

            expect(upload).not.toBeNull();
            expect(closed).toEqual(false);
        });

        it('can close the dialog', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
                doDelete,
            });

            await doClick(findButton(context.container, 'Close'));

            expect(closed).toEqual(true);
        });

        it('does not delete photo when cancelled', async () => {
            uploadResult = true;

            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto ],
                canUploadPhotos: true,
                canDeletePhotos: true,
                doUpload,
                onClose,
                doDelete,
            });
            let confirm: string;
            window.confirm = (msg: string) => {
                confirm = msg;
                return false;
            };

            await doClick(findButton(context.container, '🗑'));

            expect(confirm).toEqual('Are you sure you want to delete this photo?');
            expect(deleteId).toBeNull();
        });

        it('can delete own photo when not permitted', async () => {
            uploadResult = true;

            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ myPhoto ],
                canUploadPhotos: true,
                canDeletePhotos: true,
                doUpload,
                onClose,
                doDelete,
            });
            window.confirm = () => true;

            await doClick(findButton(context.container, '🗑'));

            expect(deleteId).toEqual(myPhoto.id);
        });
    });
});
