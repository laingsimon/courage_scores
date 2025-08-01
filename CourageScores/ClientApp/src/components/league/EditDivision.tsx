import { useState } from 'react';
import { valueChanged } from '../../helpers/events';
import { useDependencies } from '../common/IocContainer';
import { useApp } from '../common/AppContainer';
import { useNavigate } from 'react-router';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';

export interface IEditDivisionProps {
    onClose(): UntypedPromise;
    onSave(): UntypedPromise;
    setSaveError(error: IClientActionResultDto<DivisionDto>): UntypedPromise;
    data: DivisionDataDto;
    onUpdateData(data: DivisionDataDto): UntypedPromise;
}

export function EditDivision({
    onClose,
    onSave,
    setSaveError,
    data,
    onUpdateData,
}: IEditDivisionProps) {
    const [saving, setSaving] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const { divisionApi } = useDependencies();
    const { onError } = useApp();
    const navigate = useNavigate();

    async function saveDivision() {
        /* istanbul ignore next */
        if (saving || deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!data.name) {
            window.alert('Enter a division name');
            return;
        }

        try {
            setSaving(true);
            const result: IClientActionResultDto<DivisionDto> =
                await divisionApi.update(
                    Object.assign({ lastUpdated: data.updated }, data),
                );

            if (result.success) {
                await onSave();
            } else {
                await setSaveError(result);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    async function deleteDivision() {
        /* istanbul ignore next */
        if (deleting || saving) {
            /* istanbul ignore next */
            return;
        }

        if (
            !window.confirm(
                `Are you sure you want to delete the ${data.name} division?`,
            )
        ) {
            return;
        }

        try {
            setDeleting(true);
            const result = await divisionApi.delete(data.id!);

            if (result.success) {
                navigate(`https://${document.location.host}`);
            } else {
                await setSaveError(result);
            }
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <label htmlFor="name" className="input-group-text">
                        Name
                    </label>
                </div>
                <input
                    readOnly={saving}
                    value={data.name || ''}
                    onChange={valueChanged(data, onUpdateData)}
                    name="name"
                    id="name"
                    className="form-control margin-right"
                />
            </div>
            <div className="input-group mb-3">
                <div className="form-check form-switch input-group-prepend">
                    <input
                        disabled={saving}
                        type="checkbox"
                        className="form-check-input"
                        name="superleague"
                        id="superleague"
                        checked={data.superleague}
                        onChange={valueChanged(data, onUpdateData)}
                    />
                    <label className="form-check-label" htmlFor="superleague">
                        Superleague
                    </label>
                </div>
            </div>
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
                {data.id ? (
                    <button
                        className="btn btn-danger margin-right"
                        onClick={deleteDivision}>
                        {deleting ? <LoadingSpinnerSmall /> : null}
                        Delete division
                    </button>
                ) : null}
                <button className="btn btn-primary" onClick={saveDivision}>
                    {saving ? <LoadingSpinnerSmall /> : null}
                    {data.id ? 'Update division' : 'Create division'}
                </button>
            </div>
        </div>
    );
}
