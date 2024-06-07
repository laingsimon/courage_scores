import {useState} from 'react';
import {Link} from "react-router-dom";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {renderDate} from "../../helpers/rendering";
import {any, sortBy} from "../../helpers/collections";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {DivisionFixtureDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {DivisionTeamDto} from "../../interfaces/models/dtos/Division/DivisionTeamDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {IEditableDivisionFixtureDateDto} from "./IEditableDivisionFixtureDateDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {usePreferences} from "../common/PreferencesContainer";
import {ToggleFavouriteTeam} from "../common/ToggleFavouriteTeam";

export interface IDivisionFixtureProps {
    fixture: IEditableDivisionFixtureDto;
    date: string;
    readOnly?: boolean;
    onUpdateFixtures(adaptFixtures: (currentFixtureDates: IEditableDivisionFixtureDateDto[]) => DivisionFixtureDateDto[]): Promise<any>;
    beforeReloadDivision?(): Promise<any>;
}

export interface IEditableDivisionFixtureDto extends DivisionFixtureDto {
    originalAwayTeamId?: string;
}

export function DivisionFixture({fixture, date, readOnly, onUpdateFixtures, beforeReloadDivision}: IDivisionFixtureProps) {
    const bye: IBootstrapDropdownItem = {
        text: 'Bye',
        value: '',
    };
    const {account, teams: allTeams, onError} = useApp();
    const {getPreference} = usePreferences();
    const {id: divisionId, name: divisionName, fixtures, season, teams, onReloadDivision, favouritesEnabled} = useDivisionData();
    const isAdmin = account && account.access && account.access.manageGames;
    const [saving, setSaving] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<GameDto> | null>(null);
    const [clipCellRegion, setClipCellRegion] = useState<boolean>(true);
    const {gameApi} = useDependencies();
    const awayTeamId: string = fixture.awayTeam ? fixture.awayTeam.id : '';
    const favouriteTeamIds: string[] = getPreference<string[]>('favouriteTeamIds') || [];
    const homeTeamIsFavourite: boolean = any(favouriteTeamIds) && any(favouriteTeamIds, id => id === fixture.homeTeam.id);
    const awayTeamIsFavourite: boolean = any(favouriteTeamIds) && fixture.awayTeam && any(favouriteTeamIds, id => id === fixture.awayTeam.id);
    const notAFavourite: boolean = any(favouriteTeamIds) && !homeTeamIsFavourite && !awayTeamIsFavourite;

    async function doReloadDivision() {
        if (beforeReloadDivision) {
            await beforeReloadDivision();
        }

        await onReloadDivision();
    }

    function isSelectedInAnotherFixtureOnThisDate(t: DivisionTeamDto): DivisionFixtureDto {
        const fixturesForThisDate: DivisionFixtureDateDto = fixtures.filter((f: DivisionFixtureDateDto) => f.date === date)[0];
        if (!fixturesForThisDate || !fixturesForThisDate.fixtures) {
            return null;
        }

        // intentionally looks at qualifier games
        const realFixtures: DivisionFixtureDto[] = fixturesForThisDate.fixtures.filter((f: DivisionFixtureDto) => f.awayTeam && f.homeTeam && f.id !== fixture.id);
        const selected: DivisionFixtureDto[] = realFixtures.filter((f: DivisionFixtureDto) => f.homeTeam.id === t.id || f.awayTeam.id === t.id);
        return any(selected)
            ? selected[0]
            : null;
    }

    function isSelectedInSameFixtureOnAnotherDate(t: DivisionTeamDto): string {
        const matching: DivisionFixtureDateDto[] = fixtures.filter((fixtureDate: DivisionFixtureDateDto) => {
            if (fixtureDate.date === date) {
                return null;
            }

            return any(fixtureDate.fixtures, (f: DivisionFixtureDto) => !f.isKnockout && f.homeTeam.id === fixture.homeTeam.id && f.awayTeam && f.awayTeam.id === t.id);
        });

        return any(matching) ? matching[0].date : null;
    }

    function getUnavailableReason(t: DivisionTeamDto): string {
        let otherFixtureSameDate: DivisionFixtureDto = isSelectedInAnotherFixtureOnThisDate(t);
        if (otherFixtureSameDate) {
            return otherFixtureSameDate.awayTeam.id === t.id
                ? `Already playing against ${otherFixtureSameDate.homeTeam.name}`
                : `Already playing against ${otherFixtureSameDate.awayTeam.name}`;
        }
        let sameFixtureDifferentDate: string = isSelectedInSameFixtureOnAnotherDate(t);
        if (sameFixtureDifferentDate) {
            return `Already playing same leg on ${renderDate(sameFixtureDifferentDate)}`;
        }

        return null;
    }

    async function onChangeAwayTeam(teamId: string) {
        if (readOnly) {
            return;
        }

        await onUpdateFixtures((currentFixtureDates: DivisionFixtureDateDto[]) => {
            const fixtureDate: DivisionFixtureDateDto = currentFixtureDates.filter(fd => fd.date === date)[0];

            // istanbul ignore next
            if (!fixtureDate) {
                onError(`Could not find fixture date: ${date}`);
                return null;
            }

            // istanbul ignore next
            if (!fixtureDate.fixtures) {
                onError('Fixture date has no fixtures');
                return null;
            }

            const fixtureDateFixture: DivisionFixtureDto = fixtureDate.fixtures.filter((f: DivisionFixtureDto) => f.id === fixture.id)[0];
            // istanbul ignore next
            if (!fixtureDateFixture) {
                onError(`Could not find fixture with id ${fixture.id}`);
                return null;
            }

            const newFixture: IEditableDivisionFixtureDto = Object.assign({}, fixtureDateFixture) as IEditableDivisionFixtureDto;
            newFixture.originalAwayTeamId = newFixture.originalAwayTeamId || (newFixture.awayTeam ? newFixture.awayTeam.id : 'unset');
            const team: DivisionTeamDto = teams.filter((t: DivisionTeamDto) => t.id === teamId)[0];
            newFixture.awayTeam = teamId
                ? {id: teamId, name: team ? team.name : '<unknown>'}
                : null;
            fixtureDate.fixtures = fixtureDate.fixtures.filter((f: DivisionFixtureDto) => f.id !== fixture.id).concat([newFixture]).sort(sortBy('homeTeam.name'));

            return currentFixtureDates;
        });
    }

    function renderKnockoutAwayTeams() {
        const options: IBootstrapDropdownItem[] = allTeams
            .filter((t: TeamDto) => t.id !== fixture.homeTeam.id)
            .filter((t: TeamDto) => any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === season.id && !ts.deleted))
            .map((t: TeamDto): IBootstrapDropdownItem => {
                const otherFixtureSameDate: DivisionFixtureDto = isSelectedInAnotherFixtureOnThisDate(t);
                const unavailableReason: string = otherFixtureSameDate
                    ? otherFixtureSameDate.awayTeam.id === t.id
                        ? `Already playing against ${otherFixtureSameDate.homeTeam.name}`
                        : `Already playing against ${otherFixtureSameDate.awayTeam.name}`
                    : null;

                return {
                    value: t.id,
                    text: otherFixtureSameDate ? `🚫 ${t.name} (${unavailableReason})` : t.name,
                    disabled: !!otherFixtureSameDate
                };
            });

        return (<BootstrapDropdown
            value={awayTeamId}
            onChange={onChangeAwayTeam}
            options={options}
            onOpen={toggleCellClip}
            disabled={deleting}
            readOnly={readOnly}
        />);
    }

    function renderLeagueAwayTeams() {
        const byeOption: IBootstrapDropdownItem[] = fixture.id !== fixture.homeTeam.id ? [] : [bye];
        const options: IBootstrapDropdownItem[] = byeOption.concat(teams
            .filter((t: DivisionTeamDto) => t.id !== fixture.homeTeam.id)
            .map((t: DivisionTeamDto) => {
                const unavailableReason: string = getUnavailableReason(t);

                return {
                    value: t.id,
                    text: unavailableReason ? `🚫 ${t.name} (${unavailableReason})` : t.name,
                    disabled: !!unavailableReason
                };
            }));

        return (<BootstrapDropdown
            value={awayTeamId}
            onChange={onChangeAwayTeam}
            options={options}
            onOpen={toggleCellClip}
            disabled={deleting}
            readOnly={readOnly}
        />);
    }

    function renderAwayTeam() {
        if (!isAdmin || fixture.homeScore || fixture.awayScore) {
            return (fixture.awayTeam
                ? awayTeamId && (fixture.id !== fixture.homeTeam.id)
                    ? (<>
                        {isAdmin ? null : <ToggleFavouriteTeam teamId={fixture.awayTeam.id} />}
                        <Link to={`/score/${fixture.id}`} className="margin-right">
                            {fixture.awayTeam.name}
                        </Link>
                    </>)
                    : null
                : 'Bye');
        }

        if (any(fixture.fixturesUsingAddress)) {
            return (<div>
                {fixture.fixturesUsingAddress.map((otherFixture, index) => {
                    return (<div key={index}>🚫 <Link
                        to={`/score/${otherFixture.id}`}><strong>{otherFixture.home.name}</strong> vs <strong>{otherFixture.away.name}</strong> using
                        this venue</Link></div>)
                })}
            </div>);
        }

        return fixture.isKnockout
            ? renderKnockoutAwayTeams()
            : renderLeagueAwayTeams();
    }

    async function toggleCellClip(isOpen: boolean) {
        setClipCellRegion(!isOpen);
    }

    async function saveTeamChange() {
        try {
            // istanbul ignore next
            if (saving || deleting) {
                // istanbul ignore next
                return;
            }

            setSaving(true);
            const result: IClientActionResultDto<GameDto> = await gameApi.update({
                id: undefined,
                address: fixture.homeTeam.address,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: awayTeamId,
                date: date,
                isKnockout: fixture.isKnockout,
                seasonId: season.id,
                accoladesCount: fixture.accoladesCount,
            });

            if (result.success) {
                await doReloadDivision();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteGame() {
        try {
            // istanbul ignore next
            if (deleting || saving) {
                // istanbul ignore next
                return;
            }

            if (!window.confirm(`Are you sure you want to delete this fixture?\n\n${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)) {
                return;
            }

            setDeleting(true);
            try {
                const result: IClientActionResultDto<GameDto> = await gameApi.delete(fixture.id);
                if (result.success) {
                    await doReloadDivision();
                } else {
                    setSaveError(result);
                }
            } finally {
                setDeleting(false);
            }
        } catch (exc) {
            /* istanbul ignore next */
            onError(exc);
        }
    }

    try {
        return (<tr className={(deleting ? 'text-decoration-line-through' : '') + (notAFavourite && favouritesEnabled && !isAdmin ? ' opacity-25' : '')}>
            <td className="text-end">
                {awayTeamId && (fixture.id !== fixture.homeTeam.id)
                    ? (<Link to={`/score/${fixture.id}`}
                                       className="margin-right">{fixture.homeTeam.name}</Link>)
                    : (<Link to={`/division/${divisionName}/team:${fixture.homeTeam.name}/${season.name}`}
                                       className="margin-right">{fixture.homeTeam.name}</Link>)}
                {isAdmin ? null : <ToggleFavouriteTeam teamId={fixture.homeTeam.id} />}
            </td>
            <td className="narrow-column text-primary fw-bolder">{fixture.postponed
                ? (<span className="text-danger">P</span>)
                : fixture.homeScore}
            </td>
            <td className="narrow-column">vs</td>
            <td className="narrow-column text-primary fw-bolder">{fixture.postponed
                ? (<span className="text-danger">P</span>)
                : fixture.awayScore}
            </td>
            <td style={{overflow: (clipCellRegion ? 'clip' : 'initial')}}>
                {renderAwayTeam()}
            </td>
            {isAdmin ? (<td className="medium-column">
                {fixture.originalAwayTeamId && awayTeamId !== fixture.originalAwayTeamId && awayTeamId
                    ? (<button disabled={readOnly} onClick={saveTeamChange}
                               className="btn btn-sm btn-primary margin-right">{saving
                        ? (<LoadingSpinnerSmall/>)
                        : '💾'}</button>)
                    : null}
                {fixture.id !== fixture.homeTeam.id && awayTeamId && !saving && !deleting ? (
                    <button disabled={readOnly} className="btn btn-sm btn-danger"
                            onClick={deleteGame}>🗑</button>) : null}
                {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                            title="Could not save fixture details"/>) : null}
            </td>) : null}
        </tr>)
    } catch (e) {
        // istanbul ignore next
        onError(e);
    }
}
