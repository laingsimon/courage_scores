import {ChangeEvent, MouseEvent, useState} from 'react';
import {PhotoReferenceDto} from "../../interfaces/models/dtos/PhotoReferenceDto";
import {Dialog} from "./Dialog";
import {useApp} from "./AppContainer";
import {renderDate} from "../../helpers/rendering";
import {useDependencies} from "./IocContainer";
import {LoadingSpinnerSmall} from "./LoadingSpinnerSmall";
import {any} from "../../helpers/collections";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IPhotoManagerProps {
    doUpload(file: File): Promise<boolean>;
    doDelete(id: string): Promise<boolean>;
    onClose?(): UntypedPromise;
    photos: PhotoReferenceDto[];

    canViewAllPhotos?: boolean;
    canUploadPhotos?: boolean;
    canDeletePhotos?: boolean;
}

export function PhotoManager({ photos, onClose, doUpload, canViewAllPhotos, canUploadPhotos, canDeletePhotos, doDelete }: IPhotoManagerProps) {
    const { settings } = useDependencies();
    const { account } = useApp();
    const [uploading, setUploading] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const myPhotos: PhotoReferenceDto[] = (photos || []).filter((p: PhotoReferenceDto) => p.author === account?.name);
    const photosToShow: PhotoReferenceDto[] = canViewAllPhotos ? (photos || []) : myPhotos;
    const showPhotoSize: boolean = !!(account && account.access && (account.access.viewAnyPhoto || account.access.deleteAnyPhoto));

    function getDownloadAddress(photo: PhotoReferenceDto, height?: number): string {
        return `${settings.apiHost}/api/Photo/${photo.id}/${height ? height : ''}`;
    }

    async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
        /* istanbul ignore next */
        if (uploading) {
            /* istanbul ignore next */
            return;
        }

        setUploading(true);

        try {
            const input = event.target;
            if (await doUpload(input.files![0])) {
                if (onClose) {
                    await onClose();
                }
            }
        } finally {
            setUploading(false);
        }
    }

    async function deletePhoto(event: MouseEvent, id: string) {
        event.preventDefault();

        /* istanbul ignore next */
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm('Are you sure you want to delete this photo?')) {
            return;
        }

        setDeleting(id);

        try {
            if (await doDelete(id)) {
                if (onClose) {
                    await onClose();
                }
            }
        } finally {
            setDeleting(null);
        }
    }

    function canDeletePhoto(photo: PhotoReferenceDto): boolean {
        if (!canDeletePhotos) {
            return false;
        }

        if (canViewAllPhotos) {
            return true;
        }

        return photo.author === account?.name;
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

    function triggerFileClick(event: MouseEvent, idOfFileElement: string) {
        /* istanbul ignore next */
        if (uploading) {
            /* istanbul ignore next */
            return;
        }

        const input = document.getElementById(idOfFileElement) as HTMLInputElement;
        input.click();
        event.preventDefault();
        return false;
    }

    return (<Dialog title="Photos">
        <div className="list-group mb-2">
            {any(photosToShow) ? (<div>Click to open in new tab</div>) : null}
            {photosToShow.map((photo: PhotoReferenceDto) => (
                <a href={getDownloadAddress(photo)} className="list-group-item ps-2" target="_blank" rel="noreferrer"
                   key={photo.id} title={`${photo.fileName}: ${getFileSize(photo.fileSize!)}`}>
                    {canDeletePhoto(photo)
                        ? (<button className="btn btn-sm btn-danger float-start margin-right"
                                   onClick={async (event) => await deletePhoto(event, photo.id!)}>
                            {deleting === photo.id ? (<LoadingSpinnerSmall/>) : '🗑'}
                        </button>)
                        : null}
                    {photo.author} on {renderDate(photo.created!)}

                    <img  className="float-end" height="50"
                          src={getDownloadAddress(photo, 50)}
                          alt={`${photo.fileName}`}
                          title={photo.contentType}
                          loading="lazy" />

                    {showPhotoSize ? (<div className="ps-2 small">
                        {getFileSize(photo.fileSize!)}
                    </div>) : null}
                </a>))}
        </div>
        {canUploadPhotos ? (<>
            <div datatype="upload-control" className="mb-2 text-center border-dashed border-1 border-dark"
                 onClick={(event: MouseEvent) => triggerFileClick(event, 'fromCamera')}>
                <button className="border-0 p-2 text-center text-decoration-none text-dark bg-white">
                    {uploading
                        ? (<LoadingSpinnerSmall/>)
                        : (<>
                            <div className="h2 opacity-50">📷</div>
                            Take a photo
                        </>)}
                </button>
            </div>
            <input id="fromCamera" type="file" accept="image/*" className="visually-hidden" capture="environment" onChange={uploadPhoto}/>
            {uploading ? null : (<div datatype="upload-control" className="mb-2 text-center border-dashed border-1 border-dark"
                 onClick={(event: MouseEvent) => triggerFileClick(event, 'fromDevice')}>
                <button className="border-0 p-2 text-center text-decoration-none text-dark bg-white">
                    {uploading
                        ? (<LoadingSpinnerSmall/>)
                        : (<>
                            <div className="h2 opacity-50">📤</div>
                            Upload an image
                        </>)}
                </button>
            </div>)}
            <input id="fromDevice" type="file" accept="image/*" className="visually-hidden" onChange={uploadPhoto}/>
        </>) : null}
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        </div>
    </Dialog>);
}