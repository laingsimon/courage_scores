using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game.Sayg;

public class RecordedScoreAsYouGo : AuditedEntity, IPermissionedEntity, IScoreAsYouGo
{
    public Dictionary<int, Leg> Legs { get; set; } = new();
    public string YourName { get; set; } = null!;
    public string? OpponentName { get; set; }
    public int NumberOfLegs { get; set; }
    public int StartingScore { get; set; }
    public int HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public Guid? TournamentMatchId { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return true;
    }
}