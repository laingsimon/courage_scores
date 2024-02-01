using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
[PartialExtension(nameof(FixtureDateNoteDto))]
public class EditFixtureDateNoteDto : FixtureDateNoteDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}