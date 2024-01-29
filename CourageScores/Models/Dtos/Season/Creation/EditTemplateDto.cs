using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
[PropertyIsOptional(nameof(Id))]
public class EditTemplateDto : TemplateDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}