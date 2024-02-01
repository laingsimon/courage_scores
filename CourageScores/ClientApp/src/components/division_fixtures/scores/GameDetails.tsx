import React from "react";
import {ShareButton} from "../../common/ShareButton";
import {valueChanged} from "../../../helpers/events";
import {useBranding} from "../../../BrandingContainer";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";

export interface IGameDetailsProps {
    saving: boolean;
    access: string;
    fixtureData: GameDto;
    setFixtureData: (newData: GameDto) => Promise<any>;
}

export function GameDetails({saving, access, fixtureData, setFixtureData}: IGameDetailsProps) {
    const {name} = useBranding();

    if (access !== 'admin') {
        return (<div>
            <span className="fw-bold text-secondary">Playing at</span>: {fixtureData.address}
            {fixtureData.postponed ? (<span className="margin-left fw-bold text-danger ml-3">Postponed</span>) : null}
            {fixtureData.home && fixtureData.away ? (<span className="margin-left">
                <ShareButton text={`${name}: ${fixtureData.home.name} vs ${fixtureData.away.name}`}/>
            </span>) : null}
        </div>);
    }

    return (<div>
        <div className="input-group mb-3">
            <input disabled={saving} type="date" name="date" className="form-control margin-right date-selection"
                   value={fixtureData.date.substring(0, 10)} onChange={valueChanged(fixtureData, setFixtureData)}/>
            <input disabled={saving} type="text" name="address" className="form-control margin-right"
                   value={fixtureData.address || ''} onChange={valueChanged(fixtureData, setFixtureData)}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox" className="form-check-input" name="postponed" id="postponed"
                       checked={fixtureData.postponed} onChange={valueChanged(fixtureData, setFixtureData)}/>
                <label className="form-check-label" htmlFor="postponed">Postponed</label>
            </div>
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                       checked={fixtureData.isKnockout} onChange={valueChanged(fixtureData, setFixtureData)}/>
                <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
            </div>
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox" className="form-check-input" name="accoladesCount"
                       id="accoladesCount" checked={fixtureData.accoladesCount}
                       onChange={valueChanged(fixtureData, setFixtureData)}/>
                <label className="form-check-label" htmlFor="accoladesCount">180s and hi-checks count</label>
            </div>
        </div>
    </div>);
}