using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class SeasonHasRightNumberOfTeamsWithSharedAddress : ICompatibilityCheck
{
    public Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var seasonSharedAddresses = context.GetSeasonSharedAddresses();

        if (seasonSharedAddresses.Count > template.SharedAddresses.Count)
        {
            return Task.FromResult(new ActionResultDto<TemplateDto>
            {
                Success = false,
                Warnings =
                {
                    $"Template supports up-to {template.SharedAddresses.Count} cross-division shared addresses, found {seasonSharedAddresses.Count}",
                },
            });
        }

        return Task.FromResult(new ActionResultDto<TemplateDto>
        {
            Success = true,
        });
    }
}