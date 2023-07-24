import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {isEmpty, sortBy} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {renderDate} from "../../helpers/rendering";
import {ShareButton} from "../common/ShareButton";
import {useDivisionData} from "../DivisionDataContainer";
import {useBranding} from "../../BrandingContainer";

export function FilterFixtures({ filter, setFilter }) {
    const { teams } = useDivisionData();
    const { name } = useBranding();
    const teamFilters = teams.sort(sortBy('name')).map(t => { return { value: t.name.trim().toLowerCase(), text: t.name }; });
    teamFilters.unshift({ value: null, text: 'All teams' });

    const typeFilters = [
        { value: null,  text: 'All fixtures' },
        { value: 'league',  text: 'League fixtures' },
        { value: 'not(league)',  text: 'Excl. league fixtures' },
        { value: 'qualifier',  text: 'Qualifiers' },
        { value: 'tournament',  text: 'Tournaments' }
    ];

    const dateFilters = [
        { value: null, text: 'All dates' },
        { value: 'past', text: 'Past dates' },
        { value: 'future', text: 'Future dates' },
        { value: 'last+next', text: 'Prev & next dates' },
    ];

    if (filter.date && isEmpty(dateFilters, f => f.value === filter.date)) {
        if (filter.date.match(/\d{4}-\d{2}-\d{2}/)) {
            dateFilters.push({ value: filter.date, text: renderDate(filter.date) });
        } else {
            dateFilters.push({ value: filter.date, text: filter.date });
        }
    }

    return (<div className="mb-3" datatype="fixture-filters">
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'type')} options={typeFilters} value={filter.type || null} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'date')} options={dateFilters} value={filter.date || null} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'teamId')} options={teamFilters} value={filter.teamId ? filter.teamId.toLowerCase() : null} className="dynamic-width-dropdown margin-right" />
        <ShareButton text={`${name}, fixtures`} />
    </div>);
}
