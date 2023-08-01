using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public interface ICompatibilityCheck
{
    Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token);
}