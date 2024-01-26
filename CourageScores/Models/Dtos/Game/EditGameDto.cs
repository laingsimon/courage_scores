using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
[PropertyIsOptional(nameof(Id))]
public class EditGameDto : IEditGameDto, IIntegrityCheckDto
{
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }

    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public Guid DivisionId { get; set; }
    public Guid SeasonId { get; set; }
    public bool Postponed { get; set; }
    public bool IsKnockout { get; set; }
    public bool AccoladesCount { get; set; }
    public DateTime? LastUpdated { get; set; }
}