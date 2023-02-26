import React, {useEffect, useState} from 'react';
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {SeasonApi} from "../../api/season";
import {useNavigate} from "react-router-dom";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {propChanged, sortBy, valueChanged} from "../../Utilities";

export function NewSeason({divisions}) {
    const [ saving, setSaving ] = useState(false);
    const [ newSeasonError, setNewSeasonError] = useState(null);
    const [ seasons, setSeasons ] = useState([]);
    const [ newSeason, setNewSeason ] = useState({
        name: '',
        startDate: '',
        endDate: '',
        copyTeamsFromSeasonId: null,
        divisionIds: []
    });
    const api = new SeasonApi(new Http(new Settings()));
    const navigate = useNavigate();

    useEffect(() => {
        getSeasons();
    });

    function toggleDivision(divisionId) {
        const newData = Object.assign({}, newSeason);

        if (isDivisionSelected(divisionId)) {
            newData.divisionIds = newData.divisionIds.filter(id => id !== divisionId)
        } else {
            newData.divisionIds = (newData.divisionIds || []).concat(divisionId);
        }

        setNewSeason(newData);
    }

    function isDivisionSelected(divisionId) {
        return (newSeason.divisionIds || []).filter(id => id === divisionId).length > 0;
    }

    async function getSeasons() {
        const seasons = await api.getAll();
        setSeasons(seasons.map(s => { return { value: s.id, text: `${s.name} (${new Date(s.startDate).toDateString()} - ${new Date(s.endDate).toDateString()})` } }));
    }

    async function createSeason() {
        if (saving) {
            return;
        }

        if (!newSeason.name) {
            window.alert('You must enter a name');
            return;
        }

        setSaving(true);

        try {
            const response = await api.update(newSeason);

            if (response.success) {
                window.alert('Season created');
                navigate(`/`);
            } else {
                setNewSeasonError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    return (<div className="light-background p-3">
        <h3>Enter details for new season</h3>

        <div className="input-group margin-right mt-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input name="name" value={newSeason.name} className="form-control" onChange={valueChanged(newSeason, setNewSeason)} />
        </div>
        <div className="input-group margin-right mt-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Start date</span>
            </div>
            <input name="startDate" value={newSeason.startDate} className="form-control margin-right" type="date" onChange={valueChanged(newSeason, setNewSeason)} />
            <div className="input-group-prepend">
                <span className="input-group-text">End date</span>
            </div>
            <input name="endDate" value={newSeason.endDate} className="form-control margin-right" type="date" onChange={valueChanged(newSeason, setNewSeason)} />
        </div>
        <div className="input-group margin-right my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Use teams from season</span>
            </div>
            <BootstrapDropdown value={newSeason.copyTeamsFromSeasonId} options={seasons} onChange={propChanged(newSeason, setNewSeason, 'copyTeamsFromSeasonId')} />
        </div>
        <div>
            <h6>Divisions</h6>
            <ul className="list-group mb-3">
                {divisions.sort(sortBy('name')).map(d => (<li key={d.id} className={`list-group-item ${isDivisionSelected(d.id) ? 'active' : ''}`} onClick={() => toggleDivision(d.id)}>{d.name}</li>))}
            </ul>
        </div>

        <button className="btn btn-primary mt-3" onClick={createSeason}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            Create Season
        </button>
        {newSeasonError ? (<ErrorDisplay {...newSeasonError} onClose={() => setNewSeasonError(null)} title="Could not create season" />) : null}
    </div>)
}
