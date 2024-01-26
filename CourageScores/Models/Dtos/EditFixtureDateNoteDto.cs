using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
[PropertyIsOptional(nameof(Id))]
public class EditFixtureDateNoteDto : FixtureDateNoteDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}