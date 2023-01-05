using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public static class AutoProvisionExtensions
{
    public static void LogInfo(this AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result, string message)
    {
        if (request.LogLevel <= LogLevel.Information)
        {
            result.Messages.Add(message);
        }
    }

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

    public static T GetAndRemove<T>(this List<T> list, int index)
    {
        var item = list[index];
        list.RemoveAt(index);
        return item;
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

    private static DivisionFixtureTeamDto AdaptToTeam(this TeamDto team)
    {
        return new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.Address,
        };
    }

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
}