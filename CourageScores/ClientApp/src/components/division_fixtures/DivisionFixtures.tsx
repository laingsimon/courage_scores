import React, {useState} from 'react';
import {FilterFixtures} from "./FilterFixtures";
import {useLocation, useNavigate} from "react-router-dom";
import {EditNote} from "./EditNote";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {DivisionFixtureDate} from "./DivisionFixtureDate";
import {
    changeFilter,
    getFixtureDateFilters,
    getFixtureFilters,
    IInitialisedFilters,
    initFilter, IFixtureMapping
} from "../../helpers/filters";
import {Dialog} from "../common/Dialog";
import {CreateSeasonDialog} from "./season_creation/CreateSeasonDialog";
import {IDivisionDataDto} from "../../interfaces/serverSide/Division/IDivisionDataDto";
import {IEditFixtureDateNoteDto} from "../../interfaces/serverSide/IEditFixtureDateNoteDto";
import {IEditableDivisionFixtureDateDto} from "../../interfaces/IEditableDivisionFixtureDateDto";
import {ITeamDto} from "../../interfaces/serverSide/Team/ITeamDto";
import {ITeamSeasonDto} from "../../interfaces/serverSide/Team/ITeamSeasonDto";
import {IDivisionFixtureDateDto} from "../../interfaces/serverSide/Division/IDivisionFixtureDateDto";
import {IDivisionFixtureDto} from "../../interfaces/serverSide/Division/IDivisionFixtureDto";
import {IFilter} from "../../interfaces/IFilter";
import {
    IDivisionTournamentFixtureDetailsDto
} from "../../interfaces/serverSide/Division/IDivisionTournamentFixtureDetailsDto";
import {IFixtureDateNoteDto} from "../../interfaces/serverSide/IFixtureDateNoteDto";

export interface IDivisionFixturesProps {
    setNewFixtures: (fixtures: IDivisionFixtureDateDto[]) => Promise<any>;
}

export function DivisionFixtures({setNewFixtures}: IDivisionFixturesProps) {
    const {id: divisionId, season, fixtures, onReloadDivision} = useDivisionData();
    const navigate = useNavigate();
    const location = useLocation();
    const {account, onError, controls, teams} = useApp();
    const isAdmin: boolean = account && account.access && account.access.manageGames;
    const [newDate, setNewDate] = useState<string>('');
    const [newDateDialogOpen, setNewDateDialogOpen] = useState<boolean>(false);
    const [isKnockout, setIsKnockout] = useState<boolean>(false);
    const [filter, setFilter] = useState<IInitialisedFilters>(initFilter(location));
    const [editNote, setEditNote] = useState<IEditFixtureDateNoteDto | null>(null);
    const [showPlayers, setShowPlayers] = useState<{ [date: string]: boolean }>(getPlayersToShow());
    const [createFixturesDialogOpen, setCreateFixturesDialogOpen] = useState<boolean>(false);

    function getPlayersToShow(): { [date: string]: boolean } {
        if (location.hash !== '#show-who-is-playing') {
            return {};
        }

        const newShowPlayers = {};
        fixtures.forEach(fixtureDate => {
            if (any(fixtureDate.tournamentFixtures)) {
                newShowPlayers[fixtureDate.date] = true;
            }
        });
        return newShowPlayers;
    }

    async function onTournamentChanged() {
        const divisionData: IDivisionDataDto = await onReloadDivision();
        await setNewFixtures(divisionData.fixtures);
        setNewDate('');
    }

    function renderFixtureDate(fixtureDate: IEditableDivisionFixtureDateDto) {
        return (<DivisionFixtureDate
            key={fixtureDate.date + (fixtureDate.isNew ? '_new' : '')}
            date={fixtureDate}
            showPlayers={showPlayers}
            startAddNote={startAddNote}
            setEditNote={async (note: IEditFixtureDateNoteDto) => setEditNote(note)}
            setShowPlayers={async (players: { [p: string]: boolean }) => setShowPlayers(players)}
            setNewFixtures={setNewFixtures}
            onTournamentChanged={onTournamentChanged}
        />);
    }

    function getNewFixtureDate(date: string, isKnockout: boolean): IEditableDivisionFixtureDateDto {
        const seasonalTeams: ITeamDto[] = teams.filter((t: ITeamDto) => {
            return t.seasons.filter((ts: ITeamSeasonDto) => ts.seasonId === season.id && ts.divisionId === divisionId).length > 0;
        });

        return {
            isNew: true,
            isKnockout: isKnockout,
            date: date,
            fixtures: seasonalTeams.map((team: ITeamDto): IDivisionFixtureDto => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    awayTeam: null,
                    isKnockout: isKnockout,
                    accoladesCount: true,
                    fixturesUsingAddress: [],
                };
            }),
            tournamentFixtures: seasonalTeams.map((team: ITeamDto): IDivisionTournamentFixtureDetailsDto => {
                return {
                    id: null,
                    address: team.address,
                    proposed: true,
                };
            }),
            notes: [],
        };
    }

    function startAddNote(date: string) {
        setEditNote({
            date: date,
            divisionId: divisionId,
            seasonId: season.id,
            note: '',
        });
    }

    function renderEditNote() {
        return (<EditNote
            note={editNote}
            onNoteChanged={async (note: IFixtureDateNoteDto) => setEditNote(note)}
            onClose={async () => setEditNote(null)}
            onSaved={async () => {
                setNewDate('');
                setEditNote(null);
                await onReloadDivision();
            }}/>);
    }

    function scrollFixtureDateIntoView(date: string) {
        // setup scroll to fixture
        window.setTimeout(() => {
            /* istanbul ignore next */
            const newFixtureDateElement = document.querySelector(`div[data-fixture-date="${date}"]`);
            /* istanbul ignore next */
            if (newFixtureDateElement) {
                /* istanbul ignore next */
                newFixtureDateElement.scrollIntoView();
            }
        }, 100);
    }

    async function addNewDate() {
        if (!newDate) {
            window.alert('Select a date first');
            return;
        }

        const utcDate: string = newDate + 'T00:00:00';

        try {
            if (any(fixtures, (fd: IDivisionFixtureDateDto) => fd.date === utcDate)) {
                return;
            }

            const newFixtureDate: IEditableDivisionFixtureDateDto = getNewFixtureDate(utcDate, isKnockout);
            await setNewFixtures(fixtures.concat([newFixtureDate]).sort(sortBy('date')));
        } finally {
            scrollFixtureDateIntoView(utcDate);
            setNewDateDialogOpen(false);
        }
    }

    function renderNewDateDialog() {
        return (<Dialog title="Add a date to the season" slim={true}>
            <div className="pb-2">
                <span className="margin-right">Select date:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)}
                       className="margin-right" value={newDate} onChange={stateChanged(setNewDate)}/>

                <div className="form-check form-switch d-inline-block">
                    <input type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                           checked={isKnockout} onChange={stateChanged(setIsKnockout)}/>
                    <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
                </div>
            </div>
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={() => setNewDateDialogOpen(false)}>Close</button>
                </div>
                <button className="btn btn-primary" onClick={addNewDate}>Add date</button>
            </div>
        </Dialog>);
    }

    function applyFixtureFilters(fixtureDate: IDivisionFixtureDateDto, fixtureFilters: IFilter<IFixtureMapping>): IDivisionFixtureDateDto {
        const filteredFixtureDate: IDivisionFixtureDateDto = Object.assign({}, fixtureDate);
        filteredFixtureDate.tournamentFixtures = fixtureDate.tournamentFixtures.filter((f: IDivisionTournamentFixtureDetailsDto) => fixtureFilters.apply({
            date: fixtureDate.date,
            fixture: null,
            tournamentFixture: f,
        } as IFixtureMapping));
        const hasFixtures: boolean = any(fixtureDate.fixtures, (f: IDivisionFixtureDto) => f.id !== f.homeTeam.id);
        filteredFixtureDate.fixtures = (!isAdmin && !hasFixtures)
            ? []
            : fixtureDate.fixtures.filter((f: IDivisionFixtureDto) => fixtureFilters.apply({
                date: fixtureDate.date,
                fixture: f,
                tournamentFixture: null,
            } as IFixtureMapping));

        return filteredFixtureDate;
    }

    try {
        const fixtureDateFilters: IFilter<IDivisionFixtureDateDto> = getFixtureDateFilters(filter, {}, fixtures);
        const fixtureFilters: IFilter<IFixtureMapping> = getFixtureFilters(filter);
        const resultsToRender = fixtures
            .filter((fd: IDivisionFixtureDateDto) => fixtureDateFilters.apply(fd))
            .map((fd: IDivisionFixtureDateDto) => applyFixtureFilters(fd, fixtureFilters))
            .filter((fd: IDivisionFixtureDateDto) => fixtureDateFilters.apply(fd)) // for any post-fixture filtering, e.g. notes=only-with-fixtures
            .map(renderFixtureDate);
        return (<div className="content-background p-3">
            {controls
                ? (<FilterFixtures
                    setFilter={async (newFilter: IInitialisedFilters) => changeFilter(newFilter, setFilter, navigate, location)}
                    filter={filter}/>)
                : null}
            {isAdmin && newDateDialogOpen ? renderNewDateDialog() : null}
            <div>
                {resultsToRender}
                {isEmpty(resultsToRender, f => f != null) && any(fixtures) ? (
                    <div>No fixtures match your search</div>) : null}
                {isEmpty(fixtures) ? (<div>No fixtures, yet</div>) : null}
                {editNote ? renderEditNote() : null}
            </div>
            {isAdmin && createFixturesDialogOpen ? (
                <CreateSeasonDialog seasonId={season.id} onClose={async () => setCreateFixturesDialogOpen(false)}/>) : null}
            {isAdmin ? (<div className="mt-3">
                <button className="btn btn-primary margin-right" onClick={() => setNewDateDialogOpen(true)}>
                    ➕ Add date
                </button>
                <button className="btn btn-primary margin-right" onClick={() => setCreateFixturesDialogOpen(true)}>
                    🗓️ Create fixtures
                </button>
            </div>) : null}
        </div>);
    } catch (exc) {
        /* istanbul ignore next */
        onError(exc);
    }
}
