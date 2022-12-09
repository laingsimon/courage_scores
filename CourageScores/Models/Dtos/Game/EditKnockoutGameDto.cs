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

    public List<RecordKnockoutScoresPlayerDto> OneEighties { get; set; } = new ();
    public List<KnockoutOver100CheckoutDto> Over100Checkouts { get; set; } = new ();

    public class RecordKnockoutScoresPlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public class KnockoutOver100CheckoutDto : RecordKnockoutScoresPlayerDto
    {
        public string? Notes { get; set; }
    }
}
