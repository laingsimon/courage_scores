import {useState} from 'react';
import {FilterFixtures} from "./FilterFixtures";
import {useLocation} from "react-router";
import {EditNote} from "./EditNote";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {asyncCallback, stateChanged} from "../../helpers/events";
import {useApp} from "../common/AppContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {DivisionFixtureDate} from "./DivisionFixtureDate";
import {
    getFixtureDateFilters,
    getFixtureFilters,
    IFixtureMapping, getFilter
} from "./filters";
import {Dialog} from "../common/Dialog";
import {CreateSeasonDialog} from "../season_creation/CreateSeasonDialog";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {EditFixtureDateNoteDto} from "../../interfaces/models/dtos/EditFixtureDateNoteDto";
import {IEditableDivisionFixtureDateDto} from "./IEditableDivisionFixtureDateDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {DivisionFixtureDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDto";
import {IFilter} from "./IFilter";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {useBranding} from "../common/BrandingContainer";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {hasAccess} from "../../helpers/conditions";
import {useDependencies} from "../common/IocContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";

export interface IDivisionFixturesProps {
    setNewFixtures(fixtures: DivisionFixtureDateDto[]): UntypedPromise;
}

export function DivisionFixtures({setNewFixtures}: IDivisionFixturesProps) {
    const {id: divisionId, name, season, fixtures, onReloadDivision, superleague} = useDivisionData();
    const {gameApi} = useDependencies();
    const location = useLocation();
    const {account, onError, controls, teams} = useApp();
    const isAdmin: boolean = hasAccess(account, access => access.manageGames);
    const [newDate, setNewDate] = useState<string>('');
    const [newDateDialogOpen, setNewDateDialogOpen] = useState<boolean>(false);
    const [isKnockout, setIsKnockout] = useState<boolean>(false);
    const [editNote, setEditNote] = useState<EditFixtureDateNoteDto | null>(null);
    const [showPlayers, setShowPlayers] = useState<{ [date: string]: boolean }>(getPlayersToShow());
    const [createFixturesDialogOpen, setCreateFixturesDialogOpen] = useState<boolean>(false);
    const [deletingAllFixtures, setDeletingAllFixtures] = useState<boolean>(false);
    const {setTitle} = useBranding();

    function getPlayersToShow(): { [date: string]: boolean } {
        if (location.hash !== '#show-who-is-playing') {
            return {};
        }

        const newShowPlayers = {};
        for (const fixtureDate of fixtures!) {
            if (any(fixtureDate.tournamentFixtures)) {
                newShowPlayers[fixtureDate.date] = true;
            }
        }
        return newShowPlayers;
    }

    async function onTournamentChanged() {
        const divisionData: DivisionDataDto | null = await onReloadDivision();
        await setNewFixtures(divisionData?.fixtures || []);
    }

    function renderFixtureDate(fixtureDate: IEditableDivisionFixtureDateDto) {
        return (<DivisionFixtureDate
            key={fixtureDate.date + (fixtureDate.isNew ? '_new' : '')}
            date={fixtureDate}
            showPlayers={showPlayers}
            startAddNote={startAddNote}
            setEditNote={asyncCallback(setEditNote)}
            setShowPlayers={asyncCallback(setShowPlayers)}
            setNewFixtures={setNewFixtures}
            onTournamentChanged={onTournamentChanged}
        />);
    }

    function getNewFixtureDate(date: string, isKnockout: boolean): IEditableDivisionFixtureDateDto {
        const seasonalTeams: TeamDto[] = teams.filter((t: TeamDto) => {
            return any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === season!.id && ts.divisionId === divisionId && !ts.deleted);
        });

        return {
            isNew: true,
            isKnockout: isKnockout,
            date: date,
            fixtures: seasonalTeams.map((team: TeamDto): DivisionFixtureDto => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    isKnockout: isKnockout,
                    accoladesCount: true,
                    fixturesUsingAddress: [],
                };
            }),
            tournamentFixtures: seasonalTeams.map((team: TeamDto): DivisionTournamentFixtureDetailsDto => {
                return {
                    date,
                    address: team.address,
                    proposed: true,
                    sides: [],
                };
            }),
            notes: [],
        };
    }

    function startAddNote(date: string) {
        setEditNote({
            date: date,
            seasonId: season!.id,
            note: '',
        });
    }

    function renderEditNote() {
        return (<EditNote
            note={editNote || {}}
            onNoteChanged={async (note: FixtureDateNoteDto) => setEditNote(note)}
            onClose={async () => setEditNote(null)}
            onSaved={async () => {
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
            if (any(fixtures, (fd: DivisionFixtureDateDto) => fd.date === utcDate)) {
                return;
            }

            const newFixtureDate: IEditableDivisionFixtureDateDto = getNewFixtureDate(utcDate, isKnockout);
            await setNewFixtures(fixtures!.concat([newFixtureDate]).sort(sortBy('date')));
        } finally {
            scrollFixtureDateIntoView(utcDate);
            setNewDateDialogOpen(false);
        }
    }

    function renderNewDateDialog() {
        return (<Dialog title="Add a date to the season" slim={true}>
            <div className="pb-2">
                <span className="margin-right">Select date:</span>
                <input type="date" min={season!.startDate!.substring(0, 10)} max={season!.endDate!.substring(0, 10)}
                       className="margin-right" value={newDate} onChange={stateChanged(setNewDate)}/>
                {superleague ? null : (<div className="form-check form-switch d-inline-block">
                    <input type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                           checked={isKnockout} onChange={stateChanged(setIsKnockout)}/>
                    <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
                </div>)}
            </div>
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={() => setNewDateDialogOpen(false)}>Close</button>
                </div>
                <button className="btn btn-primary" onClick={addNewDate}>Add date</button>
            </div>
        </Dialog>);
    }

    function applyFixtureFilters(fixtureDate: DivisionFixtureDateDto, fixtureFilters: IFilter<IFixtureMapping>): DivisionFixtureDateDto {
        const filteredFixtureDate: DivisionFixtureDateDto = Object.assign({}, fixtureDate);
        filteredFixtureDate.tournamentFixtures = fixtureDate.tournamentFixtures?.filter((f: DivisionTournamentFixtureDetailsDto) => fixtureFilters.apply({
            date: fixtureDate.date,
            tournamentFixture: f,
        } as IFixtureMapping));
        const hasFixtures: boolean = any(fixtureDate.fixtures, (f: DivisionFixtureDto) => f.id !== f.homeTeam.id);
        filteredFixtureDate.fixtures = (!isAdmin && !hasFixtures)
            ? []
            : fixtureDate.fixtures?.filter((f: DivisionFixtureDto) => fixtureFilters.apply({
                date: fixtureDate.date,
                fixture: f,
            } as IFixtureMapping));

        return filteredFixtureDate;
    }

    async function bulkDeleteFixtures() {
        if (!season || deletingAllFixtures) {
            return;
        }

        try {
            if (!confirm(`Are you sure you want to delete all un-played league fixtures from ALL DIVISIONS in the ${season!.name} season?\n\nA dry-run of the deletion will run first.`)) {
                return;
            }

            setDeletingAllFixtures(true);
            const dryRunResult = await gameApi.deleteUnplayedLeagueFixtures(season!.id!, false);
            if (!dryRunResult.success) {
                alert('There was an error when attempting to delete all the fixtures');
                return;
            }

            const fixtureCount = dryRunResult.result?.length ?? 0;
            if (fixtureCount === 0) {
                alert('No fixtures can be deleted');
                return;
            }

            if (!confirm(`All the fixtures CAN be deleted without issue, are you sure you want to actually delete ${fixtureCount} fixtures from ${season!.name}?\n\n${dryRunResult.messages?.join('\n')}`)) {
                return;
            }

            const actualResult = await gameApi.deleteUnplayedLeagueFixtures(season!.id!, true);
            if (!actualResult.success) {
                alert('There was an error deleting all the fixtures, some fixtures may have been deleted');
                return;
            }

            document.location.reload();
        } finally {
            setDeletingAllFixtures(false);
        }
    }

    setTitle(`${name}: Fixtures`);

    try {
        const filter = getFilter(location);
        const fixtureDateFilters: IFilter<DivisionFixtureDateDto> = getFixtureDateFilters(filter, {}, fixtures);
        const fixtureFilters: IFilter<IFixtureMapping> = getFixtureFilters(filter);
        const resultsToRender = deletingAllFixtures ? [] : fixtures!
            .filter((fd: DivisionFixtureDateDto) => fixtureDateFilters.apply(fd))
            .map((fd: DivisionFixtureDateDto) => applyFixtureFilters(fd, fixtureFilters))
            .filter((fd: DivisionFixtureDateDto) => fixtureDateFilters.apply(fd)) // for any post-fixture filtering, e.g. notes=only-with-fixtures
            .map(renderFixtureDate);
        return (<div className="content-background p-3">
            {isAdmin ? (<div className="float-end" datatype="fixture-management-1">
                {deletingAllFixtures ? null : (<button className="btn btn-primary margin-right" onClick={() => setNewDateDialogOpen(true)}>
                    ➕ Add date
                </button>)}
                {superleague || deletingAllFixtures ? null : (<button className="btn btn-primary margin-right" onClick={() => setCreateFixturesDialogOpen(true)}>
                    🗓️ Create fixtures
                </button>)}
                {superleague || !hasAccess(account, a => a.bulkDeleteLeagueFixtures)
                    ? null
                    : (<button className="btn btn-danger margin-right" onClick={bulkDeleteFixtures}>
                        {deletingAllFixtures ? (<LoadingSpinnerSmall/>) : null}
                    ⚠️ Delete all league fixtures
                </button>)}
            </div>) : null}
            {controls && !deletingAllFixtures
                ? (<FilterFixtures />)
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
                <CreateSeasonDialog seasonId={season!.id!} onClose={async () => setCreateFixturesDialogOpen(false)}/>) : null}
            {isAdmin && !deletingAllFixtures ? (<div className="mt-3" datatype="fixture-management-1">
                <button className="btn btn-primary margin-right" onClick={() => setNewDateDialogOpen(true)}>
                    ➕ Add date
                </button>
                {superleague ? null : (<button className="btn btn-primary margin-right" onClick={() => setCreateFixturesDialogOpen(true)}>
                    🗓️ Create fixtures
                </button>)}
            </div>) : null}
        </div>);
    } catch (exc) {
        /* istanbul ignore next */
        onError(exc);
    }
}
