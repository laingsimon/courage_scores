using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class ApplicableNumberOfTeamsInEachDivisionCheck : ICompatibilityCheck
{
    public async Task<ActionResultDto<TemplateDto>> Check(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var result = new ActionResultDto<TemplateDto>
        {
            Success = true,
        };

        if (context.Divisions.Count != template.Divisions.Count)
        {
            result.Errors.Add($"Incompatible number of divisions, template has {template.Divisions.Count} season has {context.Divisions.Count}");
            result.Success = false;
            return result;
        }

        var divisionIndex = 0;
        foreach (var division in context.Divisions)
        {
            var teamsInDivision = division.Teams.Count;
            var templateDivision = template.Divisions.ElementAt(divisionIndex);

            var teamPlaceholdersForDivision = templateDivision.Dates
                .SelectMany(d => d.Fixtures)
                .SelectMany(f => f.Away != null ? new[] { f.Home, f.Away } : new[] { f.Home })
                .Select(placeholder => placeholder.Key)
                .Distinct()
                .ToArray();

            var requiredNoOfTeamsInTemplate = (teamsInDivision % 2) > 0
                ? teamsInDivision + 1
                : teamsInDivision;

            if (teamPlaceholdersForDivision.Length != requiredNoOfTeamsInTemplate)
            {
                var lowerBoundary = (teamPlaceholdersForDivision.Length % 2) > 0
                    ? teamPlaceholdersForDivision.Length
                    : teamPlaceholdersForDivision.Length - 1;
                var upperBoundary = teamPlaceholdersForDivision.Length;
                result.Warnings.Add($"Template supports {lowerBoundary}-{upperBoundary} teams in division {divisionIndex + 1}, this season has {teamsInDivision} teams");
                result.Success = false;
            }

            divisionIndex++;
        }

        return result;
    }
}
