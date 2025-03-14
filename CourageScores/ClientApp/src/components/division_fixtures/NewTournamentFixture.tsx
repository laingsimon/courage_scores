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
import {Dialog} from "../common/Dialog";
import {stateChanged} from "../../helpers/events";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface INewTournamentFixtureProps {
    date: string,
    tournamentFixtures: DivisionTournamentFixtureDetailsDto[];
    onTournamentChanged(): UntypedPromise;
}

export function NewTournamentFixture({date, tournamentFixtures, onTournamentChanged}: INewTournamentFixtureProps) {
    const ADD_CUSTOM_ADDRESS_VALUE = 'ADD_CUSTOM_ADDRESS';
    const {id, season, fixtures: fixtureDates} = useDivisionData();
    const {tournamentApi} = useDependencies();
    const {divisions} = useApp();
    const [copySidesFrom, setCopySidesFrom] = useState<string | null>(null);
    const [address, setAddress] = useState<string>('');
    const [creating, setCreating] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const [divisionId, setDivisionId] = useState<string>(id!);
    const [customAddress, setCustomAddress] = useState<string | undefined>(undefined);
    const [editCustomAddress, setEditCustomAddress] = useState<boolean>(false);
    const addressOptions: IBootstrapDropdownItem[] = getCustomAddressItem(customAddress).concat(distinct(tournamentFixtures, 'address')
        .map(f => {
            return {
                text: f.proposed
                    ? f.address
                    : `⚠ ${f.address} (Already in use)`,
                value: f.address,
                className: f.proposed
                    ? undefined
                    : 'text-secondary',
            }
        }));
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
        .filter(fd => any(fd.tournamentFixtures, t => !!t.winningSide))
        .map(fd => {
            const type = getTypeName(fd);
            const prefix: string = type
                ? `${type} - `
                : '';

            return {
                text: `${prefix}${renderDate(fd.date)}`,
                value: fd.date,
            }
        }));

    function getCustomAddressItem(address?: string): IBootstrapDropdownItem[] {
        if (!address) {
            return [ {
                text: '➕ Enter address',
                value: ADD_CUSTOM_ADDRESS_VALUE,
            } ];
        }

        return [ {
            text: `➕ ${address}`,
            value: address
        }]
    }

    async function useCustomAddress() {
        setEditCustomAddress(false);
        setAddress(customAddress || '');
    }

    async function closeCustomAddressDialog() {
        setEditCustomAddress(false);
        setCustomAddress(undefined);
    }

    async function changeAddress(address: string) {
        if (address === ADD_CUSTOM_ADDRESS_VALUE || address === customAddress) {
            setEditCustomAddress(true);
            return;
        }

        setAddress(address);
    }

    function getTypeName(fixtureDate: DivisionFixtureDateDto): string | undefined {
        const uniqueFixtureType: TournamentGameDto[] = distinct(fixtureDate.tournamentFixtures, 'type');
        const notes: string[] = fixtureDate.notes?.map((n: FixtureDateNoteDto) => n.note) || [];
        return uniqueFixtureType.length === 1
            ? uniqueFixtureType[0].type
            : notes.length === 1
                ? notes[0]
                : undefined;
    }

    function getSides(date: string): TournamentSideDto[] {
        const fixtureDate: DivisionFixtureDateDto | undefined = fixtureDates?.filter((fd: DivisionFixtureDateDto) => fd.date === date)[0];
        if (!fixtureDate) {
            return [];
        }

        return fixtureDate.tournamentFixtures
            ?.filter((tf: DivisionTournamentFixtureDetailsDto) => !!tf.winningSide)
            .map((tf: DivisionTournamentFixtureDetailsDto) => tf.winningSide!) || [];
    }

    function getType(date: string): string | undefined {
        const fixtureDate: DivisionFixtureDateDto | undefined = fixtureDates?.filter((fd: DivisionFixtureDateDto) => fd.date === date)[0];
        if (!fixtureDate) {
            return undefined;
        }

        const type = getTypeName(fixtureDate);
        return type
            ? `${type} final`
            : undefined;
    }

    async function createFixture() {
        /* istanbul ignore next */
        if (creating) {
            /* istanbul ignore next */
            return;
        }

        if ((date > season.endDate || date < season.startDate) && !confirm('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?')) {
            return;
        }

        setCreating(true);
        try {
            const division = divisions.filter(d => d.id === divisionId)[0];
            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.update({
                id: createTemporaryId(),
                date: date,
                address: address,
                divisionId: division ? division.id : undefined,
                seasonId: season!.id,
                sides: copySidesFrom ? getSides(copySidesFrom) : [],
                type: copySidesFrom ? getType(copySidesFrom) : undefined,
                singleRound: division ? division.superleague : false,
            });

            if (response.success) {
                setAddress('');
                setCustomAddress(undefined);
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
                onChange={changeAddress}/>
            <span className="margin-right margin-left">add winners from</span>
            <BootstrapDropdown
                className="copy-sides-from-dropdown"
                options={copySidesFromOptions}
                value={copySidesFrom}
                onChange={async (v) => setCopySidesFrom(v)}/>
        </td>
        <td className="medium-column-width text-end">
            <button className="btn btn-sm btn-primary" onClick={createFixture} disabled={!address}>
                {creating
                    ? (<LoadingSpinnerSmall/>)
                    : '➕'}
            </button>
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={async () => setSaveError(null)}
                    title="Could not create tournament"/>)
                : null}
            {editCustomAddress ? (<Dialog title="Enter address">
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Address</span>
                    </div>
                    <input className="form-control" name="address" value={customAddress || ''} onChange={stateChanged(setCustomAddress)}/>
                </div>
                <div className="modal-footer px-0 pb-0">
                    <div className="left-aligned">
                        <button className="btn btn-secondary" onClick={closeCustomAddressDialog}>Close</button>
                    </div>
                    <button className="btn btn-primary" onClick={useCustomAddress}>Use address</button>
                </div>
            </Dialog>) : null}
        </td>
    </tr>)
}