using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a knockout game
/// </summary>
public class KnockoutGame : AuditedEntity, IPermissionedEntity, IGameVisitable
{
    /// <summary>
    /// The date for the knockout game
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The season for the knockout game
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The sides that can play in the game
    /// </summary>
    public List<KnockoutSide> Sides { get; set; } = new();

    /// <summary>
    /// The first round of the knockout game
    /// </summary>
    public KnockoutRound? Round { get; set; }

    /// <summary>
    /// The address for the knockout games
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public List<GamePlayer> OneEighties { get; set; } = new();

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public List<NotablePlayer> Over100Checkouts { get; set; } = new();

    public bool CanCreate(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    public bool CanEdit(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    public bool CanDelete(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitKnockoutGame(this);

        foreach (var player in Over100Checkouts)
        {
            visitor.VisitHiCheckout(player);
        }

        foreach (var player in OneEighties)
        {
            visitor.VisitOneEighty(player);
        }

        foreach (var side in Sides)
        {
            side.Accept(visitor);
        }

        Round?.Accept(visitor);
    }
}
