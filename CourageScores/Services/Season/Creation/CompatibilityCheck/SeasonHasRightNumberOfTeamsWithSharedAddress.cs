using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class SeasonHasRightNumberOfTeamsWithSharedAddress : ICompatibilityCheck
{
    public Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var seasonSharedAddresses = context.Divisions
            .SelectMany(UnsharedAddress)
            .GroupBy(a => a)
            .Where(g => g.Count() > 1)
            .ToArray();

        if (seasonSharedAddresses.Length > template.SharedAddresses.Count)
        {
            return Task.FromResult(new ActionResultDto<TemplateDto>
            {
                Success = false,
                Warnings = { $"Template supports up-to {template.SharedAddresses.Count} cross-division shared addresses, found {seasonSharedAddresses.Length}" },
            });
        }

        return Task.FromResult(new ActionResultDto<TemplateDto>
        {
            Success = true,
        });
    }

    private IEnumerable<string> UnsharedAddress(DivisionDataDto division)
    {
        return division.Teams.GroupBy(t => t.Address).Where(g => g.Count() == 1).Select(g => g.Key);
    }
}