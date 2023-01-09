import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {nameSort} from "../../Utilities";

export function FilterFixtures({ filter, setFilter, teams }) {
    const teamFilters = teams.sort(nameSort).map(t => { return { value: t.id, text: t.name }; });
    teamFilters.unshift({ value: undefined, text: 'All teams' });

    const typeFilters = [
        { value: undefined,  text: 'All games' },
        { value: 'league',  text: 'League games' },
        { value: 'knockout',  text: 'Knockouts' },
        { value: 'tournament',  text: 'Tournaments' }
    ];

    const dateFilters = [
        { value: undefined, text: 'All dates' },
        { value: 'past', text: 'Past dates' },
        { value: 'future', text: 'Future dates' },
        { value: 'last+next', text: 'Prev & next dates' },
    ]

    function changeFilter(type, value) {
        const newFilter = Object.assign({}, filter);
        newFilter[type] = value;
        setFilter(newFilter);
    }

    return (<div className="mb-3">
        <BootstrapDropdown onChange={op => changeFilter('type', op)} options={typeFilters} value={filter.type} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={op => changeFilter('date', op)} options={dateFilters} value={filter.date} className="dynamic-width-dropdown margin-right" />
        <BootstrapDropdown onChange={op => changeFilter('teamId', op)} options={teamFilters} value={filter.teamId} className="dynamic-width-dropdown margin-right" />
    </div>);
}