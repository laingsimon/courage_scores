import {any} from "../../Utilities";
import {AndFilter, Filter, NotFilter, NullFilter, OrFilter} from "../Filter";

export function isInPast(date) {
    const today = new Date(new Date().toDateString());
    return new Date(date) < today;
}

export function isInFuture(date) {
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today.setDate(today.getDate() + 1));
    return new Date(date) >= tomorrow;
}

export function isToday(date) {
    const today = new Date().toDateString();
    return today === new Date(date).toDateString();
}

export function isLastFixtureBeforeToday(renderContext, fixtures, date) {
    if (!renderContext.lastFixtureDateBeforeToday) {
        const dates = fixtures.map(f => f.date).filter(isInPast);
        // Assumes all dates are sorted
        if (any(dates)) {
            renderContext.lastFixtureDateBeforeToday = dates[dates.length - 1];
        } else {
            renderContext.lastFixtureDateBeforeToday = 'no fixtures in past';
        }
    }

    return date === renderContext.lastFixtureDateBeforeToday;
}

export function isNextFeatureAfterToday(renderContext, date) {
    const inFuture = isInFuture(date);
    if (!inFuture) {
        return false;
    }

    if (!renderContext.futureDateShown) {
        renderContext.futureDateShown = date;
    }

    return renderContext.futureDateShown === date;
}

export function optionallyInvertFilter(getFilter, filterInput, renderContext, fixtures) {
    if (filterInput && filterInput.indexOf('not(') === 0) {
        const withoutNot = filterInput.substring(4, filterInput.length - 1);
        const positiveFilter = getFilter(withoutNot, renderContext, fixtures);
        return positiveFilter
            ? new NotFilter(positiveFilter)
            : new NullFilter();
    }

    return getFilter(filterInput, renderContext, fixtures) ?? new NullFilter();
}

export function getDateFilter(date, renderContext, fixtures) {
    switch (date) {
        case 'past':
            return new Filter(c => isInPast(c.date));
        case 'future':
            return new Filter(c => isInFuture(c.date));
        case 'last+next':
            return new OrFilter([
                new Filter(c => isToday(c.date)),
                new Filter(c => isLastFixtureBeforeToday(renderContext, fixtures, c.date)),
                new Filter(c => isNextFeatureAfterToday(renderContext, c.date))
            ]);
        default:
            if (date && date.match(/\d{4}-\d{2}/)) {
                return new Filter(c => c.date.indexOf(date) === 0);
            }

            return new NullFilter();
    }
}

export function getTypeFilter(type) {
    switch (type) {
        case 'league':
            return new AndFilter([
                new Filter(c => !c.tournamentFixture),
                new Filter(c => c.fixture && c.fixture.isKnockout === false && c.fixture.awayTeam),
            ]);
        case 'qualifier':
            return new Filter(c => c.fixture && c.fixture.isKnockout === true && c.fixture.awayTeam);
        case 'tournament':
            return new Filter(c => c.tournamentFixture && c.tournamentFixture.proposed === false);
        default:
            return new NullFilter();
    }
}

export function getTeamIdFilter(teamId) {
    if (!teamId) {
        return new NullFilter();
    }

    return new OrFilter([
        new Filter(c => c.fixture && c.fixture.homeTeam && c.fixture.homeTeam.id === teamId),
        new Filter(c => c.fixture && c.fixture.awayTeam && c.fixture.awayTeam.id === teamId),
        new Filter(c => c.tournamentFixture && any(c.tournamentFixture.sides, s => s.teamId === teamId))
    ]);
}

export function getFilters(filter, renderContext, fixtures) {
    return new AndFilter([
        optionallyInvertFilter(getDateFilter, filter.date, renderContext, fixtures),
        optionallyInvertFilter(getTypeFilter, filter.type),
        optionallyInvertFilter(getTeamIdFilter, filter.teamId)
    ]);
}

export function initFilter(location) {
    const search = new URLSearchParams(location.search);
    const filter = {};
    if (search.has('date')) {
        filter.date = search.get('date');
    }
    if (search.has('type')) {
        filter.type = search.get('type');
    }
    if (search.has('teamId')) {
        filter.teamId = search.get('teamId');
    }

    return filter;
}

export function changeFilter(newFilter, setFilter, navigate, location) {
    setFilter(newFilter);

    const search = Object.assign({}, newFilter);
    Object.keys(newFilter).forEach(key => {
        if (!newFilter[key]) {
            delete search[key];
        }
    })

    navigate({
        pathname: location.pathname,
        search: new URLSearchParams(search).toString(),
        hash: location.hash,
    });
}