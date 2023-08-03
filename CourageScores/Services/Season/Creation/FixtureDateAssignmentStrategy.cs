using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public class FixtureDateAssignmentStrategy : IFixtureDateAssignmentStrategy
{
    public async Task<bool> AssignDates(ProposalContext context, CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template).ToList();
        var currentDate = context.MatchContext.SeasonDto.StartDate;
        var templateDateIndex = 0;
        var maxTemplateIndex = context.Template.Divisions.Select(d => d.Dates.Count).OrderByDescending(c => c).FirstOrDefault();

        while (templateDateIndex < maxTemplateIndex)
        {
            token.ThrowIfCancellationRequested();

            var templateDateForDivisions = divisionMappings.Select(mapping => mapping.TemplateDivision.Dates[templateDateIndex]);
            var fixtureDateForDivisions = context.MatchContext.Divisions.Select(d => d.Fixtures.Where(fd => fd.Date == currentDate)).ToList();

            // there must be no fixtures, notes or tournaments on this date
            if (!AreThereAnyFixturesNotesOrTournaments(fixtureDateForDivisions))
            {
                // ok to provision fixtures for this date
                await ProvisionFixturesForThisDate(context, currentDate, templateDateForDivisions, token);
                templateDateIndex++;
            }

            currentDate = currentDate.AddDays(7);
        }

        return true;
    }

    private static bool AreThereAnyFixturesNotesOrTournaments(IEnumerable<IEnumerable<DivisionFixtureDateDto>> fixtureDateForDivisions)
    {
        return fixtureDateForDivisions.Aggregate(
            0,
            (current, prev) => current + prev.Count(d => d.Fixtures.Count + d.Notes.Count + d.TournamentFixtures.Count > 0)) > 0;
    }

    private static async Task ProvisionFixturesForThisDate(
        ProposalContext context,
        DateTime currentDate,
        IEnumerable<DateTemplateDto> templateDateForDivisions,
        CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template);
        foreach (var mapping in divisionMappings.Zip(templateDateForDivisions))
        {
            token.ThrowIfCancellationRequested();

            var fixturesToCreate = mapping.Second.Fixtures;
            var divisionToAddFixturesTo = mapping.First.SeasonDivision;
            var fixtureDate = divisionToAddFixturesTo.Fixtures.FirstOrDefault(fd => fd.Date == currentDate);
            if (fixtureDate == null)
            {
                fixtureDate = new DivisionFixtureDateDto { Date = currentDate };
                divisionToAddFixturesTo.Fixtures = divisionToAddFixturesTo.Fixtures.Concat(new[] { fixtureDate }).OrderBy(f => f.Date).ToList();
            }

            await CreateFixturesForDate(context, fixturesToCreate, fixtureDate, token);
        }
    }

    private static async Task CreateFixturesForDate(ProposalContext context, List<FixtureTemplateDto> fixturesToCreate, DivisionFixtureDateDto fixtureDate, CancellationToken token)
    {
        foreach (var fixtureToCreate in fixturesToCreate)
        {
            token.ThrowIfCancellationRequested();

            var homeTeam = context.PlaceholderMapping[fixtureToCreate.Home.Key];
            var awayTeam = fixtureToCreate.Away != null ? context.PlaceholderMapping[fixtureToCreate.Away.Key] : null;
            fixtureDate.Fixtures.Add(new DivisionFixtureDto
            {
                Id = homeTeam.Id,
                Proposal = true,
                HomeTeam =
                    new DivisionFixtureTeamDto { Id = homeTeam.Id, Name = homeTeam.Name, Address = homeTeam.Address },
                AwayTeam = awayTeam != null
                    ? new DivisionFixtureTeamDto { Id = awayTeam.Id, Name = awayTeam.Name, Address = awayTeam.Address }
                    : null,
                IsKnockout = false,
                Postponed = false,
                AccoladesCount = true,
                AwayScore = null,
                HomeScore = null,
            });
        }
    }
}