using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
[PartialExtension(nameof(TemplateDto))] // to make Id optional
public class EditTemplateDto : TemplateDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}