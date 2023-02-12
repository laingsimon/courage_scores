import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {propChanged, sortBy} from "../../Utilities";
import {ShareButton} from "../ShareButton";

export function FilterFixtures({ filter, setFilter, teams }) {
    const teamFilters = teams.sort(sortBy('name')).map(t => { return { value: t.id, text: t.name }; });
    teamFilters.unshift({ value: null, text: 'All teams' });

    const typeFilters = [
        { value: null,  text: 'All fixtures' },
        { value: 'league',  text: 'League fixtures' },
        { value: 'not(league)',  text: 'Excl. league fixtures' },
        { value: 'knockout',  text: 'Knockouts' },
        { value: 'tournament',  text: 'Tournaments' }
    ];

    const dateFilters = [
        { value: null, text: 'All dates' },
        { value: 'past', text: 'Past dates' },
        { value: 'future', text: 'Future dates' },
        { value: 'last+next', text: 'Prev & next dates' },
    ];

    if (filter.date && dateFilters.filter(f => f.value === filter.date).length === 0) {
        if (filter.date.match(/\d{4}-\d{2}-\d{2}/)) {
            dateFilters.push({ value: filter.date, text: new Date(filter.date).toDateString() });
        } else {
            dateFilters.push({ value: filter.date, text: filter.date });
        }
    }

    return (<div className="mb-3">
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'type')} options={typeFilters} value={filter.type || null} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'date')} options={dateFilters} value={filter.date || null} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'teamId')} options={teamFilters} value={filter.teamId || null} className="dynamic-width-dropdown margin-right" />
        <ShareButton text="Courage League, fixtures" />
    </div>);
}
