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

        var divisions = template.Divisions
            .Zip(context.Divisions)
            .Select(mapping => new { templateDivision = mapping.First, seasonDivision = mapping.Second })
            .ToArray();

        foreach (var division in divisions)
        {
            var seasonSharedAddresses = division.seasonDivision.Teams.GroupBy(t => t.Address).Where(g => g.Count() > 1).ToArray();

            if (seasonSharedAddresses.Length > division.templateDivision.SharedAddresses.Count)
            {
                result.Success = false;
                result.Warnings.Add($"{division.seasonDivision.Name} has {seasonSharedAddresses.Length} shared addresses, template only supports {division.templateDivision.SharedAddresses.Count}");
            }
        }

        return Task.FromResult(result);
    }
}