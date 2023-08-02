using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class NoMoreThanTemplateDivisionTeamCount : ICompatibilityCheck
{
    public Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context,
        CancellationToken token)
    {
        var result = new ActionResultDto<TemplateDto>
        {
            Success = true,
        };

        var divisionMappings = template.Divisions
            .Zip(context.Divisions)
            .Select(mapping => new { templateDivision = mapping.First, seasonDivision = mapping.Second });

        foreach (var division in divisionMappings)
        {
            var templateTeams = division.templateDivision.Dates.SelectMany(d => d.Fixtures)
                .SelectMany(f => new[] { f.Home, f.Away }).Select(p => p?.Key).Where(p => !string.IsNullOrEmpty(p)).Distinct().ToArray();
            var seasonTeams = division.seasonDivision.Teams;

            if (seasonTeams.Count > templateTeams.Length)
            {
                result.Success = false;
                result.Warnings.Add($"{division.seasonDivision.Name} has {seasonTeams.Count} teams, template has fewer ({templateTeams.Length})");
            }
        }

        return Task.FromResult(result);
    }
}