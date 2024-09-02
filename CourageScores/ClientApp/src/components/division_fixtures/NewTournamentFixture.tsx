import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useState} from "react";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {createTemporaryId} from "../../helpers/projection";
import {useDependencies} from "../common/IocContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {useApp} from "../common/AppContainer";
import {any, distinct} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";

export interface INewTournamentFixtureProps {
    date: string,
    tournamentFixtures: DivisionTournamentFixtureDetailsDto[];
    onTournamentChanged(): Promise<any>;
}

export function NewTournamentFixture({date, tournamentFixtures, onTournamentChanged}: INewTournamentFixtureProps) {
    const {id, season, fixtures: fixtureDates} = useDivisionData();
    const {tournamentApi} = useDependencies();
    const {divisions} = useApp();
    const [copySidesFrom, setCopySidesFrom] = useState<string>(null);
    const [address, setAddress] = useState<string>(null);
    const [creating, setCreating] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const [divisionId, setDivisionId] = useState<string>(id);
    const addressOptions: IBootstrapDropdownItem[] = tournamentFixtures
        .map(f => {
            return {
                text: f.proposed
                    ? f.address
                    : `⚠ ${f.address} (Already in use)`,
                value: f.address,
                className: f.proposed
                    ? null
                    : 'text-secondary',
            }
        });
    const allDivisions: IBootstrapDropdownItem = {
        text: 'Cross-divisional',
        value: null,
    };
    const divisionOptions: IBootstrapDropdownItem[] = [ allDivisions ].concat(divisions
        .map(d => {
            return {
                text: d.name,
                value: d.id,
            };
        }));
    const dontCopy: IBootstrapDropdownItem = {
        text: '-',
        value: null,
    };
    const copySidesFromOptions: IBootstrapDropdownItem[] = [dontCopy].concat((fixtureDates || [])
        .filter(fd => fd.date !== date)
        .filter(fd => any(fd.tournamentFixtures || [], t => !!t.winningSide))
        .map(fd => {
            const uniqueFixtureType: TournamentGameDto[] = distinct(fd.tournamentFixtures, 'type');
            const notes: string[] = fd.notes.map((n: FixtureDateNoteDto) => n.note);
            const prefix: string = uniqueFixtureType.length === 1
                ? `${uniqueFixtureType[0].type} - `
                : notes.length === 1
                    ? `${notes[0]} - `
                    : '';

            return {
                text: `${prefix}${renderDate(fd.date)}`,
                value: fd.date,
            }
        }));

    function getSides(date: string): TournamentSideDto[] {
        const fixtureDate: DivisionFixtureDateDto = fixtureDates.filter((fd: DivisionFixtureDateDto) => fd.date === date)[0];
        if (!fixtureDate) {
            return [];
        }

        return fixtureDate.tournamentFixtures
            .filter((tf: DivisionTournamentFixtureDetailsDto) => !!tf.winningSide)
            .map((tf: DivisionTournamentFixtureDetailsDto) => tf.winningSide);
    }

    async function createFixture() {
        /* istanbul ignore next */
        if (creating) {
            /* istanbul ignore next */
            return;
        }

        setCreating(true);
        try {
            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.update({
                id: createTemporaryId(),
                date: date,
                address: address,
                divisionId: divisionId,
                seasonId: season.id,
                sides: copySidesFrom ? getSides(copySidesFrom) : [],
            });

            if (response.success) {
                setAddress(null);
                await onTournamentChanged();
            } else {
                setSaveError(response);
            }
        } finally {
            setCreating(false);
        }
    }

    return (<tr datatype="new-tournament-fixture">
        <td colSpan={5}>
            <span className="margin-right">New </span>
            <BootstrapDropdown
                className="division-dropdown"
                options={divisionOptions}
                value={divisionId}
                onChange={async (v) => setDivisionId(v)}/>
            <span className="margin-right margin-left">tournament at</span>
            <BootstrapDropdown
                className="address-dropdown"
                options={addressOptions}
                value={address}
                onChange={async (v) => setAddress(v)}/>
            <span className="margin-right margin-left">add winners from</span>
            <BootstrapDropdown
                className="copy-sides-from-dropdown"
                options={copySidesFromOptions}
                value={copySidesFrom}
                onChange={async (v) => setCopySidesFrom(v)}/>
        </td>
        <td className="medium-column-width text-end">
            <button className="btn btn-sm btn-primary" onClick={createFixture} disabled={address == null}>
                {creating
                    ? (<LoadingSpinnerSmall/>)
                    : '➕'}
            </button>
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={async () => setSaveError(null)}
                    title="Could not delete tournament"/>)
                : null}
        </td>
    </tr>)
}