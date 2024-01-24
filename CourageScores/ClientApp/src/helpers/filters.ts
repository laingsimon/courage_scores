import {all, any} from "./collections";
import {AndFilter, Filter, NotFilter, NullFilter, OrFilter} from "../Filter";
import {isInFuture, isInPast, isToday} from "./dates";
import {IFilter} from "../interfaces/IFilter";

// TODO: create interface for renderContext

export function isLastFixtureBeforeToday(renderContext: any, fixtures: any, date: any): boolean {
    if (!renderContext.lastFixtureDateBeforeToday) {
        const dates = fixtures.map((f: {date: string}) => f.date).filter(isInPast);
        // Assumes all dates are sorted
        if (any(dates)) {
            renderContext.lastFixtureDateBeforeToday = dates[dates.length - 1];
        } else {
            renderContext.lastFixtureDateBeforeToday = 'no fixtures in past';
        }
    }

    return date === renderContext.lastFixtureDateBeforeToday;
}

export function isNextFixtureAfterToday(renderContext: any, date: string): boolean {
    if (isInFuture(date)) {
        if (!renderContext.futureDateShown) {
            renderContext.futureDateShown = date;
        }

        return renderContext.futureDateShown === date;
    }

    return false;
}

export function optionallyInvertFilter(getFilter: (constraint: string, context: any, fixtures: any) => IFilter, filterInput?: string, renderContext?: any, fixtures?: any): IFilter {
    if (filterInput && filterInput.indexOf('not(') === 0) {
        const withoutNot = filterInput.substring(4, filterInput.length - 1);
        const positiveFilter = getFilter(withoutNot, renderContext, fixtures);
        return positiveFilter
            ? new NotFilter(positiveFilter)
            : new NullFilter();
    }

    return getFilter(filterInput, renderContext, fixtures) ?? new NullFilter();
}

export function getDateFilter(date: string, renderContext: any, fixtures: any): IFilter {
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
            if (date && all(date.split(','), (d: string) => !!d.match(/\d{4}-\d{2}/))) {
                const splitDates = date.split(',');
                return new Filter(c => any(splitDates, date => c.date.indexOf(date) === 0));
            }

            return new NullFilter();
    }
}

export function getTypeFilter(type: string): IFilter {
    switch (type) {
        case 'league':
            return new AndFilter([
                new Filter(c => !c.tournamentFixture),
                new Filter(c => (c.fixture && !c.fixture.isKnockout) || c.note),
            ]);
        case 'qualifier':
            return new Filter(c => (c.fixture && c.fixture.isKnockout) || c.note);
        case 'tournament':
            return new Filter(c => (c.tournamentFixture && !c.tournamentFixture.proposed) || c.note);
        default:
            return new NullFilter();
    }
}

export function getTeamFilter(name: string): IFilter {
    if (!name) {
        return new NullFilter();
    }

    return new OrFilter([
        new Filter(c => c.fixture && c.fixture.homeTeam && (c.fixture.homeTeam.id === name || c.fixture.homeTeam.name.toLowerCase() === name.toLowerCase())),
        new Filter(c => c.fixture && c.fixture.awayTeam && (c.fixture.awayTeam.id === name || c.fixture.awayTeam.name.toLowerCase() === name.toLowerCase())),
        new Filter(c => c.tournamentFixture && any(c.tournamentFixture.sides, (s: {teamId: string, name: string}) => s.teamId === name || s.name.toLowerCase() === name.toLowerCase()))
    ]);
}

export function getNotesFilter(notesFilter: string): IFilter {
    if (!notesFilter) {
        return new NullFilter();
    }

    switch (notesFilter) {
        case 'only-with-fixtures':
            return new Filter(fd => any(fd.fixtures) || any(fd.tournamentFixtures));
        default:
            const notes = notesFilter.split(';');
            return new OrFilter(
                notes.map(note => new Filter(fd => any(fd.notes, (n: {note: string}) => n.note.toLowerCase().indexOf(note.toLowerCase()) === 0)))
            );
    }
}

export function getFixtureFilters(filter: any): IFilter {
    return new AndFilter([
        optionallyInvertFilter(getTypeFilter, filter.type),
        optionallyInvertFilter(getTeamFilter, filter.team)
    ]);
}

export function getFixtureDateFilters(filter: { date?: string, notes?: string }, renderContext: any, fixtures: any): IFilter {
    return new AndFilter([
        new Filter(fd => any(fd.fixtures) || any(fd.tournamentFixtures) || any(fd.notes) || fd.isNew),
        optionallyInvertFilter(getDateFilter, filter.date, renderContext, fixtures),
        optionallyInvertFilter(getNotesFilter, filter.notes),
    ]);
}

export interface IInitialisedFilters {
    date?: string;
    type?: string;
    team?: string;
    notes?: string
}

export function initFilter(location: { search: string }): IInitialisedFilters {
    const search = new URLSearchParams(location.search);
    const filter: IInitialisedFilters = {};
    if (search.has('date')) {
        filter.date = search.get('date');
    }
    if (search.has('type')) {
        filter.type = search.get('type');
    }
    if (search.has('team')) {
        filter.team = search.get('team');
    }
    if (search.has('notes')) {
        filter.notes = search.get('notes');
    }

    return filter;
}

export function changeFilter(newFilter: IInitialisedFilters, setFilter: (filter: IInitialisedFilters) => any, navigate: Function, location: { pathname: string, hash: string }) {
    setFilter(newFilter);

    const search: IInitialisedFilters = Object.assign({}, newFilter);
    Object.keys(newFilter).forEach((key: string) => {
        if (!newFilter[key]) {
            delete search[key];
        }
    })

    navigate({
        pathname: location.pathname,
        search: new URLSearchParams(search as any).toString(),
        hash: location.hash,
    });
}