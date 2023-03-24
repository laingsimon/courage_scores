using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public static class AutoProvisionExtensions
{
    [ExcludeFromCodeCoverage]
    public static void LogTrace(this AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result, string message)
    {
        if (request.LogLevel <= LogLevel.Trace)
        {
            result.Trace.Add(message);
        }
    }

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
            result.Warnings.Add(message);
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

    public static async Task<T> RepeatAndReturnSmallest<T>(this Func<Task<T>> provider, Func<T, int> getSize, int times)
    {
        T? smallest = default;
        int? smallestSize = null;

        for (var iteration = 0; iteration < times; iteration++)
        {
            var current = await provider();
            var currentSize = getSize(current);
            if (smallestSize == null || currentSize < smallestSize)
            {
                smallest = current;
                smallestSize = currentSize;
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