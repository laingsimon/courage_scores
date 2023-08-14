using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class SameNumberOfDivisions : ICompatibilityCheck
{
    public Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context,
        CancellationToken token)
    {
        var result = new ActionResultDto<TemplateDto>
        {
            Success = true,
        };

        if (template.Divisions.Count != context.Divisions.Count)
        {
            result.Success = false;
            result.Warnings.Add($"Template has {template.Divisions.Count} divisions, season has {context.Divisions.Count}");
        }

        return Task.FromResult(result);
    }
}