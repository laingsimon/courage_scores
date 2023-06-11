using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
public class UpdateRecordedScoreAsYouGoDto : RecordedScoreAsYouGoDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}