import React, { useState } from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "../division_teams/EditTeamDetails";
import {GameApi} from "../../api/game";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function NewFixtureDate({ fixtures, teams, date, onNewTeam, divisionId, seasonId, isKnockout }) {
    const [ homeTeamId, setHomeTeamId ] = useState(null);
    const [ awayTeamId, setAwayTeamId ] = useState(null);
    const [ newTeamFor, setNewTeamFor ] = useState(null);
    const [ saving, setSaving ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ clipCellRegion, setClipCellRegion ] = useState(false);
    const [ teamDetails, setTeamDetails ] = useState({
        name: '',
        address: '',
    });
    const newTeam = { value: 'NEW_TEAM', text: '➕ Add a team...' };

    function toggleCellClip(isOpen) {
        setClipCellRegion(!isOpen);
    }

    const unselectedTeamsInDivision = teams
        .filter(t => {
            const alreadySelected = fixtures
                .map(f => f.fixtures.filter(f => (f.homeTeam && f.homeTeam.id === t.id) || (f.awayTeam && f.awayTeam.id === t.id)).length)
                .reduce((prev, count) => prev + count, 0);
            return alreadySelected === 0;
        })
        .map(t => { return { value: t.id, text: t.name } });

    function setHomeTeam(id) {
        if (id === newTeam.value) {
            setHomeTeamId(null);
            setNewTeamFor('home');
        } else {
            setNewTeamFor(null);
            setHomeTeamId(id);
        }
    }

    function setAwayTeam(id) {
        if (id === newTeam.value) {
            setAwayTeamId(null);
            setNewTeamFor('away');
        } else {
            setNewTeamFor(null);
            setAwayTeamId(id);
        }
    }

    async function teamCreated(team) {
        await onNewTeam();

        const hasFixtures = fixtures.filter(f => f.date === date).length;
        if (newTeamFor === 'home') {
            setHomeTeam(hasFixtures ? null : team.id);
            setNewTeamFor(null);
        } else if (newTeamFor === 'away') {
            setAwayTeam(hasFixtures ? null : team.id);
            setNewTeamFor(null);
        }
    }

    function onChange(name, value) {
        const newTeamDetails = Object.assign({}, teamDetails);
        newTeamDetails[name] = value;
        setTeamDetails(newTeamDetails);
    }

    function renderNewTeamDialog() {
        return (<Dialog title="Create a new team...">
          <EditTeamDetails
              divisionId={divisionId}
              seasonId={seasonId}
              {...teamDetails}
              onCancel={() => setNewTeamFor(null)} id={null}
              onSaved={teamCreated}
              onChange={onChange} />
        </Dialog>)
    }

    async function saveFixture() {
        if (saving) {
            return;
        }

        setSaving(true);
        try {
            const api = new GameApi(new Http(new Settings()));
            const homeTeam = teams.filter(t => t.id === homeTeamId)[0];
            const awayTeam = teams.filter(t => t.id === awayTeamId)[0];

            const result = await api.update({
                id: undefined,
                address: homeTeam.address,
                divisionId: divisionId,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                date: date,
            });

            if (result.success) {
                if (onNewTeam) {
                    await onNewTeam();
                }
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    return (<tr>
        <td style={{ overflow: (clipCellRegion ? 'clip' : 'initial')}}>
            <BootstrapDropdown
                value={homeTeamId}
                onChange={setHomeTeam}
                onOpen={toggleCellClip}
                options={unselectedTeamsInDivision.filter(t => t.value !== awayTeamId).concat([ newTeam ])} />
        </td>
        <td className="narrow-column"></td>
        <td className="narrow-column">vs</td>
        <td className="narrow-column"></td>
        <td style={{ overflow: (clipCellRegion ? 'clip' : 'initial')}}>
            <BootstrapDropdown
                value={awayTeamId}
                onChange={setAwayTeam}
                onOpen={toggleCellClip}
                options={unselectedTeamsInDivision.filter(t => t.value !== homeTeamId).concat([ newTeam ])} />
        </td>
        <td className="medium-column-width">
            {newTeamFor ? renderNewTeamDialog() : null}
            {homeTeamId && awayTeamId ? (<button className="btn btn-sm btn-primary" onClick={saveFixture}>
                {saving ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '💾'}
            </button>) : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>
    </tr>);
}
