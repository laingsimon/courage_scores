using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public static class AutoProvisionExtensions
{
    [ExcludeFromCodeCoverage]
    public static void LogInfo(this AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result, string message)
    {
        if (request.LogLevel <= LogLevel.Information)
        {
            result.Messages.Add(message);
        }
    }

    [ExcludeFromCodeCoverage]
    public static void LogWarning(this AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result, string message)
    {
        if (request.LogLevel <= LogLevel.Warning)
        {
            result.Messages.Add(message);
        }
    }

    public static DateTime MoveToDay(this DateTime referenceDate, DayOfWeek weekDay)
    {
        while (referenceDate.DayOfWeek != weekDay)
        {
            referenceDate = referenceDate.AddDays(1);
        }

        return referenceDate;
    }

    public static DateTime AddDays(this DateTime referenceDate, int days, IReadOnlyCollection<DateTime> except)
    {
        referenceDate = referenceDate.AddDays(days);
        while (except.Contains(referenceDate))
        {
            referenceDate = referenceDate.AddDays(days);
        }

        return referenceDate;
    }

    public static DivisionFixtureDto AdaptToGame(this Proposal proposal)
    {
        return new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            AwayScore = null,
            HomeScore = null,
            HomeTeam = AdaptToTeam(proposal.Home),
            AwayTeam = AdaptToTeam(proposal.Away),
            Proposal = true
        };
    }

    [ExcludeFromCodeCoverage]
    public static ActionResultDto<List<DivisionFixtureDateDto>> Error(this SeasonService _, string message)
    {
        return new ActionResultDto<List<DivisionFixtureDateDto>>
        {
            Errors = new List<string>
            {
                message
            }
        };
    }

    public static async Task<List<T>> RepeatAndReturnSmallest<T>(this Func<Task<List<T>>> provider, int times)
    {
        List<T>? smallest = null;

        for (var iteration = 0; iteration < times; iteration++)
        {
            var current = await provider();
            if (smallest == null || current.Count < smallest.Count)
            {
                smallest = current;
            }
        }

        return smallest!;
    }

    private static DivisionFixtureTeamDto AdaptToTeam(TeamDto team)
    {
        return new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.Address,
        };
    }
}