import React from "react";

export function GameDetails({ saving, access, fixtureData, setFixtureData }) {
    function changeFixtureProperty(event) {
        if (access !== 'admin') {
            return;
        }

        const newFixtureData = Object.assign({}, fixtureData);
        if (event.target.type === 'checkbox') {
            newFixtureData[event.target.name] = event.target.checked;
        } else {
            newFixtureData[event.target.name] = event.target.value;
        }
        setFixtureData(newFixtureData);
    }

    if (access !== 'admin') {
        return (<div>
            {fixtureData.isKnockout ? (<span className="fw-bold text-primary">Knockout at</span>) : <span className="fw-bold text-secondary">Playing at</span>}: {fixtureData.address}
            {fixtureData.postponed ? (<span className="margin-left fw-bold text-danger ml-3">Postponed</span>) : null}
        </div>);
    }

    return (<div>
        <div className="input-group mb-3">
            <input disabled={saving} type="date" name="date" className="form-control margin-right date-selection" value={fixtureData.date.substring(0, 10)} onChange={changeFixtureProperty} />
            <input disabled={saving} type="text" name="address" className="form-control margin-right" value={fixtureData.address} onChange={changeFixtureProperty} />
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox" className="form-check-input" name="postponed" id="postponed" checked={fixtureData.postponed} onChange={changeFixtureProperty} />
                <label className="form-check-label" htmlFor="postponed">Postponed</label>
            </div>
            <div className="form-check form-switch">
                <input disabled={saving} type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout" checked={fixtureData.isKnockout} onChange={changeFixtureProperty} />
                <label className="form-check-label" htmlFor="isKnockout">Knockout</label>
            </div>
        </div>
    </div>);
}