using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
[PartialExtension(nameof(RecordedScoreAsYouGoDto))]
public class UpdateRecordedScoreAsYouGoDto : RecordedScoreAsYouGoDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}