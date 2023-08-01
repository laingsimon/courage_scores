using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class CompositeCompatibilityCheck : ICompatibilityCheck
{
    private readonly IReadOnlyCollection<ICompatibilityCheck> _checks;

    public CompositeCompatibilityCheck(IEnumerable<ICompatibilityCheck> checks)
    {
        _checks = checks.ToArray();
    }

    public async Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var result = new ActionResultDto<TemplateDto>
        {
            Success = true,
        };

        foreach (var check in _checks)
        {
            var checkResult = await check.Check(template, context, token);
            result.Success = result.Success && checkResult.Success;
            result.Errors.AddRange(checkResult.Errors);
            result.Warnings.AddRange(checkResult.Warnings);
            result.Messages.AddRange(checkResult.Messages);
        }

        return result;
    }
}