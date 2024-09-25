using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season.Creation;

public class AddressAssignmentStrategy : IAddressAssignmentStrategy
{
    public async Task<bool> AssignAddresses(ProposalContext context, CancellationToken token)
    {
        return await AssignSeasonSharedAddressTeams(context, token)
               && await AssignSharedAddressTeamsPerDivision(context, token)
               && await AssignRemainingTeamsPerDivision(context, token);
    }

    private static async Task<bool> AssignSeasonSharedAddressTeams(ProposalContext context, CancellationToken token)
    {
        var seasonSharedAddresses = context.MatchContext
            .GetSeasonSharedAddresses()
            .Select(a =>
            {
                var allTeams = context.MatchContext.Teams.SelectMany(pair => pair.Value);
                return allTeams.Where(t => a.Any(aa => t.Address.Trim().Equals(aa.Trim(), StringComparison.OrdinalIgnoreCase))).ToArray();
            })
            .ToArray();
        var templateSeasonSharedAddressPlaceholders = context.Template.SharedAddresses;

        if (seasonSharedAddresses.Length > templateSeasonSharedAddressPlaceholders.Count)
        {
            context.Result.Errors.Add("Too many teams in the season with addresses shared across the divisions");
            return false;
        }

        var success = true;
        var index = 0;
        foreach (var division in context.MatchContext.Divisions)
        {
            var divisionalTeamIds = context.MatchContext.Teams[division.Id].ToHashSet();
            var teamsForThisDivisionWithSeasonSharedAddresses = seasonSharedAddresses
                .Select(array => array.Where(a => divisionalTeamIds.Contains(a)).ToArray())
                .ToArray();

            var divisionTemplate = context.Template.Divisions.ElementAtOrDefault(index);
            if (divisionTemplate == null)
            {
                success = false;
                context.Result.Errors.Add($"Division not found in template at index {index}");
                index++;
                continue;
            }

            var placeholdersInDivisionTemplate = divisionTemplate.Dates
                .SelectMany(d => d.Fixtures)
                .SelectMany(f => new[] {f.Home.Key, f.Away?.Key})
                .Where(a => a != null)
                .ToHashSet();
            var sharedAddressPlaceHoldersWithFixturesInThisDivisions = templateSeasonSharedAddressPlaceholders
                .Select(array => array.Where(a => placeholdersInDivisionTemplate.Contains(a.Key)).ToList())
                .ToList();

            success = await ApplyTemplatePlaceholders(
                context,
                teamsForThisDivisionWithSeasonSharedAddresses,
                sharedAddressPlaceHoldersWithFixturesInThisDivisions,
                "",
                token) && success;
            index++;
        }

        return success;
    }

    private static async Task<bool> AssignSharedAddressTeamsPerDivision(ProposalContext context, CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template);
        var success = true;

        foreach (var divisionMapping in divisionMappings)
        {
            token.ThrowIfCancellationRequested();

            var divisionSharedAddresses = divisionMapping.SharedAddressesFromSeason;
            var templateDivisionSharedAddressPlaceholders = divisionMapping.TemplateDivision.SharedAddresses;

            if (divisionSharedAddresses.Count > templateDivisionSharedAddressPlaceholders.Count)
            {
                context.Result.Errors.Add($"{divisionMapping.SeasonDivision.Name}: Too many teams with addresses shared");
                return false;
            }

            if (context.RequestedPlaceholderMappings.Any())
            {
                success = await AssignRequestedSharedAddressesPerDivision(context, divisionMapping, token);
            }

            var unmappedTeams = divisionMapping.SharedAddressesFromSeason.Select(grp => grp.Except(context.PlaceholderMapping.Values).ToArray()).Where(grp => grp.Any()).ToArray();
            success = await ApplyTemplatePlaceholders(
                context,
                unmappedTeams,
                divisionMapping.TemplateDivision.SharedAddresses,
                divisionMapping.SeasonDivision.Name + ": ",
                token) && success;
        }

        return success;
    }

    private static Task<bool> AssignRequestedSharedAddressesPerDivision(ProposalContext context,
        TemplateMatchContext.DivisionSharedAddressMapping divisionMapping,
        CancellationToken token)
    {
        foreach (var templateDivisionSharedAddressPlaceholder in divisionMapping.TemplateDivision.SharedAddresses)
        {
            token.ThrowIfCancellationRequested();

            TeamDto[]? teamsToUse = null;

            if (!templateDivisionSharedAddressPlaceholder.Any(placeholder => context.RequestedPlaceholderMappings.ContainsKey(placeholder.Key)))
            {
                // no placeholders have been mapped to teams
                continue;
            }

            foreach (var placeholder in templateDivisionSharedAddressPlaceholder)
            {
                token.ThrowIfCancellationRequested();

                var teamId = context.RequestedPlaceholderMappings[placeholder.Key];
                teamsToUse ??= divisionMapping.SharedAddressesFromSeason.SingleOrDefault(grp => grp.Any(t => t.Id == teamId)) ?? Array.Empty<TeamDto>();
                var team = teamsToUse.SingleOrDefault(t => t.Id == teamId);
                if (team == null)
                {
                    context.Result.Errors.Add($"Could not find team {teamId} in shared address group");
                    return Task.FromResult(false);
                }

                context.PlaceholderMapping.Add(placeholder.Key, team);
            }

            divisionMapping.TemplateDivision.SharedAddresses = divisionMapping.TemplateDivision.SharedAddresses.Except(new[] { templateDivisionSharedAddressPlaceholder }).ToList();
        }

        return Task.FromResult(true);
    }

    private static Task<bool> AssignRemainingTeamsPerDivision(ProposalContext context, CancellationToken token)
    {
        foreach (var divisionMapping in context.MatchContext.GetDivisionMappings(context.Template))
        {
            var remainingTeams = divisionMapping.Teams.Except(context.PlaceholderMapping.Values).ToList();
            var allPlaceholders = divisionMapping.TemplateDivision.Dates.SelectMany(d => d.Fixtures).Select(f => f.Home.Key).Distinct();
            var remainingPlaceholders = allPlaceholders.Except(context.PlaceholderMapping.Keys).ToList();

            foreach (var placeholder in context.RequestedPlaceholderMappings)
            {
                token.ThrowIfCancellationRequested();
                if (!remainingPlaceholders.Contains(placeholder.Key))
                {
                    continue;
                }

                var team = remainingTeams.SingleOrDefault(t => t.Id == placeholder.Value);
                if (team != null)
                {
                    context.PlaceholderMapping.Add(placeholder.Key, team);
                    remainingTeams.Remove(team);
                    remainingPlaceholders.Remove(placeholder.Key);
                }
            }

            while (remainingTeams.Any())
            {
                token.ThrowIfCancellationRequested();

                if (!remainingPlaceholders.Any())
                {
                    context.Result.Errors.Add($"{divisionMapping.SeasonDivision.Name}: More teams in division than templates support");
                    return Task.FromResult(false);
                }

                var nextTeam = SelectAndRemoveAtRandomIndex(remainingTeams);
                var nextPlaceholder = SelectAndRemoveAtRandomIndex(remainingPlaceholders);
                context.PlaceholderMapping.Add(nextPlaceholder, nextTeam);
            }
        }

        return Task.FromResult(true);
    }

    private static T SelectAndRemoveAtRandomIndex<T>(List<T> items)
    {
        var index = Random.Shared.Next(0, items.Count - 1);
        var item = items[index];
        items.RemoveAt(index);
        return item;
    }

    private static Task<bool> ApplyTemplatePlaceholders(
        ProposalContext context,
        IEnumerable<TeamDto[]> teams,
        IEnumerable<List<TeamPlaceholderDto>> placeholders,
        string messagePrefix,
        CancellationToken token)
    {
        var teamsOrderedLargestToSmallest = new Queue<TeamDto[]>(teams.OrderByDescending(a => a.Length));
        var placeholdersOrderedLargestToSmallest = new Queue<List<TeamPlaceholderDto>>(placeholders.OrderByDescending(a => a.Count));

        while (teamsOrderedLargestToSmallest.Any())
        {
            token.ThrowIfCancellationRequested();

            var largestSharedSeasonAddress = teamsOrderedLargestToSmallest.Dequeue();
            var largestTemplateSeasonSharedAddress = new Queue<TeamPlaceholderDto>(placeholdersOrderedLargestToSmallest.Dequeue());

            if (largestSharedSeasonAddress.Length > largestTemplateSeasonSharedAddress.Count)
            {
                context.Result.Errors.Add($"{messagePrefix}Shared address has more teams than the template supports");
                return Task.FromResult(false);
            }

            foreach (var team in largestSharedSeasonAddress)
            {
                var placeholder = largestTemplateSeasonSharedAddress.Dequeue();
                context.PlaceholderMapping.Add(placeholder.Key, team);
            }
        }

        return Task.FromResult(true);
    }
}
