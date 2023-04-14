using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a tournament game
/// </summary>
public class TournamentGame : AuditedEntity, IPermissionedEntity, IGameVisitable
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

    /// <summary>
    /// Notes for this tournament game
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// The type of tournament
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Whether any player accolades (180s, hi-checks) should be included in the player table
    /// </summary>
    public bool AccoladesQualify { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitGame(this);

        if (AccoladesQualify)
        {
            foreach (var player in Over100Checkouts)
            {
                visitor.VisitHiCheckout(player);
            }

            foreach (var player in OneEighties)
            {
                visitor.VisitOneEighty(player);
            }
        }

        foreach (var side in Sides)
        {
            side.Accept(visitor);
        }

        Round?.Accept(visitor);
    }
}
