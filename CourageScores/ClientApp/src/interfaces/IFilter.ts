export interface IFilter {
    // TODO: Looks like item should IDivisionFixtureDateDto, but that doesn't fit every use-case - see DivisionFixtures.applyFixtureFilters()
    apply: (item: any) => boolean
}
