import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {Link} from 'react-router-dom';
import {NavLink} from "reactstrap";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {DivisionControls} from "../../DivisionControls";
import {any, elementAt, isEmpty, sortBy} from "../../../helpers/collections";
import {propChanged} from "../../../helpers/events";
import {EMPTY_ID, repeat} from "../../../helpers/projection";
import {renderDate} from "../../../helpers/rendering";
import {Loading} from "../../common/Loading";
import {MergeMatch} from "./MergeMatch";
import {HiCheckAnd180s} from "./HiCheckAnd180s";
import {MergeManOfTheMatch} from "./MergeManOfTheMatch";
import {ManOfTheMatchInput} from "./ManOfTheMatchInput";
import {MergeHiCheckAnd180s} from "./MergeHiCheckAnd180s";
import {ScoreCardHeading} from "./ScoreCardHeading";
import {GameDetails} from "./GameDetails";
import {add180, addHiCheck} from "../../common/Accolades";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {LeagueFixtureContainer} from "../LeagueFixtureContainer";
import {MatchTypeContainer} from "./MatchTypeContainer";
import {getMatchDefaults, getMatchOptionDefaults, getMatchOptionsLookup} from "../../../helpers/matchOptions";
import {PageError} from "../../PageError";

export function Score() {
    const { fixtureId } = useParams();
    const { gameApi } = useDependencies();
    const { appLoading, account, divisions, seasons, onError, teams, reloadTeams } = useApp();
    const [loading, setLoading] = useState('init');
    const [data, setData] = useState(null);
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [ createPlayerFor, setCreatePlayerFor ] = useState(null);
    const [ newPlayerDetails, setNewPlayerDetails ] = useState({ name: '', captain: false });
    const access = getAccess();

    function renderCreatePlayerDialog() {
        const team = createPlayerFor.side === 'home' ? fixtureData.home : fixtureData.away;

        async function playerCreated(updatedTeamDetails) {
            await reloadTeams();

            try {
                const updatedTeamSeason = updatedTeamDetails.seasons.filter(ts => ts.seasonId === fixtureData.seasonId)[0];
                if (!updatedTeamSeason) {
                    /* istanbul ignore next */
                    console.log(updatedTeamDetails);
                    onError('Could not find updated teamSeason');
                    return;
                }

                const newPlayers = updatedTeamSeason.players.filter(p => p.name === newPlayerDetails.name);
                if (!any(newPlayers)) {
                    /* istanbul ignore next */
                    console.log(updatedTeamSeason);
                    onError(`Could not find new player in updated season, looking for player with name: "${newPlayerDetails.name}"`);
                    return;
                }

                const newPlayer = newPlayers[0];
                const match = fixtureData.matches[createPlayerFor.matchIndex];
                const newMatch = Object.assign({}, match);
                newMatch[createPlayerFor.side + 'Players'][createPlayerFor.index] = {
                    id: newPlayer.id,
                    name: newPlayer.name
                };

                const newFixtureData = Object.assign({}, fixtureData);
                fixtureData.matches[createPlayerFor.matchIndex] = newMatch;
                setFixtureData(newFixtureData);
            } catch (e) {
                onError(e);
            } finally {
                setCreatePlayerFor(null);
                setNewPlayerDetails({name: '', captain: false});
            }
        }

        return (<Dialog title={`Create ${createPlayerFor.side} player...`}>
            <EditPlayerDetails
                id={null}
                player={newPlayerDetails}
                seasonId={fixtureData.seasonId}
                gameId={fixtureData.id}
                team={team}
                divisionId={fixtureData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={() => setCreatePlayerFor(null)}
                onSaved={playerCreated} />
        </Dialog>);
    }

    function getAccess() {
        if (account && account.access) {
            if (account.access.manageScores) {
                return 'admin';
            } else if (account.teamId) {
                return 'clerk';
            }
        }

        return 'readonly';
    }

    useEffect(() => {
            /* istanbul ignore next */
            if (loading !== 'init') {
                /* istanbul ignore next */
                console.log(`loading=${loading}`);
                /* istanbul ignore next */
                return;
            }

            if (appLoading) {
                /* istanbul ignore next */
                console.log(`appLoading=${appLoading}, seasons.length=${seasons ? seasons.length : '<null>'}, teams.length=${teams ? teams.length : '<null>'}, divisions=${divisions ? divisions.length : '<null>'}`);
                return;
            }

            if (!seasons || !seasons.length) {
                /* istanbul ignore next */
                console.log(`appLoading=${appLoading}, seasons.length=${seasons ? seasons.length : '<null>'}, teams.length=${teams ? teams.length : '<null>'}, divisions=${divisions ? divisions.length : '<null>'}`);
                onError('App has finished loading, no seasons are available');
                return;
            }

            if (!teams || !teams.length) {
                /* istanbul ignore next */
                console.log(`appLoading=${appLoading}, seasons.length=${seasons ? seasons.length : '<null>'}, teams.length=${teams ? teams.length : '<null>'}, divisions=${divisions ? divisions.length : '<null>'}`);
                onError('App has finished loading, no teams are available');
                return;
            }

            if (!divisions || !divisions.length) {
                /* istanbul ignore next */
                console.log(`appLoading=${appLoading}, seasons.length=${seasons ? seasons.length : '<null>'}, teams.length=${teams ? teams.length : '<null>'}, divisions=${divisions ? divisions.length : '<null>'}`);
                onError('App has finished loading, no divisions are available');
                return;
            }

            /* istanbul ignore next */
            console.log(`Loading fixture data (loading=${loading})...`);
            setLoading('loading');
            // noinspection JSIgnoredPromiseFromCall
            loadFixtureData();
        },
        // eslint-disable-next-line
        [ appLoading, seasons, teams, divisions ]);

    function loadTeamPlayers(teamId, seasonId, teamType, matches) {
        const teamData = teams[teamId];

        if (!teamData) {
            onError(`${teamType} team could not be found - ${teamId}`);
            return;
        }

        if (!teamData.seasons) {
            onError(`${teamType} team has no seasons`);
            return;
        }

        const teamSeasons = Object.fromEntries(teamData.seasons.map(season => [season.seasonId, season]));

        if (!teamSeasons[seasonId]) {
            onError(`${teamType} team has not registered for this season: ${seasonId}`);
            return;
        }

        const players = teamSeasons[seasonId].players.filter(p => p); // copy the players list

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

        players.sort(sortBy('name'));
        players.push({
            id: NEW_PLAYER,
            name: 'Add a player...'
        });
        return players;
    }

    useEffect(() => {
            if (fixtureData && loading !== 'init') {
                loadPlayerData(fixtureData);
            }
        },
        // eslint-disable-next-line
        [ teams ]);

    function loadPlayerData(gameData) {
        const homeTeamPlayers = loadTeamPlayers(gameData.home.id, gameData.seasonId, 'home', gameData.matches) || [];
        const awayTeamPlayers = loadTeamPlayers(gameData.away.id, gameData.seasonId, 'away', gameData.matches) || [];

        setHomeTeam(homeTeamPlayers);
        setAwayTeam(awayTeamPlayers);

        const allPlayers = homeTeamPlayers.concat(awayTeamPlayers).filter(p => p.id !== NEW_PLAYER);
        allPlayers.sort(sortBy('name'));
        setAllPlayers(allPlayers);
    }

    async function loadFixtureData() {
        const gameData = await gameApi.get(fixtureId);

        try {
            if (!gameData) {
                onError('Game could not be found');
                return;
            }

            if (gameData.status) {
                /* istanbul ignore next */
                console.log(gameData);
                const suffix = gameData.errors ? ' -- ' + Object.keys(gameData.errors).map(key => `${key}: ${gameData.errors[key]}`).join(', ') : '';
                onError(`Error accessing fixture: Code: ${gameData.status}${suffix}`);
                return;
            }

            if (!gameData.home || !gameData.away) {
                onError('Either home or away team are undefined for this game');
                return;
            }

            if (access === 'admin' || access === 'clerk') {
                loadPlayerData(gameData);
            }

            if (!gameData.matchOptions || isEmpty(gameData.matchOptions)) {
                const matchOptions = getMatchOptionsLookup(gameData.matchOptions);
                gameData.matchOptions = [
                    getMatchOptionDefaults(0, matchOptions),
                    getMatchOptionDefaults(1, matchOptions),
                    getMatchOptionDefaults(2, matchOptions),
                    getMatchOptionDefaults(3, matchOptions),
                    getMatchOptionDefaults(4, matchOptions),
                    getMatchOptionDefaults(5, matchOptions),
                    getMatchOptionDefaults(6, matchOptions),
                    getMatchOptionDefaults(7, matchOptions) ];
            }

            if (!gameData.matches || isEmpty(gameData.matches)) {
                gameData.matches = repeat(8, getMatchDefaults);
            }

            setFixtureData(gameData);
            setData(gameData);
        } catch (e) {
            onError(e);
        } finally {
            setLoading('ready');
        }
    }

    async function saveScores() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        try {
            setSaving(true);
            const response = await gameApi.updateScores(fixtureId, fixtureData, fixtureData.updated);

            if (!response.success) {
                setSaveError(response);
            } else {
                setData(response.result);
                setFixtureData(response.result);
            }
        } catch (e) {
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    async function unpublish() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
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
        } catch (e) {
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    function renderMatchPlayerSelection(index, noOfLegs, playerCount) {
        const matchesExceptIndex = fixtureData.matches.filter((_, matchIndex) => {
            let matchOptions = getMatchOptionDefaults(matchIndex, getMatchOptionsLookup(fixtureData.matchOptions))

            return matchIndex !== index && matchOptions.playerCount === playerCount;
        });

        function onMatchChanged(newMatch, index) {
            const newFixtureData = Object.assign({}, fixtureData);
            newFixtureData.matches[index] = newMatch;

            setFixtureData(newFixtureData);
        }

        function onMatchOptionsChanged(newMatchOptions) {
            const newFixtureData = Object.assign({}, fixtureData);
            newFixtureData.matchOptions[index] = newMatchOptions;

            setFixtureData(newFixtureData);
        }

        function onCreatePlayer(forMatchPlayerIndex) {
            forMatchPlayerIndex.matchIndex = index;
            setCreatePlayerFor(forMatchPlayerIndex);
        }

        const matchTypeProps = {
            matchOptions: elementAt(fixtureData.matchOptions, index) || getMatchOptionDefaults(index, getMatchOptionsLookup(fixtureData.matchOptions)),
            otherMatches: matchesExceptIndex,
            setCreatePlayerFor: onCreatePlayer,
            homePlayers: homeTeam,
            awayPlayers: awayTeam,
        };

        return (<MatchTypeContainer {...matchTypeProps}>
            <MatchPlayerSelection
                match={fixtureData.matches[index]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, index)}
                otherMatches={matchesExceptIndex}
                matchOptions={elementAt(fixtureData.matchOptions, index) || getMatchOptionDefaults(index, getMatchOptionsLookup(fixtureData.matchOptions))}
                onMatchOptionsChanged={onMatchOptionsChanged}
                on180={add180(fixtureData, setFixtureData)}
                onHiCheck={addHiCheck(fixtureData, setFixtureData)}
                setCreatePlayerFor={onCreatePlayer} />
        </MatchTypeContainer>);
    }

    function renderMergeMatch(index) {
        if (!fixtureData.resultsPublished && access === 'admin' && submission === null && (data.homeSubmission || data.awaySubmission)) {
            return (<MergeMatch
                readOnly={saving}
                matchIndex={index}
                matches={fixtureData.matches}
                homeSubmission={fixtureData.homeSubmission}
                awaySubmission={fixtureData.awaySubmission}
                setFixtureData={setFixtureData}
                fixtureData={fixtureData} />);
        }

        return null;
    }

    function renderManOfTheMatchInput() {
        if (access !== 'readonly' && (!fixtureData.resultsPublished || access === 'admin')) {
            return (<ManOfTheMatchInput
                fixtureData={fixtureData}
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

    if (!fixtureData || !fixtureData.matches) {
        return (<PageError error="Unable to load score card, fixture data not loaded" />);
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
    const hasBeenPlayed = any(fixtureData.matches, m => m.homeScore || m.awayScore);

    try {
        const season = seasons[fixtureData.seasonId] || { id: EMPTY_ID, name: 'Not found' };
        const division = divisions[fixtureData.divisionId] || { id: EMPTY_ID, name: 'Not found' };

        const editable = !saving && (access === 'admin' || (!fixtureData.resultsPublished && account && account.access && account.access.inputResults === true));
        const leagueFixtureData = {
            seasonId: season.id,
            divisionId: division.id,
            homePlayers: homeTeam,
            awayPlayers: awayTeam,
            readOnly: !editable,
            disabled: access === 'readonly'
        }

        return (<div>
            <DivisionControls
                originalSeasonData={season}
                originalDivisionData={division}
                overrideMode="fixtures"/>
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <NavLink tag={Link} className="text-light" to={`/division/${data.divisionId}/teams/${season.id}`}>Teams</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link} className="text-light"
                             to={`/division/${data.divisionId}/fixtures/${season.id}`}>Fixtures</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link} className="text-dark active" to={`/score/${fixtureId}`}>{renderDate(data.date)}</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link} className="text-light"
                             to={`/division/${data.divisionId}/players/${season.id}`}>Players</NavLink>
                </li>
            </ul>
            <LeagueFixtureContainer {...leagueFixtureData}>
                <div className="light-background p-3 overflow-auto">
                    {fixtureData.address || access === 'admin'
                        ? (<GameDetails saving={saving} setFixtureData={setFixtureData} access={access}
                                        fixtureData={fixtureData}/>)
                        : null}
                    <table className={`table${access !== 'readonly' ? ' minimal-padding' : ''}`}>
                        <ScoreCardHeading access={access} data={data} winner={winner} setSubmission={setSubmission}
                                          setFixtureData={setFixtureData} submission={submission}/>
                        {hasBeenPlayed || (access === 'admin' || (account && data.away && account.teamId === data.away.id && access === 'clerk')) ? (
                            <tbody>
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
                                <td colSpan="5" className="text-primary fw-bold text-center">Pairs</td>
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
                            {access !== 'readonly' && (!fixtureData.resultsPublished || access === 'admin') ? (<tr>
                                    <td colSpan="5" className="text-center border-0">Man of the match</td>
                                </tr>
                            ) : null}
                            {renderManOfTheMatchInput()}
                            {renderMergeManOfTheMatch()}
                            {render180sAndHiCheckInput()}
                            {renderMerge180sAndHiCheck()}
                            </tbody>) : (<tbody>
                        <tr>
                            <td colSpan="5">No scores, yet</td>
                        </tr>
                        </tbody>)}
                    </table>
                    {access !== 'readonly' && (!data.resultsPublished || access === 'admin') ? (
                        <button className="btn btn-primary" onClick={saveScores}>
                            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                             aria-hidden="true"></span>) : null}
                            Save
                        </button>) : null}
                    {access === 'admin' && data.resultsPublished && (data.homeSubmission || data.awaySubmission) ? (
                        <button className="btn btn-warning margin-left" onClick={unpublish}>Unpublish</button>) : null}
                </div>
            </LeagueFixtureContainer>
            {saveError ? (
                <ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save score"/>) : null}
            {createPlayerFor ? renderCreatePlayerDialog() : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
