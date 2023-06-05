using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
public class RecordScoresDto : IGameDto, IIntegrityCheckDto
{
    public ManOfTheMatchDto? Home { get; set; } = new();
    public ManOfTheMatchDto? Away { get; set; } = new();
    public List<RecordScoresGameMatchDto> Matches { get; set; } = new();
    public string Address { get; set; } = null!;
    public bool Postponed { get; set; }
    public bool IsKnockout { get; set; }
    public bool AccoladesCount { get; set; }
    public DateTime Date { get; set; }
    public List<RecordScoresGamePlayerDto> OneEighties { get; set; } = new();
    public List<GameOver100CheckoutDto> Over100Checkouts { get; set; } = new();
    public List<GameMatchOptionDto?> MatchOptions { get; set; } = new();
    public DateTime? LastUpdated { get; set; }

    [ExcludeFromCodeCoverage]
    public class ManOfTheMatchDto
    {
        public Guid? ManOfTheMatch { get; set; }
    }

    [ExcludeFromCodeCoverage]
    public class RecordScoresGameMatchDto
    {
        public List<RecordScoresGamePlayerDto> HomePlayers { get; set; } = new();
        public int? HomeScore { get; set; }
        public List<RecordScoresGamePlayerDto> AwayPlayers { get; set; } = new();
        public int? AwayScore { get; set; }
        public ScoreAsYouGoDto? Sayg { get; set; }
    }

    [ExcludeFromCodeCoverage]
    public class RecordScoresGamePlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
    }

    [ExcludeFromCodeCoverage]
    public class GameOver100CheckoutDto : RecordScoresGamePlayerDto
    {
        public string? Notes { get; set; }
    }
}