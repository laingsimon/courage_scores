using System.Diagnostics;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Adapters.Season.Creation;

public class TemplateToHealthCheckAdapter : ISimpleOnewayAdapter<Template, SeasonHealthDto>
{
    public Task<SeasonHealthDto> Adapt(Template model, CancellationToken token)
    {
        var startDate = new DateTime(2023, 01, 01);
        var dto = new SeasonHealthDto
        {
            Name = model.Name,
            StartDate = startDate,
            Divisions = model.Divisions.Select((d, index) => AdaptDivision(d, $"Division {index + 1}", startDate, GetTeams(model))).ToList(),
        };
        dto.EndDate = dto.Divisions.SelectMany(d => d.Dates).Max(d => d.Date);

        return Task.FromResult(dto);
    }

    private static IEnumerable<string> GetPlaceholdersForDivision(DivisionTemplate division)
    {
        foreach (var date in division.Dates)
        {
            foreach (var fixture in date.Fixtures)
            {
                yield return fixture.Home;
                yield return fixture.Away;
            }
        }

        foreach (var sharedAddress in division.SharedAddresses)
        {
            foreach (var team in sharedAddress)
            {
                yield return team;
            }
        }
    }

    private static IReadOnlyDictionary<string, DivisionTeamDto> GetTeams(Template model)
    {
        var allPlaceholders = model.Divisions
            .SelectMany(GetPlaceholdersForDivision)
            .Distinct()
            .Select(p => new DivisionTeamDto { Name = p, Id = Guid.NewGuid() })
            .ToDictionary(t => t.Name);

        foreach (var sharedAddress in model.SharedAddresses)
        {
            var address = string.Join(" & ", sharedAddress);
            foreach (var placeholder in sharedAddress)
            {
                if (!allPlaceholders.TryGetValue(placeholder, out var team))
                {
                    Trace.TraceError("Unable to find placeholder in any division for season-level shared address: " + placeholder);
                    continue;
                }

                team.Address = address;
            }
        }

        foreach (var division in model.Divisions)
        {
            foreach (var sharedAddress in division.SharedAddresses)
            {
                var teamsForSharedAddress = sharedAddress
                    .Distinct()
                    .Select(p => allPlaceholders.TryGetValue(p, out var team)
                        ? team
                        : null)
                    .ToArray();
                var teamsWithSameAddress = allPlaceholders.Values.Join(
                    teamsForSharedAddress.Where(t => t != null && !string.IsNullOrEmpty(t.Address)),
                    t => t.Address,
                    t => t!.Address,
                    (allPlaceholdersTeam, _) => allPlaceholdersTeam)
                    .ToArray();

                var address = string.Join(" & ", teamsWithSameAddress.Select(t => t.Name).Concat(sharedAddress).Distinct().OrderBy(a => a));

                foreach (var otherTeam in teamsWithSameAddress.Concat(teamsForSharedAddress.Where(t => t != null)).Distinct())
                {
                    otherTeam!.Address = address;
                }
            }
        }

        return allPlaceholders;
    }

    private static DivisionHealthDto AdaptDivision(
        DivisionTemplate divisionTemplate,
        string name,
        DateTime startDate,
        IReadOnlyDictionary<string, DivisionTeamDto> teams)
    {
        var teamsInDivision = GetPlaceholdersForDivision(divisionTemplate).ToHashSet();

        return new DivisionHealthDto
        {
            Name = name,
            Teams = teams.Values.Where(t => teamsInDivision.Contains(t.Name)).ToList(),
            Dates = divisionTemplate.Dates.Select((d, index) => AdaptDate(d, startDate.AddDays(index * 7), teams)).ToList(),
        };
    }

    private static DivisionDateHealthDto AdaptDate(
        DateTemplate dateTemplate,
        DateTime date,
        IReadOnlyDictionary<string,DivisionTeamDto> teams)
    {
        return new DivisionDateHealthDto
        {
            Date = date,
            Fixtures = dateTemplate.Fixtures.Select(f => AdaptFixture(f, date, teams)).ToList(),
        };
    }

    private static LeagueFixtureHealthDto AdaptFixture(
        FixtureTemplate fixture,
        DateTime date,
        IReadOnlyDictionary<string, DivisionTeamDto> teams)
    {
        var homeTeam = teams[fixture.Home];
        var awayTeam = teams[fixture.Away];

        return new LeagueFixtureHealthDto
        {
            Date = date,
            Id = Guid.NewGuid(),
            HomeTeam = fixture.Home,
            HomeTeamId = homeTeam.Id,
            HomeTeamAddress = homeTeam.Address,
            AwayTeam = fixture.Away,
            AwayTeamId = awayTeam.Id,
            AwayTeamAddress = awayTeam.Address,
        };
    }
}