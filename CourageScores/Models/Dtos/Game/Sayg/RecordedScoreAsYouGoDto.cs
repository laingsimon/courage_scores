namespace CourageScores.Models.Dtos.Game.Sayg;

public class RecordedScoreAsYouGoDto : AuditedDto
{
    /// <summary>
    /// The legs for the match
    /// </summary>
    public Dictionary<int, LegDto> Legs { get; set; } = new();
}