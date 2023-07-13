import {all, any} from "./collections";
import {AndFilter, Filter, NotFilter, NullFilter, OrFilter} from "../Filter";
import {isInFuture, isInPast, isToday} from "./dates";

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

export function isNextFixtureAfterToday(renderContext, date) {
    if (isInFuture(date)) {
        if (!renderContext.futureDateShown) {
            renderContext.futureDateShown = date;
        }

        return renderContext.futureDateShown === date;
    }

    return false;
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
                new Filter(c => isNextFixtureAfterToday(renderContext, c.date))
            ]);
        default:
            if (date && all(date.split(','), d => d.match(/\d{4}-\d{2}/))) {
                const splitDates = date.split(',');
                return new Filter(c => any(splitDates, date => c.date.indexOf(date) === 0));
            }

            return new NullFilter();
    }
}

export function getTypeFilter(type) {
    switch (type) {
        case 'league':
            return new AndFilter([
                new Filter(c => !c.tournamentFixture),
                new Filter(c => (c.fixture && c.fixture.isKnockout === false) || c.note),
            ]);
        case 'qualifier':
            return new Filter(c => (c.fixture && c.fixture.isKnockout === true) || c.note);
        case 'tournament':
            return new Filter(c => (c.tournamentFixture && c.tournamentFixture.proposed === false) || c.note);
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
    if (search.has('notes')) {
        filter.notes = search.get('notes');
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