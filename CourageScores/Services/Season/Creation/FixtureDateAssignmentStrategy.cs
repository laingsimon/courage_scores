using CourageScores.Models;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season.Creation;

public class FixtureDateAssignmentStrategy : IFixtureDateAssignmentStrategy
{
    public async Task<bool> AssignDates(ProposalContext context, CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template).ToList();
        var currentDate = context.MatchContext.SeasonDto.StartDate;
        var templateDateIndex = 0;
        var maxTemplateIndex = context.Template.Divisions.Select(d => d.Dates.Count).OrderByDescending(c => c).FirstOrDefault();
        var success = true;

        while (templateDateIndex < maxTemplateIndex)
        {
            token.ThrowIfCancellationRequested();

            var templateDateForDivisions = divisionMappings
                .Select(mapping => mapping.TemplateDivision.Dates.ElementAtOrDefault(templateDateIndex))
                .Cast<DateTemplateDto>()
                .ToArray();
            var fixtureDateForDivisions = context.MatchContext.Divisions
                .Select(d => d.Fixtures.Where(fd => fd.Date == currentDate).ToArray())
                .ToList();

            // there must be no fixtures, notes or tournaments on this date
            if (!AreThereAnyFixturesNotesOrTournaments(fixtureDateForDivisions))
            {
                // ok to provision fixtures for this date
                success = await ProvisionFixturesForThisDate(context, currentDate, templateDateForDivisions, token) && success;
                templateDateIndex++;
            }

            currentDate = currentDate.AddDays(7);
        }

        if (!success)
        {
            // add any placeholders where teams could not be found
            foreach (var placeholder in context.PlaceholdersWithoutTeams)
            {
                context.Result.Warnings.Add($"Could not find a team for a fixture - {placeholder}");
            }
        }

        var lastFixtureDateByDivision = context.Result.Result?.Divisions?.ToDictionary(d => d, d => MaxOrDefault(d.Fixtures, fd => fd.Date));
        var lastFixtureDateAnyDivision = MaxOrDefault(lastFixtureDateByDivision?.Values, d => d);
        if (lastFixtureDateAnyDivision > context.MatchContext.SeasonDto.EndDate)
        {
            context.Result.Errors.Add($"Some fixtures will be created after the season ends. You need to update the season end-date to see them. The last fixture was created on {lastFixtureDateAnyDivision:dd MMM yyyy}");
        }

        return success;
    }

    private static DateTime MaxOrDefault<T>(IEnumerable<T>? dates, Func<T, DateTime> selector)
    {
        return dates?.Select(selector).OrderByDescending(d => d).FirstOrDefault() ?? default;
    }

    private static bool AreThereAnyFixturesNotesOrTournaments(IEnumerable<IEnumerable<DivisionFixtureDateDto>> fixtureDateForDivisions)
    {
        return fixtureDateForDivisions.Aggregate(
            0,
            (current, prev) => current + prev.Count(d => d.Fixtures.Count + d.Notes.Count + d.TournamentFixtures.Count > 0)) > 0;
    }

    private static async Task<bool> ProvisionFixturesForThisDate(
        ProposalContext context,
        DateTime currentDate,
        IReadOnlyCollection<DateTemplateDto> templateDateForDivisions,
        CancellationToken token)
    {
        var divisionMappings = context.MatchContext.GetDivisionMappings(context.Template);
        var success = true;
        var division = 0;

        foreach (var (sharedAddressMapping, dateTemplate) in divisionMappings.Zip(templateDateForDivisions))
        {
            token.ThrowIfCancellationRequested();
            var season = context.MatchContext.SeasonDto;

            division++;
            var weekOffset = 1 + (currentDate - season.StartDate).TotalDays / 7;
            var fixturesToCreate = dateTemplate.Fixtures ?? throw new NullReferenceException($"No fixtures for week {weekOffset} in division {division}");
            var divisionToAddFixturesTo = sharedAddressMapping.SeasonDivision ?? throw new NullReferenceException($"No second division for week {weekOffset} in division {division}");
            var fixtureDate = divisionToAddFixturesTo.Fixtures.FirstOrDefault(fd => fd.Date == currentDate);
            if (fixtureDate == null)
            {
                fixtureDate = new DivisionFixtureDateDto
                {
                    Date = currentDate,
                };
                divisionToAddFixturesTo.Fixtures = divisionToAddFixturesTo.Fixtures.Concat([fixtureDate]).OrderBy(f => f.Date).ToList();
            }

            success = await CreateFixturesForDate(context, fixturesToCreate, fixtureDate, token) && success;
            foreach (var note in dateTemplate.Notes.Where(n => n.DivisionNumber == division).Concat(GetCrossDivisionalNotesFromAllTemplates(templateDateForDivisions)))
            {
                ConvertToNote(note, currentDate, season.Id, context.MatchContext.Divisions, divisionToAddFixturesTo);
            }
        }

        return success;
    }

    private static IEnumerable<NoteTemplateDto> GetCrossDivisionalNotesFromAllTemplates(IReadOnlyCollection<DateTemplateDto> templateDateForDivisions)
    {
        return templateDateForDivisions.SelectMany(d => d.Notes).Where(n => n.DivisionNumber == null);
    }

    private static void ConvertToNote(
        NoteTemplateDto noteTemplate,
        DateTime date,
        Guid seasonId,
        List<DivisionDataDto> divisions,
        DivisionDataDto divisionToAddFixturesTo)
    {
        var noteDate = noteTemplate.AlternativeDayOfWeek == null || noteTemplate.AlternativeDayOfWeek == date.DayOfWeek
            ? date
            : GetPreviousDate(date, noteTemplate.AlternativeDayOfWeek.Value);

        var note = new FixtureDateNoteDto
        {
            Note = noteTemplate.Note,
            Date = noteDate,
            DivisionId = noteTemplate.DivisionNumber != null
                ? divisions[noteTemplate.DivisionNumber.Value - 1].Id
                : null,
            SeasonId = seasonId,
        };

        var fixtureDate = divisionToAddFixturesTo.Fixtures.FirstOrDefault(fd => fd.Date == noteDate);
        if (fixtureDate == null)
        {
            fixtureDate = new DivisionFixtureDateDto
            {
                Date = noteDate,
            };
            divisionToAddFixturesTo.Fixtures = divisionToAddFixturesTo.Fixtures.Concat([fixtureDate]).OrderBy(f => f.Date).ToList();
        }
        fixtureDate.Notes.Add(note);
    }

    private static DateTime GetPreviousDate(DateTime date, DayOfWeek dayOfWeek)
    {
        var startOfWeek = date.AddDays(-(int)date.DayOfWeek).AddDays(1); // monday
        var dayOfWeekNumber = dayOfWeek == DayOfWeek.Sunday
            ? 6 // otherwise sunday (0) -> -1. In the UK, Monday is commonly recognised as the start of the week
            : (int)dayOfWeek - 1;

        return startOfWeek.AddDays(dayOfWeekNumber);
    }

    private static Task<bool> CreateFixturesForDate(ProposalContext context, List<FixtureTemplateDto> fixturesToCreate, DivisionFixtureDateDto fixtureDate, CancellationToken token)
    {
        var success = true;

        foreach (var fixtureToCreate in fixturesToCreate)
        {
            token.ThrowIfCancellationRequested();

            TeamDto? awayTeam = null;
            context.PlaceholderMapping.TryGetValue(fixtureToCreate.Home.Key, out var homeTeam);
            if (fixtureToCreate.Away != null)
            {
                context.PlaceholderMapping.TryGetValue(fixtureToCreate.Away.Key, out awayTeam);
            }

            if (homeTeam == null)
            {
                context.Result.Success = false;
                context.PlaceholdersWithoutTeams.Add(fixtureToCreate.Home.Key);
                success = false;
                continue;
            }

            if (awayTeam == null && fixtureToCreate.Away?.Key != null)
            {
                context.Result.Success = false;
                context.PlaceholdersWithoutTeams.Add(fixtureToCreate.Away.Key);
                success = false;
                continue;
            }

            fixtureDate.Fixtures.Add(new DivisionFixtureDto
            {
                Id = homeTeam.Id,
                Proposal = true,
                HomeTeam =
                    new DivisionFixtureTeamDto
                    {
                        Id = homeTeam.Id,
                        Name = homeTeam.Name,
                        Address = homeTeam.AddressOrName(),
                    },
                AwayTeam = awayTeam != null
                    ? new DivisionFixtureTeamDto
                    {
                        Id = awayTeam.Id,
                        Name = awayTeam.Name,
                        Address = awayTeam.AddressOrName(),
                    }
                    : null,
                IsKnockout = false,
                Postponed = false,
                AccoladesCount = true,
                AwayScore = null,
                HomeScore = null,
            });
        }

        return Task.FromResult(success);
    }
}
