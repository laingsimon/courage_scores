import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {ShareButton} from "../common/ShareButton";
import {useDivisionData} from "../league/DivisionDataContainer";
import {useBranding} from "../common/BrandingContainer";
import {getFilter, IInitialisedFilters} from "../../helpers/filters";
import {usePreferences} from "../common/PreferencesContainer";
import {Link, useLocation} from "react-router-dom";

export function FilterFixtures() {
    const {teams, favouritesEnabled} = useDivisionData();
    const {getPreference, upsertPreference} = usePreferences();
    const {name} = useBranding();
    const location = useLocation();
    const teamFilters: IBootstrapDropdownItem[] = teams.sort(sortBy('name')).map(t => {
        return getFilterOption('team', t.name, t.name.trim().toLowerCase());
    });
    teamFilters.unshift(getFilterOption('team', 'All teams'));
    const favouriteTeamIds: string[] = getPreference<string[]>('favouriteTeamIds') || [];
    const filter: IInitialisedFilters = getFilter(location);

    function getFilterOption(type: string, text: string, value?: string): IBootstrapDropdownItem {
        return {
            value: value || null,
            text: (<Link className="text-decoration-none text-dark" to={`${location.pathname}${replaceSearch(type, value)}${location.hash}`}>
                {text}
            </Link>),
        };
    }

    const typeFilters: IBootstrapDropdownItem[] = [
        getFilterOption('type', 'All fixtures'),
        getFilterOption('type', 'League fixtures', 'league'),
        getFilterOption('type', 'Excl. league fixtures', 'not(league)'),
        getFilterOption('type', 'Qualifiers', 'qualifier'),
        getFilterOption('type', 'Tournaments', 'tournament'),
    ];

    const dateFilters: IBootstrapDropdownItem[] = [
        getFilterOption('date', 'All dates'),
        getFilterOption('date', 'Past dates', 'past'),
        getFilterOption('date', 'Last week', 'last-week'),
        getFilterOption('date', 'Yesterday', 'yesterday'),
        getFilterOption('date', 'Prev & nex dates', 'last+next'),
        getFilterOption('date', 'Today', 'today'),
        getFilterOption('date', 'Tomorrow', 'tomorrow'),
        getFilterOption('date', 'Next week', 'next-week'),
        getFilterOption('date', 'Future dates', 'future'),
    ];

    if (filter.date && isEmpty(dateFilters, f => f.value === filter.date)) {
        if (filter.date.match(/\d{4}-\d{2}-\d{2}/)) {
            dateFilters.push(getFilterOption('date', renderDate(filter.date), filter.date));
        } else {
            dateFilters.push(getFilterOption('date', filter.date, filter.date));
        }
    }

    function replaceSearch(name: string, newValue?: string): string {
        const search: URLSearchParams = new URLSearchParams(location.search);
        if (newValue) {
            search.set(name, newValue);
        } else {
            search.delete(name);
        }

        return '?' + search.toString();
    }

    async function clearFavourites() {
        if (!window.confirm('Are you sure you want to clear your favourites?')) {
            return;
        }

        upsertPreference('favouriteTeamIds', null);
    }

    function clearFilters(): string {
        const search: URLSearchParams = new URLSearchParams(location.search);
        search.delete('date');
        search.delete('notes');
        search.delete('team');
        search.delete('type');

        return '?' + search.toString();
    }

    return (<div className="mb-3" datatype="fixture-filters">
        <BootstrapDropdown options={typeFilters}
                           value={filter.type || null}
                           datatype="type-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <BootstrapDropdown options={dateFilters}
                           value={filter.date || null}
                           datatype="date-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <BootstrapDropdown options={teamFilters}
                           value={filter.team ? filter.team.toLowerCase() : null}
                           datatype="team-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <ShareButton text={`${name}, fixtures`}/>
        {favouritesEnabled && any(favouriteTeamIds) ? (
            <button className="btn btn-sm btn-outline-danger margin-left" title="Clear favourites" onClick={clearFavourites}>🌟</button>) : null}
        {any(Object.keys(filter)) ? (<Link className="btn btn-sm btn-outline-primary margin-left" title="Clear all filters" to={`${location.pathname}${clearFilters()}${location.hash}`}>➖</Link>) : null}
    </div>);
}
