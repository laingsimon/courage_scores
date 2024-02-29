import {MouseEvent, useState} from 'react';
import {PhotoReferenceDto} from "../../interfaces/models/dtos/PhotoReferenceDto";
import {Dialog} from "./Dialog";
import {useApp} from "./AppContainer";
import {renderDate} from "../../helpers/rendering";
import {useDependencies} from "./IocContainer";
import {LoadingSpinnerSmall} from "./LoadingSpinnerSmall";

export interface IPhotoManagerProps {
    doUpload: (file: File) => Promise<boolean>;
    onClose?: () => Promise<any>;
    photos: PhotoReferenceDto[];

    canViewAllPhotos?: boolean;
    canUploadPhotos?: boolean;
}

export function PhotoManager({ photos, onClose, doUpload, canViewAllPhotos, canUploadPhotos }: IPhotoManagerProps) {
    const { settings } = useDependencies();
    const { account } = useApp();
    const [uploading, setUploading] = useState(false);
    // const canViewAllPhotos: boolean = account && account.access && account.access.manageScores;
    // const canUploadPhotos: boolean = account && account.access && account.access.uploadPhotos;
    const myPhotos: PhotoReferenceDto[] = account
        ? photos.filter((p: PhotoReferenceDto) => p.author === account.name)
        : [];
    const photosToShow: PhotoReferenceDto[] = canViewAllPhotos ? photos : myPhotos;

    function getDownloadAddress(photo: PhotoReferenceDto): string {
        return `${settings.apiHost}/api/Photo/${photo.id}`;
    }

    async function uploadPhoto() {
        /* istanbul ignore next */
        if (uploading) {
            /* istanbul ignore next */
            return;
        }

        setUploading(true);

        try {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input.files.length === 0) {
                window.alert(`Select a photo first`);
                return;
            }

            if (await doUpload(input.files[0])) {
                await onClose();
            }
        } finally {
            setUploading(false);
        }
    }

    function getFileSize(bytes: number): string {
        const suffix: string[] = [ 'b', 'kb', 'mb' ];
        let value: number = bytes;
        while (value > 1024 && suffix.length > 1) {
            value = value / 1024;
            suffix.shift();
        }

        return `${value.toFixed(0)}${suffix[0]}`;
    }

    function triggerFileClick(event: MouseEvent) {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        input.click();
        event.preventDefault();
        return false;
    }

    return (<Dialog title="Photos">
        <div className="list-group mb-2">
            <div>Click to open in new tab</div>
            {photosToShow.map((photo: PhotoReferenceDto) => (
                <a href={getDownloadAddress(photo)} className="list-group-item" target="_blank" rel="noreferrer"
                   key={photo.id} title={`${photo.fileName}: ${getFileSize(photo.fileSize)}`}>
                    from {photo.author} on {renderDate(photo.created)}

                    <img src={getDownloadAddress(photo)} className="float-end" height="50" alt={`${photo.fileName}`} title={photo.contentType} />
                </a>))}
        </div>
        {canUploadPhotos && !uploading ? (<>
            <div className="mb-2 text-center border-dashed border-1 border-dark" onClick={triggerFileClick}>
                <button className="border-0 p-2 text-center text-decoration-none text-dark bg-white">
                    <div className="h2 opacity-50">📷</div>
                    Upload photo
                </button>
            </div>
            <input type="file" accept="image/*" className="visually-hidden" onChange={uploadPhoto} />
        </>) : null}
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
            {canUploadPhotos ? (<button className="btn btn-primary" onClick={uploadPhoto}>
                {uploading ? (<LoadingSpinnerSmall/>) : null}
                Upload
            </button>) : null}
        </div>
    </Dialog>);
}
