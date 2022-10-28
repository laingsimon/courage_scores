using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
public class EditGameDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public Guid DivisionId { get; set; }
    public GameTeamDto Home { get; set; } = null!;
    public GameTeamDto Away { get; set; } = null!;
}