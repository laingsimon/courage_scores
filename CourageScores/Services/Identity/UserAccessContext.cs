using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;

namespace CourageScores.Services.Identity;

[ExcludeFromCodeCoverage]
public class UserAccessContext
{
    public string? CallerMemberName { get; }
    public string? CallerFilePath { get; }

    public Guid? SeasonId { get; private init; }
    public Guid? DivisionId { get; private init; }
    public Guid? TeamId { get; private init; }

    private UserAccessContext(string? callerMemberName, string? callerFilePath)
    {
        CallerMemberName = callerMemberName;
        CallerFilePath = callerFilePath;
    }

    public static UserAccessContext None([CallerMemberName] string? memberName = null, [CallerFilePath] string? callerFilePath = null)
    {
        return new UserAccessContext(memberName, callerFilePath);
    }

    public static UserAccessContext ForSeason(Guid seasonId, [CallerMemberName] string? memberName = null, [CallerFilePath] string? callerFilePath = null)
    {
        return new UserAccessContext(memberName, callerFilePath)
        {
            SeasonId = seasonId,
        };
    }

    public static UserAccessContext ForDivision(Guid seasonId, Guid divisionId, [CallerMemberName] string? memberName = null, [CallerFilePath] string? callerFilePath = null)
    {
        return new UserAccessContext(memberName, callerFilePath)
        {
            SeasonId = seasonId,
            DivisionId = divisionId,
        };
    }

    public static UserAccessContext ForTeam(Guid seasonId, Guid divisionId, Guid teamId, [CallerMemberName] string? memberName = null, [CallerFilePath] string? callerFilePath = null)
    {
        return new UserAccessContext(memberName, callerFilePath)
        {
            SeasonId = seasonId,
            DivisionId = divisionId,
            TeamId = teamId,
        };
    }
}
