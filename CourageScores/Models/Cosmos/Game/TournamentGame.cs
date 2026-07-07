using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

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

        var index = 0;
        foreach (var side in Sides)
        {
            side.Accept(scope.With(new VisitorScope { Index = index++ }), visitor);
        }

        Round?.Accept(scope, visitor);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageTournaments, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAnyAccess([AccessOption.ManageTournaments, AccessOption.EnterTournamentResults, AccessOption.UploadPhotos], token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageTournaments, token);
    }

    public UserAccessContext GetUserAccessContext()
    {
        return DivisionId != null
            ? UserAccessContext.ForDivision(SeasonId, DivisionId.Value)
            : UserAccessContext.ForSeason(SeasonId);
    }
}
