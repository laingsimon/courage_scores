using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
public class EditGameDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public Guid DivisionId { get; set; }
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }
    public bool Postponed { get; set; }
}