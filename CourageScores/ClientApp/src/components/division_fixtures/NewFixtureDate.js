import React, { useState } from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "../division_teams/EditTeamDetails";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {any, propChanged, sum} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function NewFixtureDate({ date }) {
    const { fixtures, id: divisionId, season, teams, onReloadDivision } = useDivisionData();
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
    const { gameApi } = useDependencies();

    function toggleCellClip(isOpen) {
        setClipCellRegion(!isOpen);
    }

    const unselectedTeamsInDivision = teams
        .filter(t => {
            const alreadySelected = sum(fixtures
                .map(f => f.fixtures.filter(f => (f.homeTeam && f.homeTeam.id === t.id) || (f.awayTeam && f.awayTeam.id === t.id)).length));
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
        await onReloadDivision();

        const hasFixtures = any(fixtures, f => f.date === date);
        if (newTeamFor === 'home') {
            setHomeTeam(hasFixtures ? null : team.id);
            setNewTeamFor(null);
        } else if (newTeamFor === 'away') {
            setAwayTeam(hasFixtures ? null : team.id);
            setNewTeamFor(null);
        }
    }

    function renderNewTeamDialog() {
        return (<Dialog title="Create a new team...">
          <EditTeamDetails
              divisionId={divisionId}
              seasonId={season.id}
              {...teamDetails}
              onCancel={() => setNewTeamFor(null)} id={null}
              onSaved={teamCreated}
              onChange={propChanged(teamDetails, setTeamDetails)} />
        </Dialog>)
    }

    async function saveFixture() {
        if (saving) {
            return;
        }

        setSaving(true);
        try {
            const homeTeam = teams.filter(t => t.id === homeTeamId)[0];
            const awayTeam = teams.filter(t => t.id === awayTeamId)[0];

            const result = await gameApi.update({
                id: undefined,
                address: homeTeam.address,
                divisionId: divisionId,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                date: date,
            });

            if (result.success) {
                await onReloadDivision();
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
