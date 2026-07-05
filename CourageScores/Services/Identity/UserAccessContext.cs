using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Identity;

[ExcludeFromCodeCoverage]
public class UserAccessContext
{
    public Guid? SeasonId { get; private init; }
    public Guid? DivisionId { get; private init; }
    public Guid? TeamId { get; private init; }

    public static UserAccessContext Admin()
    {
        return new UserAccessContext();
    }

    public static UserAccessContext ForSeason(Guid seasonId)
    {
        return new UserAccessContext
        {
            SeasonId = seasonId,
        };
    }

    public static UserAccessContext ForDivision(Guid seasonId, Guid divisionId)
    {
        return new UserAccessContext
        {
            SeasonId = seasonId,
            DivisionId = divisionId,
        };
    }

    public static UserAccessContext ForTeam(Guid seasonId, Guid divisionId, Guid teamId)
    {
        return new UserAccessContext
        {
            SeasonId = seasonId,
            DivisionId = divisionId,
            TeamId = teamId,
        };
    }
}
