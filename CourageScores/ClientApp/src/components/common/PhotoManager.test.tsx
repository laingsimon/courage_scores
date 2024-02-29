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

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        upload = null;
        uploadResult = true;
        closed = false;
        reportedError = new ErrorState();
    });

    async function doUpload(file: File) {
        upload = file;
        return uploadResult;
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
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos.map(p => p.textContent)).toEqual([
                `from ${myPhoto.author} on ${renderDate(myPhoto.created)}`,
                `from ${anotherPhoto.author} on ${renderDate(anotherPhoto.created)}`
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
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos.map(p => p.textContent)).toEqual([
                `from ${myPhoto.author} on ${renderDate(myPhoto.created)}`,
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
            });

            const uploadButton = context.container.querySelector('.btn-primary');
            expect(uploadButton).toBeTruthy();
            expect(uploadButton.textContent).toEqual('Upload');
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
            });

            const uploadButton = context.container.querySelector('.btn-primary');
            expect(uploadButton).toBeFalsy();
            const fileUploadControl = context.container.querySelector('input[type="file"]');
            expect(fileUploadControl).toBeFalsy();
            const visibleUploadContainer = context.container.querySelector('div[datatype="upload-control"]');
            expect(visibleUploadContainer).toBeFalsy();
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
            });

            const photos = Array.from(context.container.querySelectorAll('.list-group .list-group-item')) as HTMLAnchorElement[];
            expect(photos[0].href).toEqual(`https://localhost:7247/api/Photo/${myPhoto.id}`);
        });

        it('does not upload when no photo selected', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
            });
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Upload'));

            expect(upload).toBeNull();
            expect(alert).toEqual('Select a photo first');
        });

        it('uploads when file selected', async () => {
            await renderComponent(appProps({
                account
            }, reportedError), {
                photos: [ ],
                canUploadPhotos: true,
                doUpload,
                onClose,
            });

            await setPhoto();

            expect(upload).not.toBeNull();
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
            });

            await doClick(findButton(context.container, 'Close'));

            expect(closed).toEqual(true);
        });
    });
});