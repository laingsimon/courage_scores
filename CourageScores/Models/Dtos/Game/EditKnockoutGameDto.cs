using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
public class EditKnockoutGameDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public List<KnockoutSideDto> Sides { get; set; } = new();
    public KnockoutRoundDto? Round { get; set; }
}
