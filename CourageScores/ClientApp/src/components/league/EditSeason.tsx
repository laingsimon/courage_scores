import {useState} from "react";
import {any, sortBy} from "../../helpers/collections";
import {propChanged, valueChanged} from "../../helpers/events";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {useNavigate} from "react-router";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {DivisionDataSeasonDto} from "../../interfaces/models/dtos/Division/DivisionDataSeasonDto";
import {EditSeasonDto} from "../../interfaces/models/dtos/Season/EditSeasonDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IEditSeasonProps {
    onClose(): UntypedPromise;
    onSave(): UntypedPromise;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    setSaveError(error: any): UntypedPromise;
    data: EditSeasonDto & DivisionDataSeasonDto;
    onUpdateData(season: EditSeasonDto): UntypedPromise;
}

export function EditSeason({onClose, onSave, setSaveError, data, onUpdateData}: IEditSeasonProps) {
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const {seasonApi} = useDependencies();
    const {seasons, divisions, onError} = useApp();
    const navigate = useNavigate();

    async function saveSeason() {
        /* istanbul ignore next */
        if (saving || deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!data.name) {
            window.alert('Enter a season name');
            return;
        }

        try {
            setSaving(true);
            const result = await seasonApi.update(Object.assign({lastUpdated: data.updated}, data));

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

    async function deleteSeason() {
        /* istanbul ignore next */
        if (saving || deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${data.name} season?`)) {
            return;
        }

        try {
            setDeleting(true);
            const result = await seasonApi.delete(data.id);

            if (result.success) {
                navigate(`https://${document.location.host}`);
            } else {
                await setSaveError(result);
            }
        } finally {
            setDeleting(false);
        }
    }

    async function toggleDivision(divisionId: string) {
        const newData = Object.assign({}, data);

        if (isDivisionSelected(divisionId)) {
            newData.divisionIds = newData.divisionIds.filter(id => id !== divisionId);
        } else {
            newData.divisionIds = (newData.divisionIds || []).concat(divisionId);
        }

        await onUpdateData(newData);
    }

    function isDivisionSelected(divisionId: string): boolean {
        return any(data.divisionIds || [], id => id === divisionId);
    }

    return (<div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <label htmlFor="name" className="input-group-text">Name</label>
            </div>
            <input readOnly={saving} id="name" name="name" onChange={valueChanged(data, onUpdateData)} value={data.name || ''}
                   className="form-control margin-right"/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <label htmlFor="startDate" className="input-group-text">From</label>
            </div>
            <input readOnly={saving} id="startDate" name="startDate" onChange={valueChanged(data, onUpdateData)}
                   value={(data.startDate || '').substring(0, 10)} type="date" className="form-control margin-right"/>
            <div className="input-group-prepend">
                <label htmlFor="endDate" className="input-group-text">To</label>
            </div>
            <input readOnly={saving} id="endDate" name="endDate" onChange={valueChanged(data, onUpdateData)}
                   value={(data.endDate || '').substring(0, 10)} type="date" className="form-control margin-right"/>
        </div>
        {data.id ? null : (<div className="input-group margin-right mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Use teams from season</span>
            </div>
            <BootstrapDropdown value={data.copyTeamsFromSeasonId} options={seasons.map(s => {
                return {text: s.name, value: s.id};
            })} onChange={propChanged(data, onUpdateData, 'copyTeamsFromSeasonId')}/>
        </div>)}
        <div>
            <h6>Divisions</h6>
            <ul className="list-group mb-3">
                {divisions.sort(sortBy('name')).map(d => (
                    <li key={d.id} className={`list-group-item ${isDivisionSelected(d.id) ? 'active' : ''}`}
                        onClick={async () => await toggleDivision(d.id)}>{d.name}</li>))}
            </ul>
        </div>
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
            {data.id ? (<button className="btn btn-danger margin-right" onClick={deleteSeason}>
                {deleting ? (<LoadingSpinnerSmall/>) : null}
                Delete season
            </button>) : null}
            <button className="btn btn-primary" onClick={saveSeason}>
                {saving ? (<LoadingSpinnerSmall/>) : null}
                {data.id ? 'Update season' : 'Create season'}
            </button>
        </div>
    </div>);
}
