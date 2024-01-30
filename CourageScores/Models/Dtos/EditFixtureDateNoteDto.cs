using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
[PropertyIsOptional(nameof(Id))]
public class EditFixtureDateNoteDto : FixtureDateNoteDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}