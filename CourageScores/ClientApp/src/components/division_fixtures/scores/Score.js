import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {Settings} from "../../../api/settings";
import {GameApi} from "../../../api/game";
import {Http} from "../../../api/http";
import {TeamApi} from "../../../api/team";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {Link} from 'react-router-dom';
import {NavItem, NavLink} from "reactstrap";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {DivisionControls} from "../../DivisionControls";
import {SeasonApi} from "../../../api/season";
import {nameSort} from "../../../Utilities";
import {Loading} from "../../common/Loading";
import {MergeMatch} from "./MergeMatch";
import {HiCheckAnd180s} from "./HiCheckAnd180s";
import {MergeManOfTheMatch} from "./MergeManOfTheMatch";
import {ManOfTheMatchInput} from "./ManOfTheMatchInput";
import {MergeHiCheckAnd180s} from "./MergeHiCheckAnd180s";
import {ScoreCardHeading} from "./ScoreCardHeading";
import {GameDetails} from "./GameDetails";

export function Score({account, apis, divisions}) {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState('init');
    const [data, setData] = useState(null);
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [season, setSeason] = useState(null);
    const [division, setDivision] = useState(null);
    const [seasons, setSeasons] = useState(null);
    const [access, setAccess] = useState(null);
    const [submission, setSubmission] = useState(null);

    useEffect(() => {
        if (account && account.access) {
            if (account.access.manageScores) {
                setAccess('admin');
            } else if (account.teamId) {
                setAccess('clerk');
            }
        } else {
            setAccess('readonly');
        }
    }, [account]);

    useEffect(() => {
            if (loading !== 'init') {
                return;
            }

            setLoading('loading');
            loadFixtureData();
        },
        // eslint-disable-next-line
        [loading]);

    async function loadTeamPlayers(teamId, seasonId, teamType, matches) {
        const http = new Http(new Settings());
        const teamApi = new TeamApi(http);
        const teamData = await teamApi.get(teamId);

        if (!teamData) {
            setError(`${teamType} team could not be found`);
            return;
        }

        if (!teamData.seasons) {
            setError(`${teamType} team has no seasons`);
            return;
        }

        const teamSeasons = Object.fromEntries(teamData.seasons.map(season => [season.seasonId, season]));

        if (!teamSeasons[seasonId]) {
            setError(`${teamType} team has not registered for this season: ${seasonId}`);
            return;
        }

        const players = teamSeasons[seasonId].players;

        matches.forEach(match => {
           const matchPlayers = match[teamType + 'Players'];
           matchPlayers.forEach(matchPlayer => {
               const correspondingPlayer = players.filter(p => p.id === matchPlayer.id)[0];
               if (correspondingPlayer && correspondingPlayer.name !== matchPlayer.name && !correspondingPlayer.renamed) {
                   correspondingPlayer.name = `${correspondingPlayer.name} (nee ${matchPlayer.name})`;
                   correspondingPlayer.renamed = true;
               }
               if (correspondingPlayer && correspondingPlayer.captain) {
                   matchPlayer.captain = correspondingPlayer.captain;
               }
           });
        });

        players.sort(nameSort);
        players.push({
            id: NEW_PLAYER,
            name: 'Add a player...'
        });
        return players;
    }

    async function loadFixtureData() {
        const http = new Http(new Settings());
        const gameApi = new GameApi(http);
        const seasonApi = new SeasonApi(http);
        const gameData = await gameApi.get(fixtureId);

        try {
            if (!gameData) {
                setError('Game could not be found');
                return;
            }

            if (!gameData.home || !gameData.away) {
                setError('Either home or away team are undefined for this game');
                return;
            }

            const homeTeamPlayers = await loadTeamPlayers(gameData.home.id, gameData.seasonId, 'home', gameData.matches);

            if (error || !homeTeamPlayers) {
                return;
            }

            const awayTeamPlayers = await loadTeamPlayers(gameData.away.id, gameData.seasonId, 'away', gameData.matches);

            if (error || !awayTeamPlayers) {
                return;
            }

            setHomeTeam(homeTeamPlayers);
            setAwayTeam(awayTeamPlayers);

            const allPlayers = homeTeamPlayers.concat(awayTeamPlayers).filter(p => p.id !== NEW_PLAYER);
            allPlayers.sort(nameSort);

            if (!gameData.matches || !gameData.matches.length) {
                gameData.matches = [{ playerCount: 1 }, { playerCount: 1 }, { playerCount: 1 }, { playerCount: 1 }, { playerCount: 1 }, { playerCount: 2 }, { playerCount: 2 }, { playerCount: 3 }];
            }

            setAllPlayers(allPlayers);
            setFixtureData(gameData);
            setData(gameData);

            const seasonsResponse = await seasonApi.getAll();
            const season = seasonsResponse.filter(s => s.id === gameData.seasonId)[0];

            setSeason(season);
            setSeasons(seasonsResponse);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading('ready');
        }
    }

    useEffect(() => {
        if (!fixtureData || !divisions) {
            return;
        }

        const division = divisions[fixtureData.divisionId];
        if (division) {
            setDivision(division);
        }
    }, [ divisions, fixtureData, data ]);

    function onMatchChanged(newMatch, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData.matches[index] = newMatch;

        setFixtureData(newFixtureData);
    }

    async function saveScores() {
        if (access === 'readonly') {
            return;
        }

        try {
            const http = new Http(new Settings());
            const gameApi = new GameApi(http);

            setSaving(true);
            const response = await gameApi.updateScores(fixtureId, fixtureData);

            if (!response.success) {
                setSaveError(response);
            } else {
                setData(response.result);
                setFixtureData(response.result);
            }
        } finally {
            setSaving(false);
        }
    }

    function setMatch(index, match) {
        const newFixtureData = Object.assign({}, fixtureData);
        const matchOnlyProperties = Object.assign({}, match);
        matchOnlyProperties.oneEighties = [];
        matchOnlyProperties.over100Checkouts = [];

        newFixtureData.matches[index] = Object.assign(matchOnlyProperties, newFixtureData.matches[index]);

        setFixtureData(newFixtureData);
    }

    async function unpublish() {
        if (saving) {
            return;
        }

        try {
            setSaving(true);

            const newData = Object.assign({}, data);
            newData.matches = [ {}, {}, {}, {}, {}, {}, {}, {} ];
            newData.resultsPublished = false;
            setData(newData);
            if (submission) {
                setFixtureData(newData[submission + 'Submission']);
            } else {
                setFixtureData(newData);
            }

            alert('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
        } finally {
            setSaving(false);
        }
    }

    function renderMatchPlayerSelection(index, noOfLegs, playerCount) {
        let matchIndex = 0;
        const matchesExceptIndex = fixtureData.matches.filter(match => {
            return matchIndex++ !== index && match.playerCount === playerCount;
        });

        return (<MatchPlayerSelection
            numberOfLegs={noOfLegs} playerCount={playerCount} homePlayers={homeTeam} awayPlayers={awayTeam}
            match={fixtureData.matches[index]} account={account}
            disabled={access === 'readonly'} readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
            onMatchChanged={(newMatch) => onMatchChanged(newMatch, index)}
            otherMatches={matchesExceptIndex}
            onPlayerChanged={loadFixtureData}
            home={fixtureData.home} away={fixtureData.away}
            seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />);
    }

    function renderMergeMatch(index) {
        if (!fixtureData.resultsPublished && access === 'admin' && submission === null && (data.homeSubmission || data.awaySubmission)) {
            return (<MergeMatch
                readOnly={saving} matchIndex={index}
                matches={fixtureData.matches}
                homeSubmission={fixtureData.homeSubmission}
                awaySubmission={fixtureData.awaySubmission}
                acceptSubmission={(match) => setMatch(index, match)} />);
        }

        return null;
    }

    function renderManOfTheMatchInput() {
        if (access !== 'readonly' && (!fixtureData.resultsPublished || access === 'admin')) {
            return (<ManOfTheMatchInput
                fixtureData={fixtureData}
                allPlayers={allPlayers}
                account={account}
                saving={saving}
                access={access}
                setFixtureData={setFixtureData} />);
        }

        return null;
    }

    function renderMergeManOfTheMatch() {
        if (!fixtureData.resultsPublished
            && access === 'admin'
            && (data.homeSubmission || data.awaySubmission)
            && ((!data.home.manOfTheMatch && data.homeSubmission.home.manOfTheMatch) || (!data.away.manOfTheMatch && data.awaySubmission.away.manOfTheMatch))) {
            return (<MergeManOfTheMatch data={data} setData={setData} allPlayers={allPlayers} />);
        }

        return null;
    }

    function render180sAndHiCheckInput() {
        return (<HiCheckAnd180s
            saving={saving}
            access={access}
            fixtureData={fixtureData}
            setFixtureData={setFixtureData}
            allPlayers={allPlayers} />);
    }

    function renderMerge180sAndHiCheck() {
        if (!fixtureData.resultsPublished && access === 'admin' && (data.homeSubmission || data.awaySubmission)) {
            return (<MergeHiCheckAnd180s data={data} fixtureData={fixtureData} setFixtureData={setFixtureData} />);
        }

        return null;
    }

    if (loading !== 'ready') {
        return (<Loading />);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    if (!allPlayers) {
        return (<div className="light-background p-3">There are no players for the home and/or away teams</div>);
    }

    const finalScore = fixtureData.matches.map(match => {
        return { awayScore: match.awayScore, homeScore: match.homeScore };
    }).reduce((prev, current) => {
        return {
            awayScore: prev.awayScore + current.awayScore,
            homeScore: prev.homeScore + current.homeScore
        };
    }, { awayScore: 0, homeScore: 0 });
    const winner = finalScore.homeScore > finalScore.awayScore
        ? 'home'
        : (finalScore.awayScore > finalScore.homeScore ? 'away' : null);
    const hasBeenPlayed = fixtureData.matches.filter(m => m.homeScore || m.awayScore).length > 0;

    return (<div>
        <DivisionControls
            reloadAll={apis.reloadAll}
            seasons={seasons}
            account={account}
            originalSeasonData={{
                id: season.id,
                name: season.name,
                startDate: season.startDate.substring(0, 10),
                endDate: season.endDate.substring(0, 10),
            }}
            originalDivisionData={division}
            divisions={divisions}
            onReloadDivisionData={apis.reloadAll}
            overrideMode="fixtures" />
        {fixtureData ? (<ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-dark active"
                         to={`/score/${fixtureId}`}>Fixture</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>) : null}
        <div className="light-background p-3 overflow-auto">
            {fixtureData.address || access === 'admin'
                ? (<GameDetails data={data} saving={saving} setData={setData} access={access} fixtureData={fixtureData} />)
                : null}
            <table className="table minimal-padding">
                <ScoreCardHeading access={access} data={data} account={account} winner={winner} setSubmission={setSubmission} setFixtureData={setFixtureData} submission={submission} />
                {hasBeenPlayed || (access === 'admin' || (account && data.away && account.teamId === data.away.id && access === 'clerk')) ? (<tbody>
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Singles</td>
                </tr>
                {renderMatchPlayerSelection(0, 5, 1)}
                {renderMergeMatch(0)}
                {renderMatchPlayerSelection(1, 5, 1)}
                {renderMergeMatch(1)}
                {renderMatchPlayerSelection(2, 5, 1)}
                {renderMergeMatch(2)}
                {renderMatchPlayerSelection(3, 5, 1)}
                {renderMergeMatch(3)}
                {renderMatchPlayerSelection(4, 5, 1)}
                {renderMergeMatch(4)}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Doubles</td>
                </tr>
                {renderMatchPlayerSelection(5, 3, 2)}
                {renderMergeMatch(5)}
                {renderMatchPlayerSelection(6, 3, 2)}
                {renderMergeMatch(6)}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Triples</td>
                </tr>
                {renderMatchPlayerSelection(7, 3, 3)}
                {renderMergeMatch(7)}
                {renderManOfTheMatchInput()}
                {renderMergeManOfTheMatch()}
                {render180sAndHiCheckInput()}
                {renderMerge180sAndHiCheck()}
                </tbody>) : (<tbody><tr><td colSpan="5">No scores, yet</td></tr></tbody>)}
            </table>
            {access !== 'readonly' && (!data.resultsPublished || access === 'admin') ? (<button className="btn btn-primary" onClick={saveScores}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                 aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
            {access === 'admin' && data.resultsPublished && (data.homeSubmission || data.awaySubmission) ? (<button className="btn btn-warning margin-left" onClick={unpublish}>Unpublish</button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save score" />) : null}
    </div>);
}
