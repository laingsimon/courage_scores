using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos.Game.Sayg;

public class RecordedScoreAsYouGo : AuditedEntity, IPermissionedEntity, IScoreAsYouGo
{
    public string YourName { get; set; } = null!;
    public string? OpponentName { get; set; }
    public int NumberOfLegs { get; set; }
    public int StartingScore { get; set; }
    public int HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public Guid? TournamentMatchId { get; set; }

    [ExcludeFromCodeCoverage]
    public Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(true);
    }

    [ExcludeFromCodeCoverage]
    public Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(true);
    }

    [ExcludeFromCodeCoverage]
    public Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(true);
    }

    public Dictionary<int, Leg> Legs { get; set; } = new();
}
