using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class EachDivisionHasRightNumberOfTeamsWithSharedAddress : ICompatibilityCheck
{
    public Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var result = new ActionResultDto<TemplateDto>
        {
            Success = true,
        };

        foreach (var division in context.GetDivisionMappings(template))
        {
            var seasonSharedAddresses = division.SharedAddressesFromSeason;

            if (seasonSharedAddresses.Count > division.TemplateDivision.SharedAddresses.Count)
            {
                result.Success = false;
                result.Warnings.Add($"{division.SeasonDivision.Name} has {seasonSharedAddresses.Count} shared addresses, template only supports {division.TemplateDivision.SharedAddresses.Count}");
            }
        }

        return Task.FromResult(result);
    }
}