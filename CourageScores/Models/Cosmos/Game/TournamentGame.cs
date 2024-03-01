using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a tournament game
/// </summary>
public class TournamentGame : AuditedEntity, IPermissionedEntity, IGameVisitable, IPhotoEntity
{
    /// <summary>
    /// The date for the tournament game
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The season for the tournament game
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The division id for this tournament game, if not cross-divisional
    /// </summary>
    public Guid? DivisionId { get; set; }

    /// <summary>
    /// The sides that can play in the game
    /// </summary>
    public List<TournamentSide> Sides { get; set; } = new();

    /// <summary>
    /// The first round of the tournament game
    /// </summary>
    public TournamentRound? Round { get; set; }

    /// <summary>
    /// The address for the tournament games
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public List<TournamentPlayer> OneEighties { get; set; } = new();

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public List<NotableTournamentPlayer> Over100Checkouts { get; set; } = new();

    public string? Notes { get; set; }
    public string? Type { get; set; }
    public bool AccoladesCount { get; set; }
    public int? BestOf { get; set; }
    public bool SingleRound { get; set; }
    public string? Host { get; set; }
    public string? Opponent { get; set; }
    public string? Gender { get; set; }
    public List<PhotoReference> Photos { get; set; } = new();

    public void Accept(IVisitorScope scope, IGameVisitor visitor)
    {
        scope = scope.With(new VisitorScope
        {
            Tournament = this,
        });

        visitor.VisitGame(this);

        if (AccoladesCount)
        {
            foreach (var player in Over100Checkouts)
            {
                visitor.VisitHiCheckout(scope, player);
            }

            foreach (var player in OneEighties)
            {
                visitor.VisitOneEighty(scope, player);
            }
        }

        foreach (var side in Sides)
        {
            side.Accept(scope, visitor);
        }

        Round?.Accept(scope, visitor);
    }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return user?.Access?.ManageTournaments == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return user?.Access?.ManageTournaments == true || user?.Access?.EnterTournamentResults == true || user?.Access?.UploadPhotos == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.ManageTournaments == true;
    }
}