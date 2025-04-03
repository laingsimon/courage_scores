using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season.Creation;

public class FixtureDateAssignmentStrategy : IFixtureDateAssignmentStrategy
{
    public async Task<bool> AssignDates(ProposalContext context, CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template).ToList();
        var currentDate = context.MatchContext.SeasonDto.StartDate;
        var templateDateIndex = 0;
        var maxTemplateIndex = context.Template.Divisions.Select(d => d.Dates.Count).OrderByDescending(c => c).FirstOrDefault();
        var success = true;

        while (templateDateIndex < maxTemplateIndex)
        {
            token.ThrowIfCancellationRequested();

            var templateDateForDivisions = divisionMappings.Select(mapping => mapping.TemplateDivision.Dates[templateDateIndex]).ToArray();
            var fixtureDateForDivisions = context.MatchContext.Divisions.Select(d => d.Fixtures.Where(fd => fd.Date == currentDate).ToArray()).ToList();

            // there must be no fixtures, notes or tournaments on this date
            if (!AreThereAnyFixturesNotesOrTournaments(fixtureDateForDivisions))
            {
                // ok to provision fixtures for this date
                success = await ProvisionFixturesForThisDate(context, currentDate, templateDateForDivisions, token) && success;
                templateDateIndex++;
            }

            currentDate = currentDate.AddDays(7);
        }

        if (!success)
        {
            // add any placeholders where teams could not be found
            foreach (var placeholder in context.PlaceholdersWithoutTeams)
            {
                context.Result.Warnings.Add($"Could not find a team for a fixture - {placeholder}");
            }
        }

        return success;
    }

    private static bool AreThereAnyFixturesNotesOrTournaments(IEnumerable<IEnumerable<DivisionFixtureDateDto>> fixtureDateForDivisions)
    {
        return fixtureDateForDivisions.Aggregate(
            0,
            (current, prev) => current + prev.Count(d => d.Fixtures.Count + d.Notes.Count + d.TournamentFixtures.Count > 0)) > 0;
    }

    private static async Task<bool> ProvisionFixturesForThisDate(
        ProposalContext context,
        DateTime currentDate,
        IEnumerable<DateTemplateDto> templateDateForDivisions,
        CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template);
        var success = true;

        foreach (var mapping in divisionMappings.Zip(templateDateForDivisions))
        {
            token.ThrowIfCancellationRequested();

            var fixturesToCreate = mapping.Second.Fixtures;
            var divisionToAddFixturesTo = mapping.First.SeasonDivision;
            var fixtureDate = divisionToAddFixturesTo.Fixtures.FirstOrDefault(fd => fd.Date == currentDate);
            if (fixtureDate == null)
            {
                fixtureDate = new DivisionFixtureDateDto
                {
                    Date = currentDate,
                };
                divisionToAddFixturesTo.Fixtures = divisionToAddFixturesTo.Fixtures.Concat(new[]
                {
                    fixtureDate,
                }).OrderBy(f => f.Date).ToList();
            }

            success = await CreateFixturesForDate(context, fixturesToCreate, fixtureDate, token) && success;
        }

        return success;
    }

    private static Task<bool> CreateFixturesForDate(ProposalContext context, List<FixtureTemplateDto> fixturesToCreate, DivisionFixtureDateDto fixtureDate, CancellationToken token)
    {
        var success = true;

        foreach (var fixtureToCreate in fixturesToCreate)
        {
            token.ThrowIfCancellationRequested();

            TeamDto? awayTeam = null;
            context.PlaceholderMapping.TryGetValue(fixtureToCreate.Home.Key, out var homeTeam);
            if (fixtureToCreate.Away != null)
            {
                context.PlaceholderMapping.TryGetValue(fixtureToCreate.Away.Key, out awayTeam);
            }

            if (homeTeam == null)
            {
                context.Result.Success = false;
                context.PlaceholdersWithoutTeams.Add(fixtureToCreate.Home.Key);
                success = false;
                continue;
            }

            if (awayTeam == null && fixtureToCreate.Away?.Key != null)
            {
                context.Result.Success = false;
                context.PlaceholdersWithoutTeams.Add(fixtureToCreate.Away.Key);
                success = false;
                continue;
            }

            fixtureDate.Fixtures.Add(new DivisionFixtureDto
            {
                Id = homeTeam.Id,
                Proposal = true,
                HomeTeam =
                    new DivisionFixtureTeamDto
                    {
                        Id = homeTeam.Id,
                        Name = homeTeam.Name,
                        Address = homeTeam.Address,
                    },
                AwayTeam = awayTeam != null
                    ? new DivisionFixtureTeamDto
                    {
                        Id = awayTeam.Id,
                        Name = awayTeam.Name,
                        Address = awayTeam.Address,
                    }
                    : null,
                IsKnockout = false,
                Postponed = false,
                AccoladesCount = true,
                AwayScore = null,
                HomeScore = null,
            });
        }

        return Task.FromResult(success);
    }
}