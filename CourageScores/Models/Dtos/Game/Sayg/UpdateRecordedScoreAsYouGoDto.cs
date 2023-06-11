using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
public class UpdateRecordedScoreAsYouGoDto : RecordedScoreAsYouGoDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }

    /// <summary>
    /// Optional id to the match for which this SAYG session is related
    /// </summary>
    public Guid? TournamentMatchId { get; set; }
}