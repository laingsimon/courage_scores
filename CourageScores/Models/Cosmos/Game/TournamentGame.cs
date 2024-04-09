using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

public class TournamentGame : AuditedEntity, IPermissionedEntity, IGameVisitable, IPhotoEntity
{
    public DateTime Date { get; set; }
    public Guid SeasonId { get; set; }
    public Guid? DivisionId { get; set; }
    public List<TournamentSide> Sides { get; set; } = new();
    public TournamentRound? Round { get; set; }
    public string Address { get; set; } = null!;
    public List<TournamentPlayer> OneEighties { get; set; } = new();
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
    public bool ExcludeFromReports { get; set; }

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