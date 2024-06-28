import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {renderDate} from "../../helpers/rendering";
import {ShareButton} from "../common/ShareButton";
import {useDivisionData} from "../league/DivisionDataContainer";
import {useBranding} from "../common/BrandingContainer";
import {getFilter, IInitialisedFilters} from "../../helpers/filters";
import {usePreferences} from "../common/PreferencesContainer";
import {useLocation, useNavigate} from "react-router-dom";

export function FilterFixtures() {
    const {teams, favouritesEnabled} = useDivisionData();
    const {getPreference, upsertPreference} = usePreferences();
    const {name} = useBranding();
    const teamFilters: IBootstrapDropdownItem[] = teams.sort(sortBy('name')).map(t => {
        return {value: t.name.trim().toLowerCase(), text: t.name};
    });
    teamFilters.unshift({value: null, text: 'All teams'});
    const favouriteTeamIds: string[] = getPreference<string[]>('favouriteTeamIds') || [];
    const navigate = useNavigate();
    const location = useLocation();
    const filter: IInitialisedFilters = getFilter(location);

    const typeFilters: IBootstrapDropdownItem[] = [
        {value: null, text: 'All fixtures'},
        {value: 'league', text: 'League fixtures'},
        {value: 'not(league)', text: 'Excl. league fixtures'},
        {value: 'qualifier', text: 'Qualifiers'},
        {value: 'tournament', text: 'Tournaments'}
    ];

    const dateFilters: IBootstrapDropdownItem[] = [
        {value: null, text: 'All dates'},
        {value: 'past', text: 'Past dates'},
        {value: 'last-week', text: 'Last week'},
        {value: 'yesterday', text: 'Yesterday'},
        {value: 'last+next', text: 'Prev & next dates'},
        {value: 'today', text: 'Today'},
        {value: 'tomorrow', text: 'Tomorrow'},
        {value: 'next-week', text: 'Next week'},
        {value: 'future', text: 'Future dates'},
    ];

    if (filter.date && isEmpty(dateFilters, f => f.value === filter.date)) {
        if (filter.date.match(/\d{4}-\d{2}-\d{2}/)) {
            dateFilters.push({value: filter.date, text: renderDate(filter.date)});
        } else {
            dateFilters.push({value: filter.date, text: filter.date});
        }
    }

    async function clearFavourites() {
        if (!window.confirm('Are you sure you want to clear your favourites?')) {
            return;
        }

        upsertPreference('favouriteTeamIds', null);
    }

    function clearFilters() {
        setFilter({});
    }

    function setFilter(newFilter: IInitialisedFilters) {
        const overallSearch: URLSearchParams = new URLSearchParams(newFilter);
        const searchParams: URLSearchParams = new URLSearchParams(location.search);
        const filterKeys: string[] = [ 'date', 'notes', 'team', 'type' ];

        for (let key of searchParams.keys()) {
            if (overallSearch.has(key)) {
                continue; // repeated keys (e.g. ?division=1&division=2 are returned twice, not once
            }
            if (any(filterKeys, k => k === key)) {
                continue; // don't add filters via this loop, they should have been added via the construction of overallSearch
            }
            const values: string[] = searchParams.getAll(key);
            for (let value of values) {
                overallSearch.append(key, value);
            }
        }

        Object.keys(newFilter).forEach((key: string) => {
            if (!newFilter[key]) {
                // any filter with a falsy value (e.g. null or empty string) should be removed from the search params
                overallSearch.delete(key);
            }
        })

        navigate({
            pathname: location.pathname,
            search: overallSearch.toString(),
            hash: location.hash,
        });
    }

    return (<div className="mb-3" datatype="fixture-filters">
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'type')} options={typeFilters}
                           value={filter.type || null}
                           datatype="type-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'date')} options={dateFilters}
                           value={filter.date || null}
                           datatype="date-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <BootstrapDropdown onChange={propChanged(filter, setFilter, 'team')} options={teamFilters}
                           value={filter.team ? filter.team.toLowerCase() : null}
                           datatype="team-filter"
                           className="dynamic-width-dropdown margin-right"/>
        <ShareButton text={`${name}, fixtures`}/>
        {favouritesEnabled && any(favouriteTeamIds) ? (
            <button className="btn btn-sm btn-outline-danger margin-left" title="Clear favourites" onClick={clearFavourites}>🌟</button>) : null}
        {any(Object.keys(filter)) ? (<button className="btn btn-sm btn-outline-primary margin-left" title="Clear all filters" onClick={clearFilters}>➖</button>) : null}
    </div>);
}
