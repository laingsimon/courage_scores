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

        foreach (var division in context.GetDivisionMappings(template))
        {
            var templateTeams = division.TemplateDivision.Dates.SelectMany(d => d.Fixtures)
                .SelectMany(f => new[]
                {
                    f.Home, f.Away,
                }).Select(p => p?.Key)
                .Where(p => !string.IsNullOrEmpty(p))
                .Distinct()
                .ToArray();
            var seasonTeams = division.Teams;

            if (seasonTeams.Length > templateTeams.Length)
            {
                result.Success = false;
                result.Warnings.Add(
                    $"{division.SeasonDivision.Name} has {seasonTeams.Length} teams, template has fewer ({templateTeams.Length})");
            }
        }

        return Task.FromResult(result);
    }
}