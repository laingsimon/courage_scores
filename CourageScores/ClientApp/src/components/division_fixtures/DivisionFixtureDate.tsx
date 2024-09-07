import {any} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {FixtureDateNote} from "./FixtureDateNote";
import {DivisionFixture, IEditableDivisionFixtureDto} from "./DivisionFixture";
import {TournamentFixture} from "./TournamentFixture";
import {useApp} from "../common/AppContainer";
import {useLocation, useNavigate} from "react-router-dom";
import {useDivisionData} from "../league/DivisionDataContainer";
import {isInPast, isToday} from "../../helpers/dates";
import {DivisionFixtureDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDto";
import {IEditableDivisionFixtureDateDto} from "./IEditableDivisionFixtureDateDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {DivisionTeamDto} from "../../interfaces/models/dtos/Division/DivisionTeamDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {EditFixtureDateNoteDto} from "../../interfaces/models/dtos/EditFixtureDateNoteDto";
import {NewTournamentFixture} from "./NewTournamentFixture";

export interface IDivisionFixtureDateProps {
    date: IEditableDivisionFixtureDateDto;
    showPlayers: { [date: string]: boolean };
    startAddNote(date: string): void;
    setEditNote(note: EditFixtureDateNoteDto): Promise<any>;
    setShowPlayers(newShowPlayers: { [date: string]: boolean }): Promise<any>;
    setNewFixtures(newFixtures: DivisionFixtureDateDto[]): Promise<any>;
    onTournamentChanged(): Promise<any>;
}

export function DivisionFixtureDate({date, showPlayers, startAddNote, setEditNote, setShowPlayers, setNewFixtures, onTournamentChanged}: IDivisionFixtureDateProps) {
    const {account, controls} = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const {fixtures, teams} = useDivisionData();
    const canManageTournaments: boolean = account && account.access && account.access.manageTournaments;
    const canManageGames: boolean = account && account.access && account.access.manageGames;
    const isNoteAdmin: boolean = account && account.access && account.access.manageNotes;

    async function toggleShowPlayers(date: string) {
        const newShowPlayers = Object.assign({}, showPlayers);
        if (newShowPlayers[date]) {
            delete newShowPlayers[date];
        } else {
            newShowPlayers[date] = true;
        }
        await setShowPlayers(newShowPlayers);

        navigate({
            pathname: location.pathname,
            search: location.search,
            hash: any(Object.keys(newShowPlayers))
                ? 'show-who-is-playing'
                : '',
        });
    }

    function getClassName(): string {
        if (date.isNew) {
            return '';
        }

        if (isToday(date.date)) {
            return 'text-primary';
        }

        if (!isInPast(date.date)) {
            return 'text-secondary-50';
        }

        return '';
    }

    async function onUpdateFixtures(adaptFixtures: (currentFixtureDates: IEditableDivisionFixtureDateDto[]) => DivisionFixtureDateDto[]) {
        const newFixtures: DivisionFixtureDateDto[] = adaptFixtures(fixtures);

        if (newFixtures) {
            await setNewFixtures(newFixtures);
        }
    }

    function isPotentialFixtureValid(fixture: DivisionFixtureDto) {
        if (fixture.id !== fixture.homeTeam.id) {
            return true; // a real fixture
        }

        if (fixture.awayTeam) {
            // an away team has been selected; assume it is valid
            return true;
        }

        if (any(date.tournamentFixtures, (t: DivisionTournamentFixtureDetailsDto) => !t.proposed)) {
            return false;
        }

        if (any(date.fixtures, (f: DivisionFixtureDto) => f.isKnockout) && !fixture.awayTeam && !canManageGames) {
            // don't show byes for any knockout/qualifier fixtures when logged out
            return false;
        }

        const fixturesForThisTeam: DivisionFixtureDto[] = date.fixtures
            .filter((f: DivisionFixtureDto) => f.awayTeam) // a created fixture
            .filter((f: DivisionFixtureDto) => f.homeTeam.id === fixture.homeTeam.id || f.awayTeam.id === fixture.homeTeam.id);

        return !any(fixturesForThisTeam);
    }

    async function onChangeIsKnockout(event: React.ChangeEvent<HTMLInputElement>) {
        const newFixtureDate: IEditableDivisionFixtureDateDto = Object.assign({}, date);
        newFixtureDate.isKnockout = event.target.checked;

        if (!any(date.fixtures, (f: DivisionFixtureDto) => f.id !== f.homeTeam.id)) {
            // no fixtures exist yet, can replace them all
            newFixtureDate.fixtures = teams.map((team: DivisionTeamDto): IEditableDivisionFixtureDto => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    awayTeam: null,
                    isKnockout: newFixtureDate.isKnockout,
                    accoladesCount: true,
                    fixturesUsingAddress: [],
                };
            });
        }

        await setNewFixtures(fixtures.map((fd: DivisionFixtureDateDto) => fd.date === date.date ? newFixtureDate : fd));
    }

    const hasKnockoutFixture: boolean = any(date.fixtures, (f: DivisionFixtureDto) => f.id !== f.homeTeam.id && f.isKnockout);
    const showQualifierToggle: boolean = canManageGames && ((!hasKnockoutFixture && !any(date.tournamentFixtures, (f: DivisionTournamentFixtureDetailsDto) => !f.proposed) && !any(date.fixtures, f => f.id !== f.homeTeam.id)) || date.isNew);
    const allowTournamentProposals: boolean = !any(date.fixtures, (f: DivisionFixtureDto) => f.id !== f.homeTeam.id || !!f.awayTeam || f.isKnockout);
    return (<div key={date.date} className={`${getClassName()}${date.isNew ? ' alert-success pt-3 mb-3' : ''}`}>
        <div data-fixture-date={date.date} className="bg-light"></div>
        <h4>
            📅 {renderDate(date.date)}
            {isNoteAdmin
                ? (<button className="btn btn-primary btn-sm margin-left" onClick={() => startAddNote(date.date)}>
                    📌 Add note
                </button>)
                : null}
            {any(date.tournamentFixtures, (f: DivisionTournamentFixtureDetailsDto) => !f.proposed) && !date.isNew && controls ? (
                <span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           id={'showPlayers_' + date.date} checked={showPlayers[date.date] || false}
                           onChange={() => toggleShowPlayers(date.date)}/>
                    <label className="form-check-label margin-left"
                           htmlFor={'showPlayers_' + date.date}>Who's playing?</label>
                </span>) : null}
            {showQualifierToggle ? (<span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           disabled={any(date.fixtures, f => f.isKnockout && f.id !== f.homeTeam.id)}
                           id={'isKnockout_' + date.date}
                           checked={any(date.fixtures, f => f.isKnockout && f.id !== f.homeTeam.id) || date.isKnockout || false}
                           onChange={onChangeIsKnockout}/>
                    <label className="form-check-label margin-left"
                           htmlFor={'isKnockout_' + date.date}>Qualifier</label>
                </span>) : null}
        </h4>
        {date.notes.map((note: FixtureDateNoteDto) => (<FixtureDateNote key={note.id} note={note} setEditNote={setEditNote}/>))}
        <table className="table layout-fixed">
            <tbody>
            {date.fixtures.filter(isPotentialFixtureValid).map((f: DivisionFixtureDto) => (<DivisionFixture
                key={f.id}
                fixture={f}
                date={date.date}
                onUpdateFixtures={onUpdateFixtures}/>))}
            {date.tournamentFixtures.filter((t: DivisionTournamentFixtureDetailsDto) => !date.isKnockout && !t.proposed).map((tournament: DivisionTournamentFixtureDetailsDto) => (
                <TournamentFixture
                    key={tournament.address + '-' + tournament.date}
                    tournament={tournament}
                    date={date.date}
                    onTournamentChanged={onTournamentChanged}
                    expanded={showPlayers[date.date]}/>))}
            {canManageTournaments && allowTournamentProposals ? (<NewTournamentFixture
                    date={date.date}
                    tournamentFixtures={date.tournamentFixtures}
                    onTournamentChanged={onTournamentChanged}
                />) : null}
            </tbody>
        </table>
    </div>);
}
