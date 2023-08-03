using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
public class ProposalRequestDto
{
    public Guid SeasonId { get; set; }
    public Guid TemplateId { get; set; }
}