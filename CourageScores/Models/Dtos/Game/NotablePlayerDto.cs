namespace CourageScores.Models.Dtos.Game;

public class NotablePlayerDto : GamePlayerDto
{
    /// <summary>
    /// Any notes about the player, e.g. new player, the checkout amount, etc.
    /// </summary>
    public string? Notes { get; set; }
}