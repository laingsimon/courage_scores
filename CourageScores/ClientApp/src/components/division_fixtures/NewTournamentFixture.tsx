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

export interface INewTournamentFixtureProps {
    date: string,
    tournamentFixtures: DivisionTournamentFixtureDetailsDto[];
    onTournamentChanged(): Promise<any>;
}

export function NewTournamentFixture({date, tournamentFixtures, onTournamentChanged}: INewTournamentFixtureProps) {
    const {id, season} = useDivisionData();
    const {tournamentApi} = useDependencies();
    const {divisions} = useApp();
    const [address, setAddress] = useState(null);
    const [creating, setCreating] = useState(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const [divisionId, setDivisionId] = useState(id);
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
                seasonId: season.id
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
            <span className="margin-right margin-left">tournament at:</span>
            <BootstrapDropdown
                className="address-dropdown"
                options={addressOptions}
                value={address}
                onChange={async (v) => setAddress(v)}/>
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