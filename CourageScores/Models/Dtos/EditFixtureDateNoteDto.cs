using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class EditFixtureDateNoteDto : FixtureDateNoteDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}